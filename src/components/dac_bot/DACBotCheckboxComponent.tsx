import React, { useState } from 'react'
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

  const onCheckboxChange = async () => {
    setIsReadOnly(true)
    try {
      const newEnabledState = !isRuleEnabled

      // If a custom onRuleChange callback is provided, use it
      if (onRuleChange) {
        await onRuleChange(rule as ParsedDACbotRule, newEnabledState)
      }
      else {
        // Fallback to direct toggle
        const toggleResult: DACBotToggleResult = await DAC.toggleDACbotRule(dacId, rule.id)
        setIsRuleEnabled(toggleResult.isRuleEnabled)
        setEnabledTime(toggleResult.enabledTime)
        setDisplayName(toggleResult.displayName)
        setEmailAddress(toggleResult.email)
      }

      Notifications.showSuccess(
        {
          severity: 'success',
          text: 'Automation rule successfully saved.',
          timeout: 3500,
          layout: {
            vertical: 'bottom',
            horizontal: 'right',
          },
        },
      )
      setIsReadOnly(false)
    }
    catch (_) {
      setIsReadOnly(false)
      Notifications.showError(
        {
          severity: 'error',
          text: 'Error: Unable to change automation rule.  Please try this operation again.',
          timeout: 3500,
          layout: {
            vertical: 'bottom',
            horizontal: 'right',
          },
        },
      )
    }
  }

  return (
    <FormField
      type={FormFieldTypes.CHECKBOX}
      id={`${rule.id}_checkbox`}
      toggleText={(
        <>
          <span style={{ display: 'table' }}>
            <ReactMarkdown components={{
              // Map `p` to use `span` to align with the checkbox.
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
                  (
                  { new Date(enabledTime).toDateString()}
                  )
                </span>
              )
            : ``}
        </>
      )}
      defaultValue={!!rule.enabledByUserId}
      onChange={onCheckboxChange}
      disabled={isReadOnly}
    />
  )
}
