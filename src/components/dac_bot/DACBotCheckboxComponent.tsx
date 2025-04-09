import React, {useState} from 'react';
import {DACbotChangeResult, DACbotRule} from "./DACBotComponent";
import {FormField, FormFieldTypes} from "../forms/forms";
import {DAC} from "../../libs/ajax/DAC";
import {Link} from "@mui/material";
import {Notifications} from "../../libs/utils";
import ReactMarkdown from "react-markdown";

export type DACBotCheckboxComponentProps = {
    dacId: number,
    rule: DACbotRule,
    disableEdit: boolean,
}

export type DACBotToggleResult = {
    ruleId: number,
    isRuleEnabled: boolean,
    enabledTime: number,
    displayName: string | null,
    email: string | null,
}

export const DACBotCheckboxComponent = (props: DACBotCheckboxComponentProps) => {
    const {dacId, rule, disableEdit} = props;
    const [isReadOnly, setIsReadOnly] = useState(disableEdit);
    const [isRuleEnabled, setIsRuleEnabled] = useState(!!rule.enabledByUserId)
    const [enabledTime, setEnabledTime] = useState(rule.activationDate);
    const [displayName, setDisplayName] = useState(rule.displayName);
    const [emailAddress, setEmailAddress] = useState(rule.userEmail);


    const onCheckboxChange = async () => {
        setIsReadOnly(true);
        try {
            const toggleResult: DACBotToggleResult = await DAC.toggleDACbotRule(dacId, rule.id)
            Notifications.showSuccess(
                {
                    severity: 'success',
                    text: 'Automation rule successfully saved.',
                    timeout: 3500,
                    layout: {
                        vertical: 'bottom',
                        horizontal: 'right'
                    }
                });
            setIsReadOnly(false);
            setIsRuleEnabled(toggleResult.isRuleEnabled);
            setEnabledTime(toggleResult.enabledTime);
            setDisplayName(toggleResult.displayName);
            setEmailAddress(toggleResult.email);
        } catch (_) {
            Notifications.showError(
                {
                    severity: 'error',
                    text: 'Error: Unable to change automation rule.  Please try this operation again.',
                    timeout: 3500,
                    layout: {
                        vertical: 'bottom',
                        horizontal: 'right'
                    }
                });
        }
    };

    return (
        <FormField
            type={FormFieldTypes.CHECKBOX}
            id={`${rule.id}_checkbox`}
            toggleText={<><span style={{display:'table'}}><ReactMarkdown components={{
                // Map `p` to use `span`s to align with the checkbox.
                p: 'span'
            }}>{rule.description}</ReactMarkdown></span> {isRuleEnabled ?
                <span>Enabled by: <Link href={`mailto:${emailAddress}`}>{displayName}</Link>  ({ new Date(enabledTime).toDateString()})</span>: ``}</>}
            defaultValue={rule.enabledByUserId != null}
            onChange={onCheckboxChange}
            disabled={isReadOnly}
        />);
}