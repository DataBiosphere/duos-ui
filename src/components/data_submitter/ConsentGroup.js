import { useState, useEffect, useCallback } from 'react';
import { div, input, label, h, span, a, button } from 'react-hyperscript-helpers';
import { cloneDeep, isNil } from 'lodash/fp';
import {RadioButton} from '../RadioButton';
import DataSubmitterStyles from './DataSubmitterStyles';


// show text iff text
const ConditionalText = (props) => {
  const {
    text,
    setText,
    idx,
    required,
    placeholder
  } = props;


  const show = useCallback(() => {
    return !isNil(text);
  }, [text]);

  return div({
    isRendered: show(),
  }, [
    input({
      type: 'text',
      style: DataSubmitterStyles.textInput,
      value: text,
      onChange: (e) => setText(e.target.value),
      name: idx,
      className: 'form-control',
      id: idx,
      maxLength: '512',
      rows: '2',
      required: required,
      placeholder: placeholder
    })
  ]);
};


export const ConsentGroup = (props) => {

  const {
    idx,
    parentConsentGroup,
    saveConsentGroup,
    deleteConsentGroup,
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
    ...parentConsentGroup,
  });


  useEffect(() => {
    setConsentGroup(parentConsentGroup);
  }, [parentConsentGroup]);

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

  return div({style: DataSubmitterStyles.consentGroupCard}, [
    // name

    div({ className: 'form-group' }, [
      label({
        id: idx+'_consent_group_name',
        className: 'control-label',
        style: DataSubmitterStyles.header,
      }, ['Consent Group Name*']),
      div({ className: '' }, [
        input({
          type: 'text',
          style: DataSubmitterStyles.textInput,
          name: idx+'_consent_group_name',
          id: idx+'_consent_group_name',
          className: 'form-control',
          placeholder: '',
          required: true,
          value: consentGroup.consentGroupName,
          onChange: (e) => updateField('consentGroupName', e.target.value),
        })
      ])
    ]),

    // primary

    div({ className: 'form-group' }, [
      label({
        id: idx+'_primary_researcher',
        className: 'control-label',
        style: DataSubmitterStyles.header,
      }, ['Consent Group - Primary Data Use Terms*']),
      div({ className: '' }, [

        div({
          style: DataSubmitterStyles.headerDescription
        }, [
          span({}, [
            'Please select one of the following data use permissions for your dataset'
          ]),
        ]),


        div({
          style: DataSubmitterStyles.radioContainer,
        }, [
          RadioButton({
            style: DataSubmitterStyles.radioButton,
            id: idx+'_generalResearchUse',
            name: idx+'_generalResearchUse',
            value: 'generalResearchUse',
            defaultChecked: consentGroup.generalResearchUse,
            onClick: () => setPrimary('generalResearchUse'),
            description: 'General Research Use',
          }),
        ]),

        div({
          style: DataSubmitterStyles.radioContainer,
        }, [
          RadioButton({
            style: DataSubmitterStyles.radioButton,
            id: idx+'_hmb',
            name: idx+'_hmb',
            value: 'hmb',
            defaultChecked: consentGroup.hmb,
            onClick: () => setPrimary('hmb'),
            description: 'Health/Medical/Biomedical Research Use',
          }),
        ]),

        div({
          style: DataSubmitterStyles.radioContainer,
        }, [
          RadioButton({
            style: DataSubmitterStyles.radioButton,
            id: idx+'_diseaseSpecificUse',
            name: idx+'_diseaseSpecificUse',
            value: 'diseaseSpecificUse',
            defaultChecked: !isNil(consentGroup.diseaseSpecificUse),
            onClick: () => (isNil(consentGroup.diseaseSpecificUse) ? setPrimary('diseaseSpecificUse', '') : undefined),
            description: 'Disease-Specific Research Use',
          }),
        ]),

        h(ConditionalText, {
          text: consentGroup.diseaseSpecificUse,
          setText: (val) => setPrimary('diseaseSpecificUse', val),
          idx: idx + '_diseaseSpecificUseText',
          required: true,
          placeholder: 'Please enter one or more diseases'
        }, []),

        div({
          style: DataSubmitterStyles.radioContainer,
        }, [
          RadioButton({
            style: DataSubmitterStyles.radioButton,
            id: idx+'_poa',
            name: idx+'_poa',
            value: 'poa',
            defaultChecked: consentGroup.poa,
            onClick: () => setPrimary('poa'),
            description: 'Populations, Origins, Ancestry Use',
          }),
        ]),

        div({
          style: DataSubmitterStyles.radioContainer,
        }, [
          RadioButton({
            style: DataSubmitterStyles.radioButton,
            id: idx+'_otherPrimary',
            name: idx+'_otherPrimary',
            value: 'otherPrimary',
            defaultChecked: !isNil(consentGroup.otherPrimary),
            onClick: () => (isNil(consentGroup.otherPrimary) ? setPrimary('otherPrimary', '') : undefined),
            description: 'Other',
          }),
        ]),

        h(ConditionalText, {
          text: consentGroup.otherPrimary,
          setText: (val) => setPrimary('otherPrimary', val),
          idx: idx + '_otherPrimaryText',
          required: true,
          placeholder: 'Please specify if selected (max 512 characters)',
        }, []),
      ])
    ]),

    // secondary
    div({ className: 'form-group' }, [
      label({
        id: idx+'_primary_researcher',
        className: 'control-label',
        style: DataSubmitterStyles.header,
      }, ['Consent Secondary Data Use Terms']),

      div({
        style: DataSubmitterStyles.headerDescription,
      }, [
        span({}, [
          'Select all applicable data use parameters'
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          checked: consentGroup.nmds,
          onChange: ()=>updateField('nmds', !consentGroup.nmds),
          id: idx+'_nmds',
          name: idx+'_nmds',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: DataSubmitterStyles.checkboxText,
          htmlFor: idx+'_nmds',
        }, [
          span({ className: ''},
            ['No methods development or validation studies (NMDS)']),
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          checked: consentGroup.gso,
          onChange: ()=>updateField('gso', !consentGroup.gso),
          id: idx+'_gso',
          name: idx+'_gso',
          type: 'checkbox',
          className: ' ',
        }),
        label({
          className: 'regular-checkbox ',
          style: DataSubmitterStyles.checkboxText,
          htmlFor: idx+'_gso',
        }, [
          span({ className: ''},
            ['Genetic studies only (GSO)']),
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          checked: consentGroup.pub,
          onChange: ()=>updateField('pub', !consentGroup.pub),
          id: idx+'_pub',
          name: idx+'_pub',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox ',
          style: DataSubmitterStyles.checkboxText,
          htmlFor: idx+'_pub',
        }, [
          span({ className: ''},
            ['Publication Required (PUB)']),
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          checked: consentGroup.col,
          onChange: ()=>updateField('col', !consentGroup.col),
          id: idx+'_col',
          name: idx+'_col',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: DataSubmitterStyles.checkboxText,
          htmlFor: idx+'_col',
        }, [
          span({ className: ''},
            ['Collaboration Required (COL)']),
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          checked: consentGroup.irb,
          onChange: ()=>updateField('irb', !consentGroup.irb),
          id: idx+'_irb',
          name: idx+'_irb',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: DataSubmitterStyles.checkboxText,
          htmlFor: idx+'_irb',
        }, [
          span({ className: ''},
            ['Ethics Approval Required (IRB)']),
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          onChange: () => isNil(consentGroup.gs) ? updateField('gs', '') : updateField('gs', undefined),
          id: idx+'_gs',
          name: idx+'_gs',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: DataSubmitterStyles.checkboxText,
          htmlFor: idx+'_gs',
        }, [
          span({ className: ''},
            ['Geographic Restriction (GS-)']),
        ]),
      ]),

      h(ConditionalText, {
        text: consentGroup.gs,
        setText: (val) => updateField('gs', val),
        idx: idx + '_gstext',
        required: true,
        placeholder: 'Specify (TODO)',
      }, []),


      div({className: 'checkbox'}, [
        input({
          checked: consentGroup.mor,
          onChange: ()=>updateField('mor', !consentGroup.mor),
          id: idx+'_mor',
          name: idx+'_mor',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: DataSubmitterStyles.checkboxText,
          htmlFor: idx+'_mor',
        }, [
          span({ className: ''},
            ['Publication Moratorium (MOR)']),
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          checked: consentGroup.npu,
          onChange: ()=>updateField('npu', !consentGroup.npu),
          id: idx+'_npu',
          name: idx+'_npu',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: DataSubmitterStyles.checkboxText,
          htmlFor: idx+'_npu',
        }, [
          span({ className: ''},
            ['Non-profit Use Only (NPU)']),
        ]),
      ]),

      div({className: 'checkbox'}, [
        input({
          onChange: () => isNil(consentGroup.otherSecondary) ? updateField('otherSecondary', '') : updateField('otherSecondary', undefined),
          id: idx+'_otherSecondary',
          name: idx+'_otherSecondary',
          type: 'checkbox',
        }),
        label({
          className: 'regular-checkbox',
          style: DataSubmitterStyles.checkboxText,
          htmlFor: idx+'_otherSecondary',
        }, [
          span({ className: ''},
            ['Other']),
        ]),
      ]),

      h(ConditionalText, {
        text: consentGroup.otherSecondary,
        setText: (val) => updateField('otherSecondary', val),
        idx: idx + '_otherSecondarytext',
        required: true,
        placeholder: 'Other'
      }, []),
    ]),

    // location
    div({ className: 'form-group' }, [
      label({
        id: idx+'_primary_researcher',
        className: 'control-label',
        style: DataSubmitterStyles.header,
      }, ['Data Location*']),
      // h(SearchSelect, {
      //   options: [
      //     'AnVIL Workspace',
      //     'Terra Workspace',
      //     'TDR Location',
      //     'Not Determined'
      //   ],
      //   placeholder: 'Select location',
      //   id: idx+'_dataLocation',
      //   label: idx+'_dataLocation',
      //   value: consentGroup.dataLocation,
      //   onSelection: (selected) => updateField('dataLocation', selected),
      // }),
      input({
        type: 'text',
        style: DataSubmitterStyles.textInput,
        className: 'form-control',
        value: consentGroup.url,
        onChange: (e) => updateField('url', e.target.value),
        name: idx+'_url',
        id: idx+'_url',
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
      a({
        onClick: () => deleteConsentGroup(),
      }, [
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
          onClick: () => saveConsentGroup(consentGroup),
          className: 'f-right btn-primary common-background',
        }, ['Save']),
      ]),
    ])
  ]);
};

export default ConsentGroup;