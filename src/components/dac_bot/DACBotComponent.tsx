import React, {useCallback, useEffect, useState} from 'react';
import {DAC} from '../../libs/ajax/DAC';
import {Notifications} from '../../libs/utils';
import {DACBotCheckboxComponent} from "./DACBotCheckboxComponent";
import {Storage} from "../../libs/storage";

export type DACBotComponentProps = {
    dacId: number
}

enum RuleState {
    AVAILABLE = "AVAILABLE",
    DEPRECATED = "DEPRECATED",
    UNAVAILABLE = "UNAVAILABLE"
};

export type DACbotRule = {
    id: number,
    ruleType: string,
    description: string,
    ruleState: RuleState,
    activationDate: number,
    enabledByUserId: number | null,
    displayName: string | null,
    userEmail: string | null
}

export type DACbotChangeResult = {
    ruleId: number,
    isRuleEnabled: boolean
}

export const DACBotComponent = (props: DACBotComponentProps) => {
    const {dacId} = props;
    const [DACbotRules, setDACbotRules] = useState<Array<DACbotRule>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const userIsChair = Storage.getCurrentUser().roles.filter((r: { dacId: number; name: string; }) => {
       return  r.dacId == dacId && r.name == "Chairperson"
    }).length > 0;
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const rules = await DAC.fetchDACbotRules(dacId);
            setIsLoading(false);
            setDACbotRules(rules);
            return rules;
        } catch (_e) {
            Notifications.showError(
                {
                    severity: 'error',
                    text: 'Error: Unable to retrieve DAC Auto Approval rules from server',
                    timeout: 3500,
                    layout: {
                        vertical: 'bottom',
                        horizontal: 'right'
                    }
                });
        }
    }, [dacId]);

    useEffect(() => {
        fetchData().then();
    }, [dacId, fetchData, setDACbotRules, setIsLoading]);

    return (<div>
        <h4>Automatic Approval of DAC Requests</h4>
        DUOS offers Data Access Committees the option to automate Data Access Requests for a limited set of data use
        terms, namely datasets that are tagged with either and only the data use terms General Research Use or
        Health/Medical/Biomedical use - not including datasets that have those terms with modifiers such as Non-Profit
        Use only or Genetic Studies Only. If you would like Data Access Requests for this Data Access Committee to be
        automated, please check the box below to opt in to use this feature, then select the data use terms for which
        you would like DUOS to automate your Data Access Request decisions.
        <h5>Rules</h5>
        {!isLoading && DACbotRules.map((rule) => {
            return <DACBotCheckboxComponent dacId={dacId} rule={rule} key={rule.id} disableEdit={!userIsChair}/>
        })}
    </div>);
}