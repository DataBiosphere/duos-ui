import { useState, useEffect, useCallback } from 'react';
import { div, input, label, h, span, a, button } from 'react-hyperscript-helpers';
import { cloneDeep, isNil } from 'lodash/fp';
import {RadioButton} from '../RadioButton';
import DataSubmitterStyles from './DataSubmitterStyles';
import ConsentGroupSummary from './ConsentGroupSummary';
import Select from 'react-select';

// show text iff text
const ConditionalText = (props) => {
  const {
    text,
    setText,
    id,
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
      name: id,
      className: 'form-control',
      id: id,
      maxLength: '512',
      rows: '2',
      required: required,
      placeholder: placeholder
    })
  ]);
};


const dataLocationOptions = [
  { value: 'AnVIL Workspace', label: 'AnVIL Workspace' },
  { value: 'Terra Workspace', label: 'Terra Workspace' },
  { value: 'TDR Location', label: 'TDR Location' },
  { value: 'Not Determined', label: 'Not Determined' }
];

// const dataLocationOptions = ["AnVIL Workspace", "Terra Workspace", "TDR Location", "Not Determined"]

export const ConsentGroupForm = (props) => {
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

  const [editMode, setEditMode] = useState(true);

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

  return div({
    style: DataSubmitterStyles.consentGroupCard,
    id: idx+'_consentGroupForm'
  }, [

    div({
      isRendered: !editMode,
      id: idx+'_consentGroupSummary',
    }, [
      h(ConsentGroupSummary, {
        consentGroup: consentGroup,
      }),
    ]),

    div({
      isRendered: editMode,
    }, [
      // name
      div({ className: 'form-group' }, [
        label({
          id: idx+'_consent_group_name_label',
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
            disabled: !editMode,
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
              disabled: !editMode,
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
              disabled: !editMode,
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
              disabled: !editMode,
              defaultChecked: !isNil(consentGroup.diseaseSpecificUse),
              onClick: () => (isNil(consentGroup.diseaseSpecificUse) ? setPrimary('diseaseSpecificUse', '') : undefined),
              description: 'Disease-Specific Research Use',
            }),
          ]),

          h(ConditionalText, {
            text: consentGroup.diseaseSpecificUse,
            setText: (val) => setPrimary('diseaseSpecificUse', val),
            id: idx + '_diseaseSpecificUseText',
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
              disabled: !editMode,
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
              disabled: !editMode,
              onClick: () => (isNil(consentGroup.otherPrimary) ? setPrimary('otherPrimary', '') : undefined),
              description: 'Other',
            }),
          ]),

          h(ConditionalText, {
            text: consentGroup.otherPrimary,
            setText: (val) => setPrimary('otherPrimary', val),
            id: idx + '_otherPrimaryText',
            required: true,
            disabled: !editMode,
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
            disabled: !editMode,
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
            disabled: !editMode,
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
            disabled: !editMode,
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
            disabled: !editMode,
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
            disabled: !editMode,
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
            disabled: !editMode,
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
          id: idx + '_gstext',
          disabled: !editMode,
          required: true,
          placeholder: 'Specify (TODO)',
        }, []),


        div({className: 'checkbox'}, [
          input({
            checked: consentGroup.mor,
            onChange: ()=>updateField('mor', !consentGroup.mor),
            id: idx+'_mor',
            name: idx+'_mor',
            disabled: !editMode,
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
            disabled: !editMode,
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
            disabled: !editMode,
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
          id: idx + '_otherSecondaryText',
          required: true,
          disabled: !editMode,
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

        div({style: DataSubmitterStyles.textInput}, [
          h(Select, {
            isMulti: true,
            options: dataLocationOptions,
            disabled: !editMode,
            value: (
              isNil(consentGroup.dataLocation)
                ? null
                : consentGroup.dataLocation.map((loc) => {
                  return {
                    value: loc,
                    label: loc,
                  };
                })),
            name: idx+'_dataLocation',
            placeholder: 'Data Location(s)',
            onChange: (selected) => {
              const values = selected.map((s) => s.value);

              if (values.includes('Not Determined')) {
                // user selected 'Not Determined', so clear all other values
                if (values[values.length - 1] == 'Not Determined') {
                  updateField('dataLocation', ['Not Determined']);
                  return;
                }

                // user selected something other than 'Not Determined',
                // so remove 'Not Determined' and keep the new value.
                const notDeterminedIdx = values.indexOf('Not Determined');
                values.splice(notDeterminedIdx, 1);
                updateField('dataLocation', values);
                return;
              }
              updateField('dataLocation', values);
            }
          }),
        ]),


        input({
          type: 'text',
          style: DataSubmitterStyles.textInput,
          className: 'form-control',
          value: consentGroup.url,
          onChange: (e) => updateField('url', e.target.value),
          name: idx+'_url',
          id: idx+'_url',
          disabled: !editMode,
          maxLength: '512',
          rows: '2',
          required: false,
          placeholder: 'Free text field for entering URL of data.'
        })
      ]),
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
        id: idx+'_deleteConsentGroup',
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
          id: idx+'_editConsentGroup',
          isRendered: !editMode,
          onClick: () => {
            setEditMode(true);
          },
          className: 'f-right btn-primary common-background',
        }, ['Edit']),

        button({
          id: idx+'_saveConsentGroup',
          isRendered: editMode,
          onClick: () => {
            saveConsentGroup(consentGroup);
            setEditMode(false);
          },
          className: 'f-right btn-primary common-background',
        }, ['Save']),
      ]),
    ])
  ]);
};

export default ConsentGroupForm;