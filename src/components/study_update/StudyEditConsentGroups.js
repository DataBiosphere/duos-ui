import { useEffect, useState, useCallback } from 'react';
import { button, h, h2, div, span, a } from 'react-hyperscript-helpers';
import { find, isArray, isNil, isEmpty } from 'lodash/fp';

import { FormFieldTypes, FormField, FormValidators, FormFieldTitle, FormTable} from '../forms/forms';
import { DAC, DAR, DataSet } from '../../libs/ajax';
import { computeConsentGroupValidationErrors } from '../data_submission/consent_group/ConsentGroupErrors';

export const StudyConsentGroupsUpdate = (props) => {
  const {
    idx,
    dataset,
    formData
  } = props;

  const searchOntologies = async (query, callback) => {
    let options = [];
    await DAR.getAutoCompleteOT(query).then(
      items => {
        options = items.map((item) => {
          return item.label;
        });
        callback(options);
      });
  };

  const dacOptions = (dacs) => {
    let options = [];
    if (!isNil(dacs)) {
      options = dacs.map((dac) => {
        return { displayText: dac.name, dacId: dac.dacId };
      });
    }
    return options;
  };

  return div({
    style: {
      border: '1px solid #283593',
      padding: '1rem 2rem 1rem 2rem',
      borderRadius: '4px',
      marginBottom: '2rem',
    },
    id: idx + '_studyConsentGroupForm'
  }, [
    div({
      style: {
        width: '70%'
      }
    }, [
      // name
      h(FormField, {
        id: idx + '_consentGroupName',
        title: 'Consent Group Name',
        validators: [FormValidators.REQUIRED],
        placeholder: 'Enter name',
        defaultValue: formData?.properties.datasetName,
        onChange: ({ value }) => {
          formData.properties.datasetName = value;
        },
        //   validation: validation.consentGroupName,
        //   onValidationChange,
      }),
      // Primary Data Use
      div({}, [
        h(FormField, {
          title: 'Primary Data Use Terms*',
          id: idx + '_primaryConsent_gru',
          description: 'Please select one of the following data use permissions for your dataset',
          type: FormFieldTypes.RADIOBUTTON,
          value: 'generalResearchUse',
          toggleText: 'General Research Use',
          defaultValue: formData?.dataUse.generalUse === true ? 'generalResearchUse' : undefined,
          disabled: true,
        }),

        h(FormField, {
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_hmb',
          value: 'hmb',
          toggleText: 'Health/Medical/Biomedical Research Use',
          defaultValue: formData?.dataUse.hmbResearch === true ? 'hmb' : undefined,
          disabled: true,
        }),

        h(FormField, {
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_diseaseSpecificUse',
          value: 'diseaseSpecificUse',
          toggleText: 'Disease-Specific Research Use',
          defaultValue: isArray(formData?.dataUse.diseaseRestrictions) && formData?.dataUse.diseaseRestrictions.length > 0 ? 'diseaseSpecificUse' : undefined,
          disabled: true,
        }),

        div({
          style: {
            isRendered: (!isEmpty(formData?.dataUse.diseaseLabels)),
            marginBottom: '1.0rem'
          }
        }, [
          h(FormField, {
            type: FormFieldTypes.SELECT,
            isMulti: true,
            isCreatable: true,
            optionsAreString: true,
            isAsync: true,
            id: idx + '_diseaseRestrictionsText',
            validators: [FormValidators.REQUIRED],
            placeholder: 'none',
            loadOptions: searchOntologies,
            defaultValue: formData?.dataUse.diseaseLabels,
            disabled: true,
          }),
        ]),

        h(FormField, {
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_poa',
          value: 'poa',
          toggleText: 'Populations, Origins, Ancestry Use',
          defaultValue: formData?.dataUse.populationsOriginsAncestry === true ? 'poa' : undefined,
          disabled: true,
        }),

        h(FormField, {
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_openAccess',
          value: 'openAccess',
          toggleText: 'No Restrictions (Open Access Data)',
          defaultValue: formData?.properties.openAccess ? 'openAccess' : undefined,
          disabled: true,
        }),

        h(FormField, {
          type: FormFieldTypes.RADIOBUTTON,
          id: idx + '_primaryConsent_otherPrimary',
          value: 'otherPrimary',
          toggleText: 'Other',
          defaultValue: formData?.dataUse.otherRestrictions ? 'otherPrimary' : undefined,
          disabled: true,
        }),

        div({
          style: {
            isRendered: (!isEmpty(formData?.dataUse.otherRestrictions)),
            marginBottom: '1.0rem'
          }
        }, [
          h(FormField, {
            id: idx + '_otherPrimaryText',
            validators: [FormValidators.REQUIRED],
            placeholder: 'none',
            defaultValue: formData?.dataUse.other,
            disabled: true,
          }),
        ]),
      ]),
      // secondary data use terms
      div({}, [
        h(FormField, {
          title: 'Secondary Data Use Terms',
          description: 'Please select all applicable data use parameters.',
          type: FormFieldTypes.CHECKBOX,
          id: idx + '_methodsResearch',
          toggleText: 'No methods development or validation studies (NMDS)',
          defaultValue: formData?.dataUse.methodsResearch === true,
          disabled: true,
        }),
        h(FormField, {
          type: FormFieldTypes.CHECKBOX,
          id: idx + '_geneticStudiesOnly',
          toggleText: 'Genetic studies only (GSO)',
          defaultValue: formData?.dataUse.geneticStudiesOnly === true,
          disabled: true,
        }),
        h(FormField, {
          type: FormFieldTypes.CHECKBOX,
          id: idx + '_publicationResults',
          toggleText: 'Publication Required (PUB)',
          defaultValue: formData?.dataUse.publicationResults === true,
          disabled: true,
        }),
        h(FormField, {
          type: FormFieldTypes.CHECKBOX,
          id: idx + '_collaboratorRequired',
          toggleText: 'Collaboration Required (COL)',
          defaultValue: formData?.dataUse.collaboratorRequired === true,
          disabled: true,
        }),
        h(FormField, {
          type: FormFieldTypes.CHECKBOX,
          id: idx + '_ethicsApprovalRequired',
          name: 'ethicsApprovalRequired',
          toggleText: 'Ethics Approval Required (IRB)',
          defaultValue: formData?.dataUse.ethicsApprovalRequired === true,
          disabled: true,
        }),
        h(FormField, {
          type: FormFieldTypes.CHECKBOX,
          id: idx + '_geographicalRestrictions',
          toggleText: 'Geographic Restriction (GS-)',
          defaultValue: formData?.dataUse.geographicalRestrictions === 'Yes',
          disabled: true,
        }),
        h(FormField, {
          type: FormFieldTypes.CHECKBOX,
          id: idx + '_publicationMoratorium',
          toggleText: 'Publication Moratorium (MOR)',
          defaultValue: formData?.dataUse.publicationMoratorium === 'true',
          disabled: true,
        }),
        h(FormField, {
          type: FormFieldTypes.CHECKBOX,
          id: idx + '_nonCommercialUse',
          toggleText: 'Non-profit Use Only (NPU)',
          defaultValue: formData?.dataUse.commercialUse === false,
          disabled: true,
        }),
        h(FormField, {
          type: FormFieldTypes.CHECKBOX,
          id: idx + '_otherSecondary',
          toggleText: 'Other',
          defaultValue: formData?.dataUse.hasSecondaryOther,
          disabled: true,
        }),
        h(FormField, {
          id: idx + '_otherSecondaryText',
          validators: [FormValidators.REQUIRED],
          placeholder: 'Please specify',
          defaultValue: formData?.dataUse.secondaryOther,
          disabled: true,
        }),
      ]),
    ]),
    // data access committee
    // h(FormField, {
    //   isRendered: formData?.dataUse.openAccess !== true,
    //   id: idx + '_dataAccessCommitteeId',
    //   title: 'Data Access Committee',
    //   description: 'Please select which DAC should govern requests for this dataset',
    //   type: FormFieldTypes.SELECT,
    //   selectOptions: dacOptions(formData?.dac.dacs),
    //   defaultValue: [
    //     { displayText: formData.dac.name, dacId: formData.dac.dacId },
    //   ],
    //   disabled: true,
    // }),
    // location
    div({style:{ display: 'flex', flexDirection:'row', justifyContent: 'space-between' }}, [
      h(FormFieldTitle, {
        required: true,
        title: 'Data Location',
        description: 'Please provide the location of your data resource for this consent group',
      }),
    ]),
    div({className: 'flex flex-row'}, [
      h(FormField, {
        style: { width: '50%' },
        id: '_dataLocation',
        type: FormFieldTypes.SELECT,
        selectOptions: [
          'AnVIL Workspace',
          'Terra Workspace',
          'TDR Location',
          'Not Determined'
        ],
        placeholder: 'Data Location(s)',
        defaultValue: formData?.properties.dataLocation,
//  TODO: get help!!!!
        // onChange: ({key, value, isValid}) => {

        //   if (value === 'Not Determined') {
        //     // if not determined, clear url field as well.
        //     // must do in one batch call, otherwise react gets confused.
        //     onBatchChange({ key, value }, {key: 'url', value: undefined});
        //   } else {
        //     onChange({key, value, isValid});
        //   }
        // },
      }),
      h(FormField, {
        style: { width: '50%', paddingLeft: '1.5%' },
        id: idx + '_url',
        name: 'url',
        validators: [FormValidators.URL],
        disabled: formData?.properties.dataLocation === 'Not Determined',
        placeholder: 'Enter a URL for your data location here',
        defaultValue: formData?.properties.dataLocationURL,
        // onchange
      }),
    ]),
    // file types
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
        },
        {
          id: idx + '_functionalEquivalence',
          name: 'functionalEquivalence',
          title: 'Functional Equivalence',
          placeholder: 'Type',
        }
      ],
      defaultValue: formData?.properties.fileTypes,
      enableAddingRow: true,
      addRowLabel: 'Add New File Type',
      minLength: 1,
      //onChange,
    }),
    // number of participants
    div({
      style: { width: '50%' }
    }, [
      h(FormField, {
        id: idx + '_numberOfParticipants',
        name: 'numberOfParticipants',
        title: '# of Participants',
        placeholder: 'Number',
        type: FormFieldTypes.NUMBER,
        validators: [FormValidators.REQUIRED],
        defaultValue: formData?.properties.numberOfParticipants,
        //onChange,
      }),
    ]),
    // NIH Institutional Certification
    div({style:{ display: 'flex', flexDirection:'row', justifyContent: 'flex-start', alignItems: 'flex-end', marginRight: '30px' }}, [
      h(FormField, {
        type: FormFieldTypes.FILE,
        title: 'NIH Institutional Certification',
        description: 'If an Institutional Certification for this consent group exists, please upload it here',
        id: idx + '_nihInstituionalCertificationFile',
        name: 'nihInstituionalCertificationFile',
        hideTextBar: true,
        hideInput: true,
      }),
      h(FormField, {
        style: {margin: '11px'},
        type: FormFieldTypes.FILE,
        id: idx + '_fileInputSection',
        defaultValue: formData?.nihInstitutionalCertificationFile,
        //onChange: ({value}) => setNihInstitutionalCertificationFile(value),
        hideTextBar: true,
      }),
    ]),
    h(FormField, {
      isRendered: !isNil(formData?.nihInstitutionalCertificationFile),
      id: `${idx}_fileName`,
      placeholder: 'Filename.txt',
      defaultValue: formData?.nihInstitutionalCertificationFile?.name,
      readOnly: true,
    }),
    // save + cancel
    div({
      style: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: '2rem',
      }
    }, [
      div({}, [
        button({
          className: 'study-edit-form-cancel-button f-left btn',
          type: 'button',
          onClick: () => setStudyEditMode(false),
        }, ['Cancel']),
      ]),
      div({}, [
        button({
          id: idx + '_editConsentGroup',
          type: 'button',
          isRendered: !studyEditMode,
          onClick: () => {
            setStudyEditMode(true);
          },
          className: 'f-right btn-primary common-background',
        }, ['Edit']),

        button({
          id: idx + '_saveConsentGroup',
          type: 'button',
          isRendered: studyEditMode,
          onClick: () => {
            const errors = null;
            computeConsentGroupValidationErrors(formData);
            const valid = isEmpty(errors);

            //setValidation(errors);

            if (valid) {
              saveConsentGroup({ value: formData, valid: true });
              setStudyEditMode(false);
            }
          },
          className: 'f-right btn-primary common-background',
        }, ['Save']),
      ]),
    ])
  ]);
};

export default StudyConsentGroupsUpdate;