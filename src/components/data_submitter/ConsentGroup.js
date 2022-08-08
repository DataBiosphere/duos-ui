import { useState } from 'react';
import { div, input, label, h } from 'react-hyperscript-helpers';
import { cloneDeep } from 'lodash/fp'
import {RadioButton} from '../components/RadioButton';

const cardStyle = {}

export default function ConsentGroup(props) {

    const { 
        key,
        consentGroup,
        setConsentGrouop
    } = props;

    const [consentGroup, setConsentGroup] = useState({
        consentGroupName: '',

        // primary: one of these needs to be filled
        generalResearchUse: undefined,
        hmb: undefined,
        diseaseSpecificUse: undefined,
        poa: undefined, 
        otherPrimary: undefined, // string

        // secondary:
        nmds: false, // No Methods Development or validation studies
        gso: false, // genetic studies only
        pub: false, // publication required
        col: false, // collaboration required
        irb: false, // irb approval required
        gs: undefined, // string: geographic restriction
        mor: false, // publication moratorium
        npu: false, // non profit only
        otherSecondary: undefined, // string

        // dataLocation is one of:
        // "AnVIL Workspace", "Terra Workspace", 
        // "TDR Location", "Not Determined" 
        dataLocation: [], 

        url: ''
    });

    const updateField(field, val) {
        const newConsentGroup = cloneDeep(consentGroup);
        newConsentGroup[field] = val;

        setConsentGroup(newConsentGroup);
    }

    const checkPrimary(field) {
        const fields = {
            generalResearchUse: false,
            hmb: false,
            diseaseSpecificUse: false,
            poa: false    
        }

        fields[field] = true;

        setConsentGroup({
            ...consentGroup,
            ...fields
        })
    }

    return div({style: cardStyle}, [
        // name

        div({ className: 'form-group' }, [
            label({ 
                id: key+'_consent_group_name',
                className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
            }, ['Consent Group Name*']),
            div({ className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8' }, [
              input({
                type: 'text',
                name: key+'_consent_group_name',
                id: key+'_consent_group_name',
                className: 'form-control col-lg-12',
                placeholder: '',
                required: true,
                value: consentGroup.consentGroupName,
                onChange: (val) => updateField('consentGroupnName', val),
              })
            ])
        ]),

        // primary

        div({ className: 'form-group' }, [
            label({ 
                id: key+'_primary_researcher',
                className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
            }, ['Primary*']),
            div({ className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8' }, [
                RadioButton({
                    style: radioButtonStyle,
                    id: key+'_generalResearchUse',
                    name: key+'_nmds',
                    value: 'nmds',
                    defaultChecked: consentGroup.nmds,
                    onClick: () => checkPrimary('nmds'),
                    label: '2.3.2 Population origins or ancestry research: ',
                    description: 'The outcome of this study is expected to provide new knowledge about the origins of a certain population or its ancestry.',
                }),
            ])
        ]),

        // secondary

        // location

        // data url
    ])
}