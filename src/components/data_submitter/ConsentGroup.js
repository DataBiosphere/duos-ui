import { useState, useEffect, useCallback } from 'react';
import { div, input, label, h, span, textarea, a, button } from 'react-hyperscript-helpers';
import { cloneDeep, isNil } from 'lodash/fp';
import {RadioButton} from '../RadioButton';
import {SearchSelect} from '../SearchSelect';

const cardStyle = {
  border: '1px solid black',
  padding: '0 2rem 1rem 2rem',
  borderRadius: '5px',

};
const radioButtonStyle = {
  fontFamily: 'Montserrat',
  fontSize: '14px',
};
const radioContainer = {
  marginTop: '.5rem',
};
const checkboxTextStyle = {
  fontSize: '14px',
  paddingTop: '.5rem',
};
const textInputStyle = {
  width: '70%',
  height: '48px'
};
const headerStyle = {
  fontWeight: 'bold',
  color: '#333F52',
  fontSize: '16px',
  marginTop: '1.5rem',
  marginBottom: '1rem'
};

// show text iff text
const ConditionalText = (props) => {
  const {
    text,
    setText,
    key,
    required,
    placeholder
  } = props;


  const show = useCallback(() => {
    return !isNil(text);
  }, [text])

  return div({
    isRendered: show(),
  }, [
    input({
      type: 'text',
      style: textInputStyle,
      value: text,
      onChange: (e) => setText(e.target.value),
      name: key,
      className: 'form-control',
      id: key,
      maxLength: '512',
      rows: '2',
      required: required,
      placeholder: placeholder
    })
  ]);
};


export const ConsentGroup = (props) => {

  const {
    key,
    initialConsentGroup,
    saveConsentGroup,
  } = props;

  const [consentGroup, setConsentGroup] = useState({
    ...{
    consentGroupName: '',

    // primary: one of these needs to be filled
    generalResearchUse: undefined,
    hmb: undefined,
    diseaseSpecificUse: undefined, // string
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
  },
  ...initialConsentGroup,
  });

  const updateField = (field, val) => {
    const newConsentGroup = cloneDeep(consentGroup);
    newConsentGroup[field] = val;

    setConsentGroup(newConsentGroup);
  };


  const setPrimary = (field, val=true) => {
    setConsentGroup({
      ...consentGroup,
      ...{
        generalResearchUse: false,
        hmb: false,
        diseaseSpecificUse: undefined,
        poa: false,
        otherPrimary: undefined,
      },
      ...{
        [field]: val,
      }});
  };

  const deselectPrimary = () => {
    setConsentGroup({
      ...consentGroup,
      ...{
        generalResearchUse: false,
        hmb: false,
        diseaseSpecificUse: undefined,
        poa: false,
        otherPrimary: undefined,
      }
    });
  };

  return div({style: cardStyle}, [
    // name

    div({ className: 'form-group' }, [
      label({
        id: key+'_consent_group_name',
        className: 'control-label',
        style: headerStyle,
      }, ['Consent Group Name*']),
      div({ className: '' }, [
        input({
          type: 'text',
          style: textInputStyle,
          name: key+'_consent_group_name',
          id: key+'_consent_group_name',
          className: 'form-control',
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
        className: 'control-label',
        style: headerStyle,
      }, ['Consent Group - Primary Data Use Terms*']),
      div({ className: '' }, [

        div({
          style: {
            marginBottom: '1rem',
            fontSize: '14px',
            fontWeight: '100',
          }
        }, [
          span({}, [
            'Please select one of the following data use permissions for your dataset'
          ]),
        ]),


        div({
          style: radioContainer,
        }, [
          RadioButton({
            style: radioButtonStyle,
            id: key+'_generalResearchUse',
            name: key+'_generalResearchUse',
            value: 'generalResearchUse',
            defaultChecked: consentGroup.generalResearchUse,
            onClick: () => setPrimary('generalResearchUse'),
            description: 'General Research Use',
          }),
        ]),

        div({
          style: radioContainer,
        }, [
          RadioButton({
            style: radioButtonStyle,
            id: key+'_hmb',
            name: key+'_hmb',
            value: 'hmb',
            defaultChecked: consentGroup.hmb,
            onClick: () => setPrimary('hmb'),
            description: 'Health/Medical/Biomedical Research Use',
          }),
        ]),

        div({
          style: radioContainer,
        }, [
          RadioButton({
            style: radioButtonStyle,
            id: key+'_diseaseSpecificUse',
            name: key+'_diseaseSpecificUse',
            value: 'diseaseSpecificUse',
            defaultChecked: !isNil(consentGroup.diseaseSpecificUse),
            onClick: () => (isNil(consentGroup.diseaseSpecificUse) ? setPrimary('diseaseSpecificUse', '') : undefined),
            description: 'Disease-Specific Research Use',
          }),
        ]),

        h(ConditionalText, {
          text: consentGroup.diseaseSpecificUse,
          setText: (val) => setPrimary('diseaseSpecificUse', val),
          key: key + '_diseaseSpecificUseText',
          required: true,
          placeholder: 'Please enter one or more diseases'
        }, []),

        div({
          style: radioContainer,
        }, [
          RadioButton({
            style: radioButtonStyle,
            id: key+'_poa',
            name: key+'_poa',
            value: 'poa',
            defaultChecked: consentGroup.poa,
            onClick: () => setPrimary('poa'),
            description: 'Populations, Origins, Ancestry Use',
          }),
        ]),

        div({
          style: radioContainer,
        }, [
          RadioButton({
            style: radioButtonStyle,
            id: key+'_otherPrimary',
            name: key+'_otherPrimary',
            value: 'otherPrimary',
            defaultChecked: !isNil(consentGroup.otherPrimary),
            onClick: () => (isNil(consentGroup.otherPrimary) ? setPrimary('otherPrimary', '') : undefined),
            description: 'Other',
          }),
        ]),

        h(ConditionalText, {
          text: consentGroup.otherPrimary,
          setText: (val) => setPrimary('otherPrimary', val),
          key: key + '_otherPrimaryText',
          required: true,
          placeholder: 'Please specify if selected (max 512 characters)',
        }, []),
      ])
    ]),

    // secondary
    div({ className: 'form-group' }, [
      label({
        id: key+'_primary_researcher',
        className: 'control-label',
        style: headerStyle,
      }, ['Consent Secondary Data Use Terms']),

      div({
        style: {
          marginBottom: '1rem',
          fontSize: '14px',
          fontWeight: '100',
        }
      }, [
        span({}, [
          'Select all applicable data use parameters'
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          checked: consentGroup.nmds,
          onChange: ()=>updateField('nmds', !consentGroup.nmds),
          id: key+'_nmds',
          name: key+'_nmds',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: checkboxTextStyle,
          htmlFor: key+'_nmds',
        }, [
          span({ className: ''},
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
          className: ' ',
        }),
        label({
          className: 'regular-checkbox ',
          style: checkboxTextStyle,
          htmlFor: key+'_gso',
        }, [
          span({ className: ''},
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
        }),
        label({
          className: 'regular-checkbox ',
          style: checkboxTextStyle,
          htmlFor: key+'_pub',
        }, [
          span({ className: ''},
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
        }),
        label({
          className: 'regular-checkbox',
          style: checkboxTextStyle,
          htmlFor: key+'_col',
        }, [
          span({ className: ''},
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
        }),
        label({
          className: 'regular-checkbox',
          style: checkboxTextStyle,
          htmlFor: key+'_irb',
        }, [
          span({ className: ''},
            ['Ethics Approval Required (IRB)']),
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          onChange: () => isNil(consentGroup.gs) ? updateField('gs', '') : updateField('gs', undefined),
          id: key+'_gs',
          name: key+'_gs',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: checkboxTextStyle,
          htmlFor: key+'_gs',
        }, [
          span({ className: ''},
            ['Geographic Restriction (GS-)']),
        ]),
      ]),

      h(ConditionalText, {
        text: consentGroup.gs,
        setText: (val) => updateField('gs', val),
        key: key + '_gstext',
        required: true,
        placeholder: 'Specify (TODO)',
      }, []),


      div({className: 'checkbox'}, [
        input({
          checked: consentGroup.mor,
          onChange: ()=>updateField('mor', !consentGroup.mor),
          id: key+'_mor',
          name: key+'_mor',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: checkboxTextStyle,
          htmlFor: key+'_mor',
        }, [
          span({ className: ''},
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
        }),
        label({
          className: 'regular-checkbox',
          style: checkboxTextStyle,
          htmlFor: key+'_npu',
        }, [
          span({ className: ''},
            ['Non-profit Use Only (NPU)']),
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          onChange: () => isNil(consentGroup.otherSecondary) ? updateField('otherSecondary', '') : updateField('otherSecondary', undefined),
          id: key+'_otherSecondary',
          name: key+'_otherSecondary',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: checkboxTextStyle,
          htmlFor: key+'_otherSecondary',
        }, [
          span({ className: ''},
            ['Other']),
        ]),
      ]),

      h(ConditionalText, {
        text: consentGroup.otherSecondary,
        setText: (val) => updateField('otherSecondary', val),
        key: key + '_otherSecondarytext',
        required: true,
        placeholder: 'Other'
      }, []),
    ]),

    // location
    div({ className: 'form-group' }, [
      label({
        id: key+'_primary_researcher',
        className: 'control-label',
        style: headerStyle,
      }, ['Data Location*']),
      // h(SearchSelect, {
      //   options: [
      //     'AnVIL Workspace',
      //     'Terra Workspace',
      //     'TDR Location',
      //     'Not Determined'
      //   ],
      //   placeholder: 'Select location',
      //   id: key+'_dataLocation',
      //   label: key+'_dataLocation',
      //   value: consentGroup.dataLocation,
      //   onSelection: (selected) => updateField('dataLocation', selected),
      // }),
      input({
        type: 'text',
        style: textInputStyle,
        className: 'form-control',
        value: consentGroup.url,
        onChange: (e) => updateField('url', e.target.value),
        name: key+'_url',
        id: key+'_url',
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
      a({}, [
        span({
          className: 'cm-icon-button glyphicon glyphicon-trash',
          'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete'
        }),
        span({
          style: {
            marginLeft: '1rem',
          }
        }, ['Delete this entry']),
      ]),
      div({}, [
        button({
          id: 'btn_save',
          onClick: () => {
            console.log(consentGroup);
          },
          className: 'f-right btn-primary common-background',
        }, ['Save']),
      ]),
    ])
  ]);
};

export default ConsentGroup;