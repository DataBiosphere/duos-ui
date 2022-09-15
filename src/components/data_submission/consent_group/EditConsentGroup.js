import { useState } from 'react';
import { div, h, h3 } from 'react-hyperscript-helpers';
import { isNil, isString } from 'lodash/fp';
import { FormFieldTypes, FormField, FormValidators } from '../../forms/forms';

export const selectedPrimaryGroup = (consentGroup) => {
  if (!isNil(consentGroup.generalResearchUse) && consentGroup.generalResearchUse) {
    return {
      selected: 'generalResearchUse',
    };
  } else if (!isNil(consentGroup.hmb) && consentGroup.hmb) {
    return {
      selected: 'hmb',
    };
  } else if (!isNil(consentGroup.diseaseSpecificUse) && isString(consentGroup.diseaseSpecificUse)) {
    return {
      selected: 'diseaseSpecificUse',
      value: consentGroup.diseaseSpecificUse,
    };
  } else if (!isNil(consentGroup.poa) && consentGroup.poa) {
    return {
      selected: 'poa',
    };
  } else if (!isNil(consentGroup.otherPrimary) && isString(consentGroup.otherPrimary)) {
    return {
      selected: 'otherPrimary',
      value: consentGroup.otherPrimary,
    };
  }

  return undefined;
};

export const EditConsentGroup = (props) => {
  const {
    consentGroup,
    setConsentGroup,
    idx,
  } = props;

  const [showOtherSecondaryText, setShowOtherSecondaryText] = useState(false);
  const [otherSecondaryText, setOtherSecondaryText] = useState('');

  const [showGSText, setShowGSText] = useState(false);
  const [gsText, setGSText] = useState('');


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
        [key]: value || true,
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
      id: idx+'_consentGroupName',
      name: 'consentGroupName',
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
        id: idx+'_primaryRadio',
        name: 'primaryRadio',
        title: 'Consent Group - Primary Data Use Terms',
        validators: [FormValidators.REQUIRED],
        description: 'Please select one of the following data use permissions for your dataset',
        options: [
          {
            id: 'generalResearchUse',
            name: 'generalResearchUse',
            text: 'General Research Use',
          },
          {
            id: 'hmb',
            name: 'hmb',
            text: 'Health/Medical/Biomedical Research Use',
          },
          {
            id: 'diseaseSpecificUse',
            name: 'diseaseSpecificUse',
            text: 'Disease-Specific Research Use',
            type: 'string',
            placeholder: 'Please enter one or more diseases',
          },
          {
            id: 'poa',
            name: 'poa',
            text: 'Populations, Origins, Ancestry Use',
          },
          {
            id: 'otherPrimary',
            name: 'otherPrimary',
            text: 'Other',
            type: 'string',
            placeholder: 'Please specify',
          },
        ],
        defaultValue: selectedPrimaryGroup(consentGroup),
        onChange: ({value}) => onPrimaryChange({key: value.selected, value: value.value}),
      }
    ),

    // secondary
    h(FormField, {
      title: 'Consent Secondary Data Use Terms',
      description: 'Select all applicable data use parameters',
      id: idx+'_nmds',
      name: 'nmds',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'No methods development or validation studies (NMDS)',
      defaultValue: consentGroup.nmds,
      onChange,
    }),

    h(FormField, {
      id: idx+'_gso',
      name: 'gso',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Genetic studies only (GSO)',
      defaultValue: consentGroup.gso,
      onChange,
    }),

    h(FormField, {
      id: idx+'_pub',
      name: 'pub',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Publication Required (PUB)',
      defaultValue: consentGroup.pub,
      onChange,
    }),

    h(FormField, {
      id: idx+'_col',
      name: 'col',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Collaboration Required (COL)',
      defaultValue: consentGroup.col,
      onChange
    }),

    h(FormField, {
      id: idx+'_irb',
      name: 'irb',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Ethics Approval Required (IRB)',
      defaultValue: consentGroup.irb,
      onChange
    }),

    h(FormField, {
      id: idx+'_gs',
      name: 'gs',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Geographic Restriction (GS-)',
      defaultValue: showGSText,
      onChange: ({key, value}) => {
        setShowGSText(value);

        if (value) {
          onChange({key: key, value: gsText});
        } else {
          onChange({key: key, value: undefined});
        }
      }
    }),

    h(FormField, {
      isRendered: showGSText,
      id: idx+'_gs',
      name: 'gs',
      validators: [FormValidators.REQUIRED],
      placeholder: 'Specify Geographic Restriction',
      defaultValue: gsText,
      onChange: ({key, value, isValid}) => {
        setGSText(value);
        onChange({key: key, value: value, isValid: isValid});
      },
    }),

    h(FormField, {
      id: idx+'_mor',
      name: 'mor',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Publication Moratorium (MOR)',
      defaultValue: consentGroup.mor,
      onChange
    }),

    h(FormField, {
      id: idx+'_npu',
      name: 'npu',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Non-profit Use Only (NPU)',
      defaultValue: consentGroup.npu,
      onChange
    }),

    h(FormField, {
      id: idx+'_otherSecondary',
      name: 'otherSecondary',
      type: FormFieldTypes.CHECKBOX,
      toggleText: 'Other',
      defaultValue: showOtherSecondaryText,
      onChange: ({key, value}) => {
        setShowOtherSecondaryText(value);

        if (value) {
          onChange({key: key, value: otherSecondaryText});
        } else {
          onChange({key: key, value: undefined});
        }
      }
    }),

    h(FormField, {
      isRendered: showOtherSecondaryText,
      id: idx+'_otherSecondaryText',
      name: 'otherSecondary',
      validators: [FormValidators.REQUIRED],
      placeholder: 'Please specify',
      defaultValue: otherSecondaryText,
      onChange: ({key, value, isValid}) => {
        setOtherSecondaryText(value);
        onChange({key: key, value: value, isValid: isValid});
      },
    }),

    // location

    h(FormField, {
      id: idx+'_dataLocation',
      name: 'dataLocation',
      type: FormFieldTypes.SELECT,
      isMulti: true,
      title: 'Data Location',
      description: 'Please provide the location of your data resource for this consent group',
      exclusiveValues: ['Not Determined'],
      selectOptions: [
        'AnVIL Workspace',
        'Terra Workspace',
        'TDR Location',
        'Not Determined',
      ],
      defaultValue: consentGroup.dataLocation,
      placeholder: 'Data Location(s)',
      validators: [FormValidators.REQUIRED],
      onChange,
    }),

    h(FormField, {
      id: idx+'_url',
      name: 'url',
      title: 'Data URL',
      validators: [FormValidators.REQUIRED, FormValidators.URL],
      placeholder: 'Free text field for entering URL of data',
      defaultValue: consentGroup.url,
      onChange
    }),
  ]);
};