import React, { useCallback, useEffect, useState } from 'react'
import { DAC } from '../../libs/ajax/DAC'
import { Notifications } from '../../libs/utils'
import { DACBotCheckboxComponent } from './DACBotCheckboxComponent'
import { Storage } from '../../libs/storage'

export type DACBotComponentProps = {
  'dacId': number
  'data-cy'?: string
}

enum RuleState {
  AVAILABLE = 'AVAILABLE',
  DEPRECATED = 'DEPRECATED',
  UNAVAILABLE = 'UNAVAILABLE',
};

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

export type DACbotChangeResult = {
  ruleId: number
  isRuleEnabled: boolean
}

export const DACBotComponent = (props: DACBotComponentProps) => {
  const { dacId, 'data-cy': dataCy } = props
  const [DACbotRules, setDACbotRules] = useState<Array<DACbotRule>>([])
  const [isLoading, setIsLoading] = useState(true)
  const userIsChair = Storage.getCurrentUser().roles.filter((r: { dacId: number, name: string }) => {
    return r.dacId == dacId && r.name == 'Chairperson'
  }).length > 0
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

  useEffect(() => {
    fetchData().then()
  }, [dacId, fetchData, setDACbotRules, setIsLoading])

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
      {!isLoading && DACbotRules.map((rule) => {
        return <DACBotCheckboxComponent dacId={dacId} rule={rule} key={rule.id} disableEdit={!userIsChair} />
      })}
    </div>
  )
}
