import { useState } from 'react';
import { div, h, h3, span, a, button } from 'react-hyperscript-helpers';
import { isNil, isString } from 'lodash/fp';
import ConsentGroupSummary from './ConsentGroupSummary';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import { Notification } from '../Notification';


const dataLocationOptions = [
  { value: 'AnVIL Workspace', label: 'AnVIL Workspace' },
  { value: 'Terra Workspace', label: 'Terra Workspace' },
  { value: 'TDR Location', label: 'TDR Location' },
  { value: 'Not Determined', label: 'Not Determined' }
];


const selectedPrimaryGroup = (consentGroup) => {
  if (!isNil(consentGroup.generalResearchUse) && consentGroup.generalResearchUse) {
    return {
      key: 'generalResearchUse',
      value: true,
    };
  } else if (!isNil(consentGroup.hmb) && consentGroup.hmb) {
    return {
      key: 'hmb',
      value: true,
    };
  } else if (!isNil(consentGroup.diseaseSpecificUse) && isString(consentGroup.diseaseSpecificUse)) {
    return {
      key: 'diseaseSpecificUse',
      value: consentGroup.diseaseSpecificUse,
    };
  } else if (!isNil(consentGroup.poa) && consentGroup.poa) {
    return {
      key: 'poa',
      value: true,
    };
  } else if (!isNil(consentGroup.otherPrimary) && isString(consentGroup.otherPrimary)) {
    return {
      key: 'otherPrimary',
      value: consentGroup.otherPrimary,
    };
  }

  return undefined;
};

const computeConsentGroupValidationErrors = (consentGroup) => {
  const errors = [];

  if (isNil(selectedPrimaryGroup(consentGroup))) {
    errors.push('Please select a primary consent group.');
  }

  if (isNil(consentGroup.url) || consentGroup.url === '') {
    errors.push('Must specify the URL of the data.');
  } else {
    try {
      new URL(consentGroup.url);
    } catch(err) {
      errors.push('The data location URL must be a valid URL.');
    }
  }

  if (isNil(consentGroup.consentGroupName) || consentGroup.consentGroupName === '') {
    errors.push('Must specify the name of the consent group');
  }

  if (isNil(consentGroup.dataLocation) || consentGroup.dataLocation.length === 0) {
    errors.push('Must specify data location (or specify \'Not Determined\')');
  }

  if (!isNil(consentGroup.gs) && consentGroup.gs == '') {
    errors.push('Please specify the geographic restrictions.');
  }

  if (!isNil(consentGroup.otherPrimary) && consentGroup.otherPrimary == '') {
    errors.push('Please specify the \'Other\' primary consent.');
  }

  if (!isNil(consentGroup.otherSecondary) && consentGroup.otherSecondary == '') {
    errors.push('Please specify the \'Other\' secondary consent.');
  }

  return errors;
};


const EditConsentGroup = (props) => {
  const {
    consentGroup,
    setConsentGroup,
  } = props;

  const onChange = ({key, value}) => {
    setConsentGroup({
      ...consentGroup,
      ...{
        [key]: value,
      },
    });
  };

  const onPrimaryChange = ({key, value}) => {
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
        [key]: value,
      }
    });
  };

  return div({
    style: {
      width: '70%'
    }
  }, [

    h3(['Consent Group Information']),

    // name
    h(FormField, {
      id: 'consentGroupName',
      title: 'Consent Group Name',
      validators: [FormValidators.REQUIRED],
      placeholder: 'Enter name',
      defaultValue: consentGroup.consentGroupName,
      onChange,
    }),

    // primary
    h(FormField,
      {
        type: FormFieldTypes.RADIO,
        id: 'primaryRadio',
        title: 'Consent Group - Primary Data Use Terms',
        validators: [FormValidators.REQUIRED],
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
        defaultValue: selectedPrimaryGroup(consentGroup),
        onChange: ({value}) => onPrimaryChange({key: value.key, value: value.value}),
      }
    ),

    // secondary
    h(FormField, {
      title: 'Consent Secondary Data Use Terms',
      description: 'Select all applicable data use parameters',
      id: 'nmds',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'No methods development or validation studies (NMDS)',
      defaultValue: consentGroup.nmds,
      onChange,
    }),

    h(FormField, {
      id: 'gso',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Genetic studies only (GSO)',
      defaultValue: consentGroup.gso,
      onChange,
    }),

    h(FormField, {
      id: 'pub',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Publication Required (PUB)',
      defaultValue: consentGroup.pub,
      onChange,
    }),

    h(FormField, {
      id: 'col',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Collaboration Required (COL)',
      defaultValue: consentGroup.col,
      onChange
    }),

    h(FormField, {
      id: 'irb',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Ethics Approval Required (IRB)',
      defaultValue: consentGroup.irb,
      onChange
    }),

    h(FormField, {
      id: 'gs',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Geographic Restriction (GS-)',
      valueType: 'string',
      placeholder: 'Specify (TODO)',
      defaultValue: consentGroup.gs,
      onChange
    }),

    h(FormField, {
      id: 'mor',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Publication Moratorium (MOR)',
      defaultValue: consentGroup.mor,
      onChange
    }),

    h(FormField, {
      id: 'npu',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Non-profit Use Only (NPU)',
      defaultValue: consentGroup.npu,
      onChange
    }),

    h(FormField, {
      id: 'otherSecondary',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Other',
      valueType: 'string',
      placeholder: 'Please specify.',
      defaultValue: consentGroup.otherSecondary,
      onChange
    }),

    // location

    h(FormField, {
      id: 'dataLocation',
      type: FormFieldTypes.MULTISELECT,
      title: 'Data Location',
      description: 'Please provide the location of your data resource for this consent group',
      exclusiveValues: 'Not Determined',
      options: dataLocationOptions,
      placeholder: 'Data Location(s)',
      validators: [FormValidators.REQUIRED],
      defaultValue: consentGroup.dataLocation.map((loc) => {return {label: loc, value: loc};}),
      onChange: ({key, value}) => onChange({key: key, value: value.map((sel) => sel.value)}),
    }),

    h(FormField, {
      id: 'url',
      title: 'Data URL',
      validators: [FormValidators.REQUIRED],
      placeholder: 'Free text field for entering URL of data',
      defaultValue: consentGroup.url,
      onChange
    }),
  ]);
};

const ConsentGroupErrors = (props) => {

  const {
    errors
  } = props;

  return div({},
    errors.map((err, idx) => {
      return div({style: {marginBottom: '2rem'}}, [
        h(Notification,
          {
            key: idx,
            notificationData: {
              level: 'danger',
              message: err,
            }
          }),
      ]);
    }),
  );
};


export const ConsentGroupForm = (props) => {
  const {
    idx,
    saveConsentGroup,
    deleteConsentGroup,
  } = props;

  const [consentGroup, setConsentGroup] = useState({
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
    gs: null, // string: geographic restriction
    mor: false, // publication moratorium
    npu: false, // non profit only
    otherSecondary: null, // string

    // dataLocation is one of:
    // "AnVIL Workspace", "Terra Workspace",
    // "TDR Location", "Not Determined"
    dataLocation: [],

    url: ''
  });


  const [consentGroupValidationErrors, setConsentGroupValidationErrors] = useState([]);
  const [editMode, setEditMode] = useState(true);

  return div({
    style: {
      border: '1px solid #283593',
      padding: '1rem 2rem 1rem 2rem',
      borderRadius: '4px',
      marginBottom: '2rem',
    },
    id: idx+'_consentGroupForm'
  }, [

    h(ConsentGroupErrors,
      {
        errors: consentGroupValidationErrors,
      }),

    (editMode
      ? h(EditConsentGroup, {
        ...props,
        ...{consentGroup: consentGroup, setConsentGroup: setConsentGroup},
      })
      : h(ConsentGroupSummary, {
        ...props,
        ...{consentGroup: consentGroup},
      })),

    // save + delete
    div({
      style: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: '2rem',
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
          type: 'button',
          isRendered: !editMode,
          onClick: () => {
            setEditMode(true);
          },
          className: 'f-right btn-primary common-background',
        }, ['Edit']),

        button({
          id: idx+'_saveConsentGroup',
          type: 'button',
          isRendered: editMode,
          onClick: () => {
            const errors = computeConsentGroupValidationErrors(consentGroup);
            const valid = errors.length === 0;

            setConsentGroupValidationErrors(errors);

            if (valid) {
              saveConsentGroup({ value: consentGroup, valid: true });
              setEditMode(false);
            }
          },
          className: 'f-right btn-primary common-background',
        }, ['Save']),
      ]),
    ])
  ]);
};

export default ConsentGroupForm;