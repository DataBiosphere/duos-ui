import { useCallback, useEffect, useState } from 'react';
import { h, h2, div } from 'react-hyperscript-helpers';
import { find, isNil } from 'lodash/fp';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';

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

export default function NihAnvilUseUpdate(props) {
  const { study, onChange, formData } = props;
  const [setFormData] = useState({});

  // const extract = useCallback((key) => {
  //   const property = find({ key })(study.properties);
  //   return property?.value;
  // }, [study]);

  // const prefillFormData = useCallback(async (study) => {
  //   setFormData({
  //     name: study.name,
  //     properties: {
  //       nihAnvilUse: extract('nihAnvilUse'),
  //       dbGaPPhsID: extract('dbGaPPhsID'),
  //       dbGaPStudyRegistrationName: extract('dbGaPStudyRegistrationName'),
  //       embargoReleaseDate: extract('embargoReleaseDate'),
  //       sequencingCenter: extract('sequencingCenter')
  //     },
  //   });
  // }, [extract]);

  // useEffect(() => {
  //   if (isNil(formData.name)) {
  //     prefillFormData(study);
  //   }
  // }, [prefillFormData, study, formData]);

  return h(div, {
    className: 'study-update-section',
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
      defaultValue: formData?.nihAnvilUse,
      validators: [FormValidators.REQUIRED],
      onChange: (config) => {
        const value = nihAnvilUseLabels[config.value];
        onChange({key: config.key, value: value, isValid: config.isValid});
      },
    }),
    div({ isRendered: formData.nihAnvilUse === YES_NHGRI_YES_PHS_ID}, [
      h(FormField, {
        id: 'dbGaPPhsID',
        title: 'dbGaP phs ID',
        placeholder: 'Firstname Lastname',
        validators: [FormValidators.REQUIRED],
        defaultValue: formData?.dbGaPPhsID,
        onChange,
      }),
      h(FormField, {
        id: 'dbGaPStudyRegistrationName',
        title: 'dbGaP Study Registration Name',
        placeholder: 'Name',
        defaultValue: formData?.dbGaPStudyRegistrationName,
        onChange,
      }),
      h(FormField, {
        id: 'embargoReleaseDate',
        title: 'Embargo Release Date',
        placeholder: 'YYYY-MM-DD',
        validators: [FormValidators.DATE],
        defaultValue: formData?.embargoReleaseDate,
        onChange,
      }),
      h(FormField, {
        id: 'sequencingCenter',
        title: 'Sequencing Center',
        placeholder: 'Name',
        defaultValue: formData?.sequencingCenter,
        onChange,
     }),
    ])
  ]);
}