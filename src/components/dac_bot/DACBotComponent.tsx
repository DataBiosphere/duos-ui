import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DAC } from 'src/libs/ajax/DAC'
import { Notifications } from 'src/libs/utils'
import { DACBotCheckboxComponent } from './DACBotCheckboxComponent'
import { Storage } from 'src/libs/storage'
import { UserRole } from 'src/types/model'

export type DACBotComponentProps = {
  'dacId': number
  'data-cy'?: string
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

const MUTUALLY_EXCLUSIVE_RULES: { [key: string]: string } = {
  REQUIRE_SO_DAR_APPROVAL: 'AUTO_OPEN_DAR_FOR_ALL_MEMBERS',
  AUTO_OPEN_DAR_FOR_ALL_MEMBERS: 'REQUIRE_SO_DAR_APPROVAL',
}

export const DACBotComponent = (props: DACBotComponentProps) => {
  const { dacId, 'data-cy': dataCy } = props
  const [DACbotRules, setDACbotRules] = useState<Array<DACbotRule>>([])
  const [isLoading, setIsLoading] = useState(true)
  const userIsChair = Storage.getCurrentUser().roles.some((r: UserRole) => r.dacId == dacId && r.name == 'Chairperson')

  const parsedRules = useMemo(() => {
    return DACbotRules.map((rule: DACbotRule) => {
      const exclusiveRuleType = MUTUALLY_EXCLUSIVE_RULES[rule.ruleType]
      const isExclusiveRuleEnabled = exclusiveRuleType && DACbotRules.some((r: DACbotRule) => r.ruleType === exclusiveRuleType && r.enabledByUserId)

      return {
        ...rule,
        exclusiveRuleType,
        isDisabled: !!isExclusiveRuleEnabled,
      }
    })
  }, [DACbotRules])

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const rules = await DAC.fetchDACbotRules(dacId)
      setIsLoading(false)
      setDACbotRules(rules)
      return rules
    }
    catch (_e) {
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

  const handleRuleChange = useCallback(async (rule: ParsedDACbotRule, isEnabled: boolean) => {
    try {
      // Toggle the current rule
      await DAC.toggleDACbotRule(dacId, rule.id)

      const updatedRuleIds = [rule.id]

      // If enabling this rule, disable its exclusive counterpart
      if (isEnabled && rule.exclusiveRuleType) {
        const exclusiveRule = DACbotRules.find(r => r.ruleType === rule.exclusiveRuleType)
        if (exclusiveRule?.enabledByUserId) {
          await DAC.toggleDACbotRule(dacId, exclusiveRule.id)
          updatedRuleIds.push(exclusiveRule.id)
        }
      }

      // Fetch all rules
      const allRules = await DAC.fetchDACbotRules(dacId)

      const createUpdatedRulesMap = (allRules: DACbotRule[], updatedRuleIds: number[]) => {
        const rulesMap = new Map(allRules.map(r => [r.id, r]))
        return (r: DACbotRule) => updatedRuleIds.includes(r.id) ? rulesMap.get(r.id) || r : r
      }

      // Update state with only the rules that changed
      setDACbotRules(prevRules =>
        prevRules.map(createUpdatedRulesMap(allRules, updatedRuleIds)),
      )
    }
    catch (_error) {
      Notifications.showError(
        {
          severity: 'error',
          text: 'Error: Unable to update automation rule. Please try again.',
          timeout: 3500,
          layout: {
            vertical: 'bottom',
            horizontal: 'right',
          },
        },
      )
      console.error('Failed to fetch DAC bot rules:', _error)
    }
  }, [dacId, DACbotRules])

  useEffect(() => {
    (async () => {
      await fetchData()
    })()
  }, [dacId, fetchData])

  return (
    <div data-cy={dataCy} data-dac-id={dacId.toString()}>
      <h4>Rule Automated Data Access Request (RADAR) Settings</h4>
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
      <h5>Rules</h5>
      {!isLoading && parsedRules.map((rule) => {
        return <DACBotCheckboxComponent dacId={dacId} rule={rule} key={rule.id} disableEdit={!userIsChair || rule.isDisabled} onRuleChange={handleRuleChange} />
      })}
    </div>
  )
}
