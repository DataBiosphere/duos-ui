import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { isNil, isString } from 'lodash/fp';
import { FormFieldTypes, FormField, FormTable, FormValidators } from '../../forms/forms';
import { DAR } from '../../../libs/ajax';

export const selectedPrimaryGroup = (consentGroup) => {
  if (!isNil(consentGroup.generalResearchUse) && consentGroup.generalResearchUse) {
    return 'generalResearchUse';
  } else if (!isNil(consentGroup.hmb) && consentGroup.hmb) {
    return 'hmb';
  } else if (!isNil(consentGroup.diseaseSpecificUse)) {
    return 'diseaseSpecificUse';
  } else if (!isNil(consentGroup.poa) && consentGroup.poa) {
    return 'poa';
  } else if (!isNil(consentGroup.openAccess) && consentGroup.openAccess) {
    return 'openAccess';
  } else if (!isNil(consentGroup.otherPrimary) && isString(consentGroup.otherPrimary)) {
    return 'otherPrimary';
  }

  return undefined;
};

const searchOntologies = (query, callback) => {
  let options = [];
  DAR.getAutoCompleteOT(query).then(
    items => {
      options = items.map(function (item) {
        return item.label;
      });
      callback(options);
    });
};

export const EditConsentGroup = (props) => {
  const {
    consentGroup,
    setConsentGroup,
    nihInstitutionalCertificationFile,
    setNihInstitutionalCertificationFile,
    idx,
    dacs,
    validation,
    onValidationChange,
  } = props;

  const [showOtherSecondaryText, setShowOtherSecondaryText] = useState(!isNil(consentGroup.otherSecondary));
  const [otherSecondaryText, setOtherSecondaryText] = useState(consentGroup.otherSecondary);

  const [showGSText, setShowGSText] = useState(!isNil(consentGroup.gs));
  const [gsText, setGSText] = useState(consentGroup.gs);

  const [showOtherPrimaryText, setShowOtherPrimaryText] = useState(!isNil(consentGroup.otherPrimary));
  const [otherPrimaryText, setOtherPrimaryText] = useState(consentGroup.otherPrimary);

  const [showDiseaseSpecificUseSearchbar, setShowDiseaseSpecificUseSearchbar] = useState(!isNil(consentGroup.diseaseSpecificUse));
  const [selectedDiseases, setSelectedDiseases] = useState(consentGroup.diseaseSpecificUse || []);

  const [showMORText, setShowMORText] = useState(!isNil(consentGroup.mor));
  const [morText, setMORText] = useState(consentGroup.mor);

  const onChange = ({ key, value }) => {
    setConsentGroup({
      ...consentGroup,
      ...{
        [key]: value,
      },
    });
  };

  const onPrimaryChange = ({ key, value }) => {
    setConsentGroup({
      ...consentGroup,
      ...{
        generalResearchUse: false,
        hmb: false,
        diseaseSpecificUse: undefined,
        poa: false,
        openAccess: false,
        otherPrimary: undefined,
      },
      ...{
        [key]: value,
      }
    });

    setShowDiseaseSpecificUseSearchbar(key === 'diseaseSpecificUse');
    setShowOtherPrimaryText(key === 'otherPrimary');
  };

  return div({}, [
    div({
      style: {
        width: '70%'
      }
    }, [
      // name
      h(FormField, {
        id: idx + '_consentGroupName',
        name: 'consentGroupName',
        title: 'Consent Group Name',
        validators: [FormValidators.REQUIRED],
        placeholder: 'Enter name',
        defaultValue: consentGroup.consentGroupName,
        onChange,
        validation: validation.consentGroupName,
        onValidationChange,
      }),

      // primary
      div({}, [
        h(FormField, {
          title: 'Primary Data Use Terms*',
          description: 'Please select one of the following data use permissions for your dataset',
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_generalResearchUse',
          name: 'primaryConsent',
          value: 'generalResearchUse',
          toggleText: 'General Research Use',
          defaultValue: selectedPrimaryGroup(consentGroup),
          onChange: ({ value }) => {
            onPrimaryChange({ key: value, value: true });
          },
          validation: validation.generalResearchUse,
          onValidationChange: ({ validation }) => {
            onValidationChange({ key: 'generalResearchUse', validation });
          },
        }),

        h(FormField, {
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_hmb',
          name: 'primaryConsent',
          value: 'hmb',
          toggleText: 'Health/Medical/Biomedical Research Use',
          defaultValue: selectedPrimaryGroup(consentGroup),
          onChange: ({ value }) => {
            onPrimaryChange({ key: value, value: true });
          },
          validation: validation.hmb,
          onValidationChange: ({ validation }) => {
            onValidationChange({ key: 'hmb', validation });
          },
        }),

        h(FormField, {
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_diseaseSpecificUse',
          name: 'primaryConsent',
          value: 'diseaseSpecificUse',
          toggleText: 'Disease-Specific Research Use',
          defaultValue: selectedPrimaryGroup(consentGroup),
          onChange: ({ value }) => {
            onPrimaryChange({
              key: value,
              value: selectedDiseases
            });
          },
          validation: validation.diseaseSpecificUse,
        }),
        div({
          isRendered: showDiseaseSpecificUseSearchbar,
          style: {
            marginBottom: '1.0rem'
          }
        }, [
          h(FormField, {
            type: FormFieldTypes.SELECT,
            isMulti: true,
            isCreatable: true,
            isAsync: true,
            optionsAreString: true,
            loadOptions: searchOntologies,
            id: idx + '_diseaseSpecificUseText',
            name: 'diseaseSpecificUse',
            validators: [FormValidators.REQUIRED],
            placeholder: 'Please enter one or more diseases',
            defaultValue: selectedDiseases,
            validation: validation.diseaseSpecificUse,
            onValidationChange,
            onChange: ({ key, value, isValid }) => {
              setSelectedDiseases(value);
              onChange({
                key: key,
                value: value,
                isValid: isValid
              });
            },
          }),
        ]),

        h(FormField, {
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_poa',
          name: 'primaryConsent',
          value: 'poa',
          toggleText: 'Populations, Origins, Ancestry Use',
          defaultValue: selectedPrimaryGroup(consentGroup),
          onChange: ({ value }) => {
            onPrimaryChange({ key: value, value: true });
          },
          validation: validation.poa,
          onValidationChange: ({ validation }) => {
            onValidationChange({ key: 'poa', validation });
          },
        }),

        h(FormField, {
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_openAccess',
          name: 'primaryConsent',
          value: 'openAccess',
          toggleText: 'No Restrictions (Open Access Data)',
          defaultValue: selectedPrimaryGroup(consentGroup),
          onChange: ({ value }) => {
            onPrimaryChange({ key: value, value: true });
          },
          validation: validation.openAccess,
        }),

        h(FormField, {
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_otherPrimary',
          name: 'primaryConsent',
          value: 'otherPrimary',
          toggleText: 'Other',
          defaultValue: selectedPrimaryGroup(consentGroup),
          onChange: ({ value }) => {
            onPrimaryChange({ key: value, value: otherPrimaryText });
          },
          validation: validation.otherPrimary,
        }),

        h(FormField, {
          isRendered: showOtherPrimaryText,
          id: idx + '_otherPrimaryText',
          name: 'otherPrimary',
          validators: [FormValidators.REQUIRED],
          placeholder: 'Please specify',
          defaultValue: otherPrimaryText,
          onChange: ({ key, value, isValid }) => {
            setOtherPrimaryText(value);
            onChange({ key: key, value: value, isValid: isValid });
          },
          validation: validation.otherPrimary,
          onValidationChange: ({ validation }) => {
            onValidationChange({ key: 'otherPrimary', validation });
          },
        }),
      ]),

      // secondary
      div({
        isRendered: consentGroup.openAccess !== true,
      }, [
        h(FormField, {
          title: 'Secondary Data Use Terms',
          description: 'Select all applicable data use parameters',
          id: idx + '_nmds',
          name: 'nmds',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'No methods development or validation studies (NMDS)',
          defaultValue: consentGroup.nmds,
          onChange,
          validation: validation.nmds,
          onValidationChange,
        }),

        h(FormField, {
          id: idx + '_gso',
          name: 'gso',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Genetic studies only (GSO)',
          defaultValue: consentGroup.gso,
          onChange,
          validation: validation.gso,
          onValidationChange,
        }),

        h(FormField, {
          id: idx + '_pub',
          name: 'pub',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Publication Required (PUB)',
          defaultValue: consentGroup.pub,
          onChange,
          validation: validation.pub,
          onValidationChange,
        }),

        h(FormField, {
          id: idx + '_col',
          name: 'col',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Collaboration Required (COL)',
          defaultValue: consentGroup.col,
          onChange,
          validation: validation.col,
          onValidationChange,
        }),

        h(FormField, {
          id: idx + '_irb',
          name: 'irb',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Ethics Approval Required (IRB)',
          defaultValue: consentGroup.irb,
          onChange,
          validation: validation.irb,
          onValidationChange,
        }),

        h(FormField, {
          id: idx + '_gs',
          name: 'gs',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Geographic Restriction (GS-)',
          defaultValue: showGSText,
          onChange: ({ key, value }) => {
            setShowGSText(value);

            if (value) {
              onChange({ key: key, value: gsText });
            } else {
              onChange({ key: key, value: undefined });
            }
          },
        }),

        h(FormField, {
          isRendered: showGSText,
          id: idx + '_gsText',
          name: 'gs',
          validators: [FormValidators.REQUIRED],
          placeholder: 'Specify Geographic Restriction',
          defaultValue: gsText || '',
          onChange: ({ key, value, isValid }) => {
            setGSText(value);
            onChange({ key: key, value: value, isValid: isValid });
          },
          validation: validation.gs,
          onValidationChange,
        }),

        h(FormField, {
          id: idx + '_mor',
          name: 'mor',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Publication Moratorium (MOR)',
          defaultValue: showMORText,
          onChange: ({ key, value }) => {
            setShowMORText(value);
            onChange({ key: key, value: (value ? morText : undefined) });
          }
        }),

        h(FormField, {
          isRendered: showMORText,
          id: idx + '_morText',
          name: 'mor',
          validators: [FormValidators.REQUIRED, FormValidators.DATE],
          placeholder: 'Please specify date (YYYY-MM-DD)',
          defaultValue: morText,
          onChange: ({ key, value, isValid }) => {
            setMORText(value);
            onChange({ key: key, value: value, isValid: isValid });
          },
          validation: validation.mor,
          onValidationChange,
        }),

        h(FormField, {
          id: idx + '_npu',
          name: 'npu',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Non-profit Use Only (NPU)',
          defaultValue: consentGroup.npu,
          onChange,
          validation: validation.npu,
          onValidationChange,
        }),

        h(FormField, {
          id: idx + '_otherSecondary',
          name: 'otherSecondary',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Other',
          defaultValue: showOtherSecondaryText,
          onChange: ({ key, value }) => {
            setShowOtherSecondaryText(value);

            if (value) {
              onChange({ key: key, value: otherSecondaryText });
            } else {
              onChange({ key: key, value: undefined });
            }
          }
        }),

        h(FormField, {
          isRendered: showOtherSecondaryText,
          id: idx + '_otherSecondaryText',
          name: 'otherSecondary',
          validators: [FormValidators.REQUIRED],
          placeholder: 'Please specify',
          defaultValue: otherSecondaryText || '',
          onChange: ({ key, value, isValid }) => {
            setOtherSecondaryText(value);
            onChange({ key: key, value: value, isValid: isValid });
          },
          validation: validation.otherSecondary,
          onValidationChange,
        }),
      ]),

      // data access committee
      div({
        isRendered: consentGroup.openAccess !== true,
      }, [
        h(FormField, {
          id: 'dataAccessCommitteeId',
          title: 'Data Access Committee*',
          description: 'Please select which DAC should govern requests for this dataset',
          type: FormFieldTypes.SELECT,
          selectOptions: dacs.map((dac) => {
            return { dacId: dac.dacId, displayText: dac.name };
          }),
          onChange: ({ key, value }) => {
            onChange({ key, value: value.dacId });
          }
        }),
      ]),

      // location
      h(FormField, {
        id: idx + '_dataLocation',
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
        validation: validation.dataLocation,
        onValidationChange,
      }),

      h(FormField, {
        id: idx + '_url',
        name: 'url',
        title: 'Data URL',
        validators: [FormValidators.REQUIRED, FormValidators.URL],
        placeholder: 'Free text field for entering URL of data',
        defaultValue: consentGroup.url,
        onChange,
        validation: validation.url,
        onValidationChange,
      }),
    ]),

    h(FormTable, {
      id: idx + '_fileTypes',
      name: 'fileTypes',
      formFields: [
        {
          id: idx + '_fileType',
          name: 'fileType',
          title: 'File Type',
          type: FormFieldTypes.SELECT,
          selectOptions: ['Arrays', 'Genome', 'Exome', 'Survey', 'Phenotype'],
          validators: [FormValidators.REQUIRED]
        },
        {
          id: idx + '_functionalEquivalence',
          name: 'functionalEquivalence',
          title: 'Functional Equivalence',
          placeholder: 'Type',
          validators: [FormValidators.REQUIRED]
        }, {
          id: idx + '_numberOfParticipants',
          name: 'numberOfParticipants',
          title: '# of Participants',
          placeholder: 'Number',
          type: FormFieldTypes.NUMBER,
          validators: [FormValidators.REQUIRED]
        }
      ],
      defaultValue: consentGroup.fileTypes,
      enableAddingRow: true,
      addRowLabel: 'Add New Filetype',
      minLength: 1,
      onChange,
      validation: validation.fileTypes,
      onValidationChange,
    }),

    h(FormField, {
      type: FormFieldTypes.FILE,
      title: 'NIH Institutional Certification',
      description: 'If an Institutional Certification for this consent group exists, please upload it here',
      id: idx + '_nihInstituionalCertificationFile',
      name: 'nihInstituionalCertificationFile',
      defaultValue: nihInstitutionalCertificationFile,
      onChange: ({ value }) => setNihInstitutionalCertificationFile(value),
    })
  ]);
};