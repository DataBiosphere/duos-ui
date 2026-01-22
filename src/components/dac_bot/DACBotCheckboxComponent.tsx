import React, { useState } from 'react'
import { ParsedDACbotRule } from 'src/components/dac_bot/DACBotComponent'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import { Link } from '@mui/material'
import { Notifications } from 'src/libs/utils'
import ReactMarkdown from 'react-markdown'

export type DACBotCheckboxComponentProps = {
  rule: ParsedDACbotRule
  disableEdit: boolean
  onRuleChange: (rule: ParsedDACbotRule, isEnabled: boolean) => Promise<void>
}

export const DACBotCheckboxComponent = (props: DACBotCheckboxComponentProps) => {
  const { rule, disableEdit, onRuleChange } = props
  const [isReadOnly, setIsReadOnly] = useState(disableEdit || false)
  const [isLoading, setIsLoading] = useState(false)
  const [checked, setChecked] = useState(!!rule.enabledByUserId)

  const onCheckboxChange = async () => {
    const newChecked = !checked
    setChecked(newChecked)
    setIsReadOnly(true)
    setIsLoading(true)
    try {
      const newEnabledState = !rule.enabledByUserId
      await onRuleChange(rule, newEnabledState)
      Notifications.showSuccess({
        severity: 'success',
        text: 'Automation rule successfully saved.',
        timeout: 3500,
        layout: {
          vertical: 'bottom',
          horizontal: 'right',
        },
      })
    }
    catch (_) {
      setChecked(!newChecked) // Revert on failure
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
    finally {
      setIsReadOnly(false)
      setIsLoading(false)
    }
  }

  return (
    <FormField
      type={FormFieldTypes.CHECKBOX}
      id={`${rule.id}_checkbox`}
      toggleText={(
        <>
          <span style={{ display: 'table' }}>
            <ReactMarkdown components={{ p: 'span' }}>
              {rule.description}
            </ReactMarkdown>
          </span>
          {' '}
          {!!rule.enabledByUserId && rule.displayName && rule.userEmail && rule.activationDate
            ? (
                <span>
                  Enabled by:
                  {' '}
                  <Link href={`mailto:${rule.userEmail}`}>{rule.displayName}</Link>
                  {' '}
                  ({ new Date(rule.activationDate).toDateString() })
                </span>
              )
            : ``}
        </>
      )}
      defaultValue={checked}
      onChange={onCheckboxChange}
      disabled={isReadOnly || isLoading || rule.isDisabled}
    />
  )
}
