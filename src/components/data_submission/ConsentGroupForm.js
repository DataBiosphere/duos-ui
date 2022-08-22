import { useState } from 'react';
import { div, h, h3, span, a, button } from 'react-hyperscript-helpers';
import { set } from 'lodash/fp';
import ConsentGroupSummary from './ConsentGroupSummary';
import { FormFieldTypes, FormField } from '../forms/forms';

const dataLocationOptions = [
  { value: 'AnVIL Workspace', label: 'AnVIL Workspace' },
  { value: 'Terra Workspace', label: 'Terra Workspace' },
  { value: 'TDR Location', label: 'TDR Location' },
  { value: 'Not Determined', label: 'Not Determined' }
];

export const ConsentGroupForm = (props) => {
  const {
    idx,
    saveConsentGroup,
    deleteConsentGroup,
  } = props;

  const consentGroup = {
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
  };

  const isConsentGroupValid = () => {
    const isPrimarySelected = () => {
      return false;
    };

    const isUrlSpecified = false;

    const isNameSpecified = false;

    return isPrimarySelected() && isUrlSpecified && isNameSpecified;
  };

  const [editMode, setEditMode] = useState(true);

  const updateField = (field, val) => {
    set(consentGroup, field, val);
  };

  return div({
    style: {
      border: '1px solid #283593',
      padding: '1rem 2rem 1rem 2rem',
      borderRadius: '4px',
      marginBottom: '2rem',
    },
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

      div({
        style: {
          width: '70%'
        }
      }, [
        h3(['Consent Group Information']),

        // name
        h(FormField, {
          id: 'consentGroupName',
          title: 'Consent Group Name*',
          placeholder: 'Enter name',
          onChange: ({key, value}) => updateField(key, value),
        }),

        // primary

        h(FormField,
          {
            type: FormFieldTypes.RADIO,
            id: 'primaryRadio',
            title: 'Consent Group - Primary Data Use Terms*',
            description: 'Please select one of the following data use permissions for your dataset',
            options: [
              {
                id: 'generalResearchUse',
                key: 'generalResearchUse',
                text: 'General Research Use',
              },
              {
                id: 'hmb',
                key: 'hmb',
                text: 'Health/Medical/Biomedical Research Use',
              },
              {
                id: 'diseaseSpecificUse',
                key: 'diseaseSpecificUse',
                text: 'Disease-Specific Research Use',
                type: 'string',
                placeholder: 'Please enter one or more diseases',
              },
              {
                id: 'poa',
                key: 'poa',
                text: 'Populations, Origins, Ancestry Use',
              },
              {
                id: 'otherPrimary',
                key: 'otherPrimary',
                text: 'Other',
                type: 'string',
                placeholder: 'Please specify',
              },
            ],
            onChange: ({value}) => {
              set(consentGroup, value.key, value.value);
            }
          }
        ),

        // secondary
        h(FormField, {
          title: 'Consent Secondary Data Use Terms',
          description: 'Select all applicable data use parameters',
          id: 'nmds',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'No methods development or validation studies (NMDS)',
          onChange: ({key, value}) => updateField(key, value),
        }),

        h(FormField, {
          id: 'gso',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Genetic studies only (GSO)',
          onChange: ({key, value}) => updateField(key, value),
        }),

        h(FormField, {
          id: 'pub',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Publication Required (PUB)',
          onChange: ({key, value}) => updateField(key, value),
        }),

        h(FormField, {
          id: 'col',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Collaboration Required (COL)',
          onChange: ({key, value}) => updateField(key, value),
        }),

        h(FormField, {
          id: 'irb',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Ethics Approval Required (IRB)',
          onChange: ({key, value}) => updateField(key, value),
        }),

        h(FormField, {
          id: 'gs',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Geographic Restriction (GS-)',
          valueType: 'string',
          placeholder: 'Specify (TODO)',
          defaultValue: null,
          onChange: ({key, value}) => updateField(key, value),
        }),

        h(FormField, {
          id: 'mor',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Publication Moratorium (MOR)',
          onChange: ({key, value}) => updateField(key, value),
        }),


        h(FormField, {
          id: 'npu',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Non-profit Use Only (NPU)',
          onChange: ({key, value}) => updateField(key, value),
        }),

        h(FormField, {
          id: 'otherSecondary',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Other',
          valueType: 'string',
          placeholder: 'Please specify.',
          defaultValue: null,
          onChange: ({key, value}) => updateField(key, value),
        }),

        // location

        h(FormField, {
          id: 'datalocations',
          type: FormFieldTypes.MULTISELECT,
          title: 'Data Location*',
          exclusiveValues: 'Not Determined',
          options: dataLocationOptions,
          placeholder: 'Data Location(s)',
          onChange: ({key, value}) => updateField(key, value.map((sel) => sel.value)),
        }),

        h(FormField, {
          id: 'url',
          placeholder: 'Enter URL',
          onChange: ({key, value}) => updateField(key, value),
        }),
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
            saveConsentGroup({ value: consentGroup, valid: isConsentGroupValid });
            setEditMode(false);
          },
          className: 'f-right btn-primary common-background',
        }, ['Save']),
      ]),
    ])
  ]);
};

export default ConsentGroupForm;