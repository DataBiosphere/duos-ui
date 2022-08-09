import { useState, useEffect } from 'react';
import { div, input, label, h } from 'react-hyperscript-helpers';
import { cloneDeep } from 'lodash/fp'
import {RadioButton} from '../RadioButton';
import {SearchSelect} from '../SearchSelect';

const cardStyle = {}

const ConditionalText = (props) = {
    const {
        checked,
        text,
        setText,
        key,
        required,
        placeholder
    } = props;


    useEffect(() => {
        if (!checked) {
            setText(undefined),
        } else {
            setText('');
        }
    }, [checked]);

    return div({
        isRendered: checked,
    }, [
        textarea({
            style: otherTextStyle,
            value: text,
            onChange: setText,
            name: key,
            id: key
            maxLength: '512',
            rows: '2',
            required: required,
            placeholder: placeholder
          })
    ])
}


export default function ConsentGroup(props) {

    const { 
        key,
        saveConsentGroup,
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

    const [showDiseaseSpecificUse, setShowDiseaseSpecificUse] = useState(false);
    const [showOtherPrimary, setShowOtherPrimary] = useState(false);
    const [showGeographicRestriction, setShowGeographicRestriction] = useState(false);

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

    const deselectPrimary() => {
        setConsentGroup({
            ...consentGroup,
            ...{
                generalResearchUse: false,
                hmb: false,
                diseaseSpecificUse: false,
                poa: false    
            }
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
            }, ['Consent Group - Primary Data Use Terms*']),
            div({ className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8' }, [
                RadioButton({
                    style: radioButtonStyle,
                    id: key+'_generalResearchUse',
                    name: key+'_generalResearchUse',
                    value: 'generalResearchUse',
                    defaultChecked: consentGroup.generalResearchUse,
                    onClick: () => checkPrimary('generalResearchUse'),
                    label: 'General Research Use',
                    description: 'General Research Use',
                }),
                RadioButton({
                    style: radioButtonStyle,
                    id: key+'_hmb',
                    name: key+'_hmb',
                    value: 'hmb',
                    defaultChecked: consentGroup.hmb,
                    onClick: () => checkPrimary('hmb'),
                    label: 'Health/Medical/Biomedical Research Use',
                    description: 'Health/Medical/Biomedical Research Use',
                }),
                RadioButton({
                    style: radioButtonStyle,
                    id: key+'_diseaseSpecificUse',
                    name: key+'_diseaseSpecificUse',
                    value: 'diseaseSpecificUse',
                    defaultChecked: showDiseaseSpecificUse,
                    onClick: () => {
                        deselectPrimary()
                        setShowDiseaseSpecificUse(!showDiseaseSpecificUse)
                    },
                    label: 'Disease-Specific Research Use',
                    description: 'Disease-Specific Research Use',
                }),
                h(ConditionalText, {
                    checked: showDiseaseSpecificUse
                    text: consentGroup.diseaseSpecificUse,
                    setText: (val) => updateField('diseaseSpecificUse', val)
                    key: key + "_diseaseSpecificUseText",
                    required: true
                    placeholder: 'Please enter one or more diseases'
                }, []),
                RadioButton({
                    style: radioButtonStyle,
                    id: key+'_poa',
                    name: key+'_poa',
                    value: 'poa',
                    defaultChecked: consentGroup.poa,
                    onClick: () => checkPrimary('poa'),
                    label: 'Populations, Origins, Ancestry Use',
                    description: 'Populations, Origins, Ancestry Use',
                }),
                RadioButton({
                    style: radioButtonStyle,
                    id: key+'_otherPrimary',
                    name: key+'_otherPrimary',
                    value: 'otherPrimary',
                    defaultChecked: showOtherPrimary,
                    onClick: () => {
                        deselectPrimary()
                        setShowOtherPrimary(!showOtherPrimary)
                    },
                    label: 'Other',
                    description: 'Other',
                }),
                h(ConditionalText, {
                    checked: showOtherPrimary
                    text: consentGroup.otherPrimary,
                    setText: (val) => updateField('otherPrimary', val)
                    key: key + "_otherPrimaryText",
                    required: true
                    placeholder: 'Please specify if selected (max 512 characters)'
                }, []),
            ])
        ]),

        // secondary
        div({ className: 'form-group' }, [
            label({ 
                id: key+'_primary_researcher',
                className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
            }, ['Consent Secondary Data Use Terms']),



            div({className: 'checkbox'}, [
                input({
                    checked: consentGroup.nmds,
                    onChange: ()=>updateField('nmds', !consentGroup.nmds),
                    id: key+'_nmds',
                    name: key+'_nmds',
                    type: 'checkbox',
                    className: 'checkbox-inline rp-checkbox',
                }),
                label({
                    className: 'regular-checkbox rp-choice-questions',
                    htmlFor: key+'_nmds',
                }, [
                span({ className: 'access-color'},
                    ['No methods development or validation studies (NMDS)']),
                ]),
            ]),

            div({className: 'checkbox'}, [
                input({
                    checked: consentGroup.gso,
                    onChange: ()=>updateField('gso', !consentGroup.gso),
                    id: key+'_gso',
                    name: key+'_gso',
                    type: 'checkbox',
                    className: 'checkbox-inline rp-checkbox',
                }),
                label({
                    className: 'regular-checkbox rp-choice-questions',
                    htmlFor: key+'_gso',
                }, [
                span({ className: 'access-color'},
                    ['Genetic studies only (GSO)']),
                ]),
            ]),

            div({className: 'checkbox'}, [
                input({
                    checked: consentGroup.pub,
                    onChange: ()=>updateField('pub', !consentGroup.pub),
                    id: key+'_pub',
                    name: key+'_pub',
                    type: 'checkbox',
                    className: 'checkbox-inline rp-checkbox',
                }),
                label({
                    className: 'regular-checkbox rp-choice-questions',
                    htmlFor: key+'_pub',
                }, [
                span({ className: 'access-color'},
                    ['Publication Required (PUB)']),
                ]),
            ]),

            div({className: 'checkbox'}, [
                input({
                    checked: consentGroup.col,
                    onChange: ()=>updateField('col', !consentGroup.col),
                    id: key+'_col',
                    name: key+'_col',
                    type: 'checkbox',
                    className: 'checkbox-inline rp-checkbox',
                }),
                label({
                    className: 'regular-checkbox rp-choice-questions',
                    htmlFor: key+'_col',
                }, [
                span({ className: 'access-color'},
                    ['Collaboration Required (COL)']),
                ]),
            ]),

            div({className: 'checkbox'}, [
                input({
                    checked: consentGroup.irb,
                    onChange: ()=>updateField('irb', !consentGroup.irb),
                    id: key+'_irb',
                    name: key+'_irb',
                    type: 'checkbox',
                    className: 'checkbox-inline rp-checkbox',
                }),
                label({
                    className: 'regular-checkbox rp-choice-questions',
                    htmlFor: key+'_irb',
                }, [
                span({ className: 'access-color'},
                    ['Ethics Approval Required (IRB)']),
                ]),
            ]),

            div({className: 'checkbox'}, [
                input({
                    checked: showGeographicRestriction,
                    onChange: () => setShowGeographicRestriction(!showGeographicRestriction),
                    id: key+'_gs',
                    name: key+'_gs',
                    type: 'checkbox',
                    className: 'checkbox-inline rp-checkbox',
                }),
                label({
                    className: 'regular-checkbox rp-choice-questions',
                    htmlFor: key+'_gs',
                }, [
                span({ className: 'access-color'},
                    ['Geographic Restriction (GS-)']),
                ]),
            ]),

            h(ConditionalText, {
                checked: showGeographicRestriction,
                text: consentGroup.gs,
                setText: (val) => updateField('gs', val)
                key: key + "_gstext",
                required: true
                placeholder: 'Specify (TODO)'
            }, []),


            div({className: 'checkbox'}, [
                input({
                    checked: consentGroup.mor,
                    onChange: ()=>updateField('mor', !consentGroup.mor),
                    id: key+'_mor',
                    name: key+'_mor',
                    type: 'checkbox',
                    className: 'checkbox-inline rp-checkbox',
                }),
                label({
                    className: 'regular-checkbox rp-choice-questions',
                    htmlFor: key+'_mor',
                }, [
                span({ className: 'access-color'},
                    ['Publication Moratorium (MOR)']),
                ]),
            ]),

            div({className: 'checkbox'}, [
                input({
                    checked: consentGroup.npu,
                    onChange: ()=>updateField('npu', !consentGroup.npu),
                    id: key+'_npu',
                    name: key+'_npu',
                    type: 'checkbox',
                    className: 'checkbox-inline rp-checkbox',
                }),
                label({
                    className: 'regular-checkbox rp-choice-questions',
                    htmlFor: key+'_npu',
                }, [
                span({ className: 'access-color'},
                    ['Non-profit Use Only (NPU)']),
                ]),
            ]),

            div({className: 'checkbox'}, [
                input({
                    checked: showOtherSecondary,
                    onChange: () => setShowOtherSecondary(!showOtherSecondary),
                    id: key+'_otherSecondary',
                    name: key+'_otherSecondary',
                    type: 'checkbox',
                    className: 'checkbox-inline rp-checkbox',
                }),
                label({
                    className: 'regular-checkbox rp-choice-questions',
                    htmlFor: key+'_otherSecondary',
                }, [
                span({ className: 'access-color'},
                    ['Other']),
                ]),
            ]),

            h(ConditionalText, {
                checked: showOtherSecondary,
                text: consentGroup.otherSecondary,
                setText: (val) => updateField('otherSecondary', val)
                key: key + "_otherSecondarytext",
                required: true
                placeholder: 'Other'
            }, []),
        ]),

        // location
        div({ className: 'form-group' }, [
            label({ 
                id: key+'_primary_researcher',
                className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
            }, ['Data Location*']),
            h(SearchSelect, {
                options: [
                    "AnVIL Workspace",
                    "Terra Workspace",
                    "TDR Location",
                    "Not Determined"
                ],
                placeholder: 'Select location',
                id: key+"_dataLocation",
                label: key+'_dataLocation',
                onSelection: (selected) => updateField('dataLocation', selected),
            }),
            textarea({
                value: consentGroup.url,
                onChange: (val) => updateField('url', val),
                name: key+"_url",
                id: key+"_url",
                maxLength: '512',
                rows: '2',
                required: false,
                placeholder: 'Free text field for entering URL of data.'
            })
        ]),

        // save + delete

        div({
            style: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
            }
        }, [
            div({}, [
                span({}, ['Delete']),
            ]),
            div({}, [
                span({}, ['Save']),
            ]),
        ])
    ])
}