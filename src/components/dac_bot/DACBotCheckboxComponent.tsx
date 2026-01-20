import React, { useEffect, useState } from 'react'
import { DACbotRule, ParsedDACbotRule } from 'src/components/dac_bot/DACBotComponent'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import { DAC } from 'src/libs/ajax/DAC'
import { Link } from '@mui/material'
import { Notifications } from 'src/libs/utils'
import ReactMarkdown from 'react-markdown'

export type DACBotCheckboxComponentProps = {
  dacId: number
  rule: DACbotRule | ParsedDACbotRule
  disableEdit: boolean
  onRuleChange?: (rule: ParsedDACbotRule, isEnabled: boolean) => Promise<void>
}

export type DACBotToggleResult = {
  ruleId: number
  isRuleEnabled: boolean
  enabledTime: number
  displayName: string | null
  email: string | null
}

export const DACBotCheckboxComponent = (props: DACBotCheckboxComponentProps) => {
  const { dacId, rule, disableEdit, onRuleChange } = props
  const [isReadOnly, setIsReadOnly] = useState(disableEdit)
  const [isRuleEnabled, setIsRuleEnabled] = useState(!!rule.enabledByUserId)
  const [enabledTime, setEnabledTime] = useState(rule.activationDate)
  const [displayName, setDisplayName] = useState(rule.displayName)
  const [emailAddress, setEmailAddress] = useState(rule.userEmail)
  const [isLoading, setIsLoading] = useState(false)

  // Sync local state when rule prop changes
  useEffect(() => {
    setIsRuleEnabled(!!rule.enabledByUserId)
    setEnabledTime(rule.activationDate)
    setDisplayName(rule.displayName)
    setEmailAddress(rule.userEmail)
  }, [rule])

  const onCheckboxChange = async () => {
    setIsReadOnly(true)
    setIsLoading(true)
    try {
      const newEnabledState = !isRuleEnabled

      if (onRuleChange) {
        await onRuleChange(rule as ParsedDACbotRule, newEnabledState)
      }
      else {
        const toggleResult: DACBotToggleResult = await DAC.toggleDACbotRule(dacId, rule.id)
        setIsRuleEnabled(toggleResult.isRuleEnabled)
        setEnabledTime(toggleResult.enabledTime)
        setDisplayName(toggleResult.displayName)
        setEmailAddress(toggleResult.email)
      }
      Notifications.showSuccess({
        severity: 'success',
        text: 'Automation rule successfully saved.',
        timeout: 3500,
        layout: {
          vertical: 'bottom',
          horizontal: 'right',
        },
      })
      setIsReadOnly(false)
      setIsLoading(false)
    }
    catch (_) {
      setIsReadOnly(false)
      setIsLoading(false)
      Notifications.showError({
        severity: 'error',
        text: 'Error: Unable to change automation rule. Please try this operation again.',
        timeout: 3500,
        layout: {
          vertical: 'bottom',
          horizontal: 'right',
        },
      })
    }
  }

  const isDisabledByExclusive = 'isDisabled' in rule ? rule.isDisabled : false

  return (
    <FormField
      type={FormFieldTypes.CHECKBOX}
      id={`${rule.id}_checkbox`}
      toggleText={(
        <>
          <span style={{ display: 'table' }}>
            <ReactMarkdown components={{
              p: 'span',
            }}
            >
              {rule.description}
            </ReactMarkdown>
          </span>
          {' '}
          {isRuleEnabled
            ? (
                <span>
                  Enabled by:
                  {' '}
                  <Link href={`mailto:${emailAddress}`}>{displayName}</Link>
                  {' '}
                  ({ new Date(enabledTime).toDateString()}
                  )
                </span>
              )
            : ``}
        </>
      )}
      defaultValue={!!rule.enabledByUserId}
      onChange={onCheckboxChange}
      disabled={isReadOnly || isLoading || isDisabledByExclusive}
    />
  )
}
