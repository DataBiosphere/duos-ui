import {div, h, h2} from 'react-hyperscript-helpers';
import {useState} from 'react';
import {FormField, FormFieldTypes, FormValidators} from '../forms/forms';


export default function DataSubmissionNihAnvilUse(props) {
  const { onChange } = props;
  const [nihAnvilUse, setNihAnvilUse] = useState();

  const I_DID = 'I did';
  const I_WILL = 'I will';
  const NO = 'No';

  return h(div, {
    style: {
      padding: '50px 0',
      maxWidth: 800,
      margin: 'auto'
    }
  }, [
    h2('NIH and AnVIL use'),
    h(FormField, {
      id: 'nihAnvilUse',
      title: 'Will you or did you submit data to the NIH?',
      type: FormFieldTypes.RADIO,
      selectOptions: [
        {label: I_DID, value: I_DID},
        {label: I_WILL, value: I_WILL},
        {label: NO, value: NO},
      ],
      dependentFormFields: [
        {id: 'submittingToAnvil', type: FormFieldTypes.RADIO, shouldClear: ({value}) => value === I_DID},
        {id: 'dbGaPPhsID', type: FormFieldTypes.TEXT},
        {id: 'dbGaPStudyRegistrationName', type: FormFieldTypes.TEXT},
        {id: 'embargoReleaseDate', type: FormFieldTypes.TEXT},
        {id: 'sequencingCenter', type: FormFieldTypes.TEXT},
      ],
      validators: [FormValidators.REQUIRED],
      onChange,
      setFormValueParent: setNihAnvilUse
    }),

    h(FormField, {
      isRendered: nihAnvilUse === I_WILL || nihAnvilUse === NO,
      id: 'submittingToAnvil',
      title: 'Are you planning to submit to AnVIL?',
      type: FormFieldTypes.RADIO,
      selectOptions: [
        {label: 'Yes', value: true},
        {label: 'No', value: false},
      ],
      validators: [FormValidators.REQUIRED],
      onChange
    }),

    div({ isRendered: nihAnvilUse === I_DID }, [
      h(FormField, {
        id: 'dbGaPPhsID',
        title: 'dbGaP phs ID',
        placeholder: 'Firstname Lastname',
        validators: [FormValidators.REQUIRED],
        onChange
      }),
      h(FormField, {
        id: 'dbGaPStudyRegistrationName',
        title: 'dbGaP Study Registration Name',
        placeholder: 'Email',
        validators: [FormValidators.REQUIRED, FormValidators.EMAIL],
        onChange
      }),
      h(FormField, {
        id: 'embargoReleaseDate',
        title: 'Embargo Release Date',
        placeholder: 'Firstname Lastname',
        validators: [FormValidators.REQUIRED],
        onChange
      }),
      h(FormField, {
        id: 'sequencingCenter',
        title: 'Sequencing Center',
        placeholder: 'Email',
        validators: [FormValidators.REQUIRED, FormValidators.EMAIL],
        onChange
      }),
    ])
  ]);
}