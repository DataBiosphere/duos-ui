import {div, h, h2} from 'react-hyperscript-helpers';
import {useState} from 'react';
import {FormField, FormFieldTypes, FormValidators} from '../forms/forms';

export const YES_NHGRI_YES_PHS_ID = 'I am NHGRI funded and I have a dbGaP PHS ID already';
export const YES_NHGRI_NO_PHS_ID = 'I am NHGRI funded and I do not have a dbGaP PHS ID';
export const NO_NHGRI_YES_ANVIL = 'I am not NHGRI funded but I am seeking to submit data to AnVIL';
export const NO_NHGRI_NO_ANVIL = 'I am not NHGRI funded and do not plan to store data in AnVIL';

const nihAnvilUseLabels = {
  yes_nhgri_yes_phs_id: YES_NHGRI_YES_PHS_ID,
  yes_nhgri_no_phs_id: YES_NHGRI_NO_PHS_ID,
  no_nhgri_yes_anvil: NO_NHGRI_YES_ANVIL,
  no_nhgri_no_anvil: NO_NHGRI_NO_ANVIL,
};

const allNihAnvilUseFields = [
  'dbGaPPhsID',
  'dbGaPStudyRegistrationName',
  'embargoReleaseDate',
  'sequencingCenter',
];

export default function NihAnvilUse(props) {
  const {
    onChange,
    initialFormData,
    validation,
    onValidationChange,
    updateParentRenderState,
  } = props;
  const [nihAnvilUse, setNihAnvilUse] = useState(initialFormData?.nihAnvilUse || null);

  const clearFormValues = () => {
    allNihAnvilUseFields.forEach((field) => onChange({key: field, value: undefined, isValid: true}));
  };

  return h(div, {
    className: 'data-submitter-section',
  }, [
    h2('NIH and AnVIL use'),
    h(FormField, {
      id: 'nihAnvilUse',
      title: 'Will you or did you submit data to the NIH?',
      type: FormFieldTypes.RADIOGROUP,
      options: [
        {text: YES_NHGRI_YES_PHS_ID, name: 'yes_nhgri_yes_phs_id'},
        {text: YES_NHGRI_NO_PHS_ID, name: 'yes_nhgri_no_phs_id'},
        {text: NO_NHGRI_YES_ANVIL, name: 'no_nhgri_yes_anvil'},
        {text: NO_NHGRI_NO_ANVIL, name: 'no_nhgri_no_anvil'},
      ],
      validators: [FormValidators.REQUIRED],
      onChange: (config) => {
        clearFormValues();
        const value = nihAnvilUseLabels[config.value];
        onChange({key: config.key, value: value, isValid: config.isValid});
        setNihAnvilUse(value);
        updateParentRenderState({key: config.key, value: [value]});
      },
      validation: validation.nihAnvilUse,
      onValidationChange,
    }),

    div({ isRendered: nihAnvilUse === YES_NHGRI_YES_PHS_ID }, [
      h(FormField, {
        id: 'dbGaPPhsID',
        title: 'dbGaP phs ID',
        placeholder: 'Firstname Lastname',
        validators: [FormValidators.REQUIRED],
        onChange,
        validation: validation.dbGaPPhsID,
        onValidationChange,
      }),
      h(FormField, {
        id: 'dbGaPStudyRegistrationName',
        title: 'dbGaP Study Registration Name',
        placeholder: 'Name',
        onChange,
        validation: validation.dbGaPStudyRegistrationName,
        onValidationChange,

      }),
      h(FormField, {
        id: 'embargoReleaseDate',
        title: 'Embargo Release Date',
        placeholder: 'YYYY-MM-DD',
        validators: [FormValidators.DATE],
        onChange,
        validation: validation.embargoReleaseDate,
        onValidationChange,
      }),
      h(FormField, {
        id: 'sequencingCenter',
        title: 'Sequencing Center',
        placeholder: 'Name',
        onChange,
        validation: validation.sequencingCenter,
        onValidationChange,
      }),
    ])
  ]);
}