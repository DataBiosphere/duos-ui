import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DAC } from 'src/libs/ajax/DAC'
import { Notifications } from 'src/libs/utils'
import { DACBotCheckboxComponent } from './DACBotCheckboxComponent'
import { Storage } from 'src/libs/storage'
import { UserRole } from 'src/types/model'

export type DACBotComponentProps = {
  'dacId': number
  'data-cy'?: string
  'mutuallyExclusiveRules'?: { [key: string]: string }
}

enum RuleState {
  AVAILABLE = 'AVAILABLE',
  DEPRECATED = 'DEPRECATED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export type DACbotRule = {
  id: number
  ruleType: string
  description: string
  ruleState: RuleState
  activationDate: number
  enabledByUserId: number | null
  displayName: string | null
  userEmail: string | null
}

export type ParsedDACbotRule = DACbotRule & {
  exclusiveRuleType?: string
  isDisabled: boolean
}

/**
 * Mapping of mutually exclusive rules. If one rule is enabled, the other must be disabled.
 *
 * E.g., if REQUIRE_SO_DAR_APPROVAL is enabled, AUTO_OPEN_DAR_FOR_ALL_MEMBERS must be disabled, and vice versa.
 *  {
 *    REQUIRE_SO_DAR_APPROVAL: 'AUTO_OPEN_DAR_FOR_ALL_MEMBERS',
 *    AUTO_OPEN_DAR_FOR_ALL_MEMBERS: 'REQUIRE_SO_DAR_APPROVAL'
 *  }
 */
const DEFAULT_MUTUALLY_EXCLUSIVE_RULES: { [key: string]: string } = {}

type RuleGroupLabel
  = | 'Automatically approve DARs when...'
    | 'Send DARs to the entire DAC on submission by researchers?'
    | 'Require researchers\' Signing Officials to sign-off on DARs and DAAs, prior to the DAC recieving the DAR?'

/** Maps each ruleType to a visual group heading */
const RULE_GROUP_LABELS: { [key: string]: RuleGroupLabel } = {
  GRU_V1: 'Automatically approve DARs when...',
  HMB_V1: 'Automatically approve DARs when...',
  GRU_DSV1: 'Automatically approve DARs when...',
  HMB_DSV1: 'Automatically approve DARs when...',
  AUTO_OPEN_DAR_FOR_ALL_MEMBERS: 'Send DARs to the entire DAC on submission by researchers?',
  REQUIRE_SO_DAR_APPROVAL: 'Require researchers\' Signing Officials to sign-off on DARs and DAAs, prior to the DAC recieving the DAR?',
}

/** Order in which groups appear; rules with unknown types go last */
const GROUP_ORDER: RuleGroupLabel[] = [
  'Automatically approve DARs when...',
  'Send DARs to the entire DAC on submission by researchers?',
  'Require researchers\' Signing Officials to sign-off on DARs and DAAs, prior to the DAC recieving the DAR?',
]

/** Stable data-cy key for each group label — avoids fragile long-string selectors in tests */
const RULE_GROUP_DATA_CY_KEYS: { [key: string]: string } = {
  'Automatically approve DARs when...': 'automatic-approval',
  'Send DARs to the entire DAC on submission by researchers?': 'automatic-open',
  'Require researchers\' Signing Officials to sign-off on DARs and DAAs, prior to the DAC recieving the DAR?': 'so-prior-approval',
}

/** Client-side description overrides for rules whose server description differs from desired display text */
const DESCRIPTION_OVERRIDES: { [key: string]: string } = {
  AUTO_OPEN_DAR_FOR_ALL_MEMBERS: 'Yes, automatically open DARs for all DAC members upon submission, without requiring Chair to open manually.',
  REQUIRE_SO_DAR_APPROVAL: 'Yes, require approval by the Signing Official identified in the Data Access Request (DAR) prior to DAC Voting.',
}

const APPROVAL_PREFIX = 'Automatically approve Data Access Requests (DARs) when the'

const stripApprovalPrefix = (description: string): string => {
  if (!description.startsWith(APPROVAL_PREFIX)) return description
  const remainder = description.slice(APPROVAL_PREFIX.length).trimStart()
  const cleaned = remainder
    .replace('primary purpose of the ', '')
    .replace(' and ', ' and  \n')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

/**
 * Groups parsed rules by their visual group label, preserving order within each group.
 * Rules with unrecognized ruleTypes are placed in an "Other" group at the end.
 */
const groupRules = (rules: ParsedDACbotRule[]): { label: RuleGroupLabel | 'Other', rules: ParsedDACbotRule[] }[] => {
  const groups = new Map<RuleGroupLabel | 'Other', ParsedDACbotRule[]>()
  for (const rule of rules) {
    const label = RULE_GROUP_LABELS[rule.ruleType] ?? 'Other'
    if (!groups.has(label)) {
      groups.set(label, [])
    }
    groups.get(label)!.push(rule)
  }
  const orderedLabels = [
    ...GROUP_ORDER.filter(l => groups.has(l)),
    ...Array.from(groups.keys()).filter(l => !GROUP_ORDER.includes(l as RuleGroupLabel)),
  ]
  return orderedLabels.map(label => ({ label, rules: groups.get(label)! }))
}

export const DACBotComponent = (props: DACBotComponentProps) => {
  const { dacId, 'data-cy': dataCy, mutuallyExclusiveRules = DEFAULT_MUTUALLY_EXCLUSIVE_RULES } = props
  const [DACbotRules, setDACbotRules] = useState<Array<DACbotRule>>([])
  const [isLoading, setIsLoading] = useState(true)
  const userIsChair = Storage.getCurrentUser().roles.some((r: UserRole) => r.dacId == dacId && r.name == 'Chairperson')

  const parsedRules = useMemo(() => {
    return DACbotRules.map((rule: DACbotRule) => {
      const exclusiveRuleType = mutuallyExclusiveRules[rule.ruleType]
      const isExclusiveRuleEnabled = exclusiveRuleType && DACbotRules.some((r: DACbotRule) => r.ruleType === exclusiveRuleType && r.enabledByUserId)

      return {
        ...rule,
        description: DESCRIPTION_OVERRIDES[rule.ruleType] ?? stripApprovalPrefix(rule.description),
        exclusiveRuleType,
        isDisabled: !!isExclusiveRuleEnabled,
      }
    })
  }, [DACbotRules, mutuallyExclusiveRules])

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const rules = await DAC.fetchDACbotRules(dacId)
      setIsLoading(false)
      setDACbotRules(rules)
      return rules
    }
    catch {
      Notifications.showError(
        {
          severity: 'error',
          text: 'Error: Unable to retrieve DAC Auto Approval rules from server',
          timeout: 3500,
          layout: {
            vertical: 'bottom',
            horizontal: 'right',
          },
        })
    }
  }, [dacId])

  const handleRuleChange = useCallback(async (rule: ParsedDACbotRule, isEnabled: boolean): Promise<void> => {
    const updatedRuleIds = [rule.id]
    try {
      // Toggle the current rule
      await DAC.toggleDACbotRule(dacId, rule.id)

      // If enabling this rule, disable its exclusive counterpart
      if (isEnabled && rule.exclusiveRuleType) {
        const exclusiveRule = DACbotRules.find(r => r.ruleType === rule.exclusiveRuleType)
        if (exclusiveRule?.enabledByUserId) {
          await DAC.toggleDACbotRule(dacId, exclusiveRule.id)
          updatedRuleIds.push(exclusiveRule.id)
        }
      }
    }
    finally {
      try {
        // Fetch updated rules to refresh state
        const allRules = await DAC.fetchDACbotRules(dacId)
        const createUpdatedRulesMap = (allRules: DACbotRule[], updatedRuleIds: number[]) => {
          const rulesMap = new Map(allRules.map(r => [r.id, r]))
          return (r: DACbotRule) => updatedRuleIds.includes(r.id) ? rulesMap.get(r.id) || r : r
        }
        setDACbotRules(prevRules =>
          prevRules.map(createUpdatedRulesMap(allRules, updatedRuleIds)),
        )
      }
      catch {
        Notifications.showError({ text: 'Failed to refresh DAC rules.' })
      }
    }
  }, [dacId, DACbotRules])

  useEffect(() => {
    (async () => {
      await fetchData()
    })()
  }, [dacId, fetchData])

  return (
    <div data-cy={dataCy} data-dac-id={dacId.toString()}>
      <p>
        Data Access Committees may automate Data Access Requests for a limited set of data use terms, namely datasets that are
        {' '}
        <b>only</b>
        {' '}
        tagged with either General Research Use or Health/Medical/Biomedical use and
        {' '}
        <b>without</b>
        {' '}
        modifiers (e.g. Non-Profit Use, Genetic Studies Only, etc).
      </p>
      <p>
        Users from any of the following countries will not be approved consistent with
        {' '}
        <a href="https://www.ecfr.gov/current/title-28/chapter-I/part-202" target="_blank" rel="noreferrer">28 Code of Federal Regulations (CFR) Part 202</a>
        {' '}
        :  China (including Hong Kong and Macau), Russia, Iran, North Korea, Cuba, and Venezuela.
      </p>
      <p>
        Check the box below to opt in to this feature, and then select the data use terms for which Data Access Requests you would like automated.
      </p>
      {!isLoading && groupRules(parsedRules).map(({ label, rules }) => {
        const dataCy = RULE_GROUP_DATA_CY_KEYS[label] ?? label.toLowerCase().replace(/\s+/g, '-')
        return (
          <div key={label} data-cy={`rule-group-${dataCy}`} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#333' }}>{label}</h4>
            {rules.map(rule => (
              <DACBotCheckboxComponent
                rule={rule}
                key={rule.id}
                disableEdit={!userIsChair || rule.isDisabled}
                onRuleChange={handleRuleChange}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
