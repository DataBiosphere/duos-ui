import {div, h, h2} from 'react-hyperscript-helpers';
import {useState} from 'react';
import {FormField, FormFieldTypes, FormValidators} from '../forms/forms';

const I_DID = 'I did';
const I_WILL = 'I will';
const NO = 'No';

const allNihAnvilUseFields = [
  'submittingToAnvil',
  'dbGaPPhsID',
  'dbGaPStudyRegistrationName',
  'embargoReleaseDate',
  'sequencingCenter',
];

export default function NihAnvilUse(props) {
  const {
    onChange,
    initialFormData,
  } = props;
  const [nihAnvilUse, setNihAnvilUse] = useState(initialFormData?.nihAnvilUse || null);

  const clearFormValues = () => {
    allNihAnvilUseFields.forEach((field) => onChange({key: field, value: undefined, isValid: true}));
  };

  return h(div, {
  }, [
    h2('NIH and AnVIL use'),
    h(FormField, {
      id: 'nihAnvilUse',
      title: 'Will you or did you submit data to the NIH?',
      type: FormFieldTypes.RADIOGROUP,
      options: [
        {text: I_DID, name: I_DID},
        {text: I_WILL, name: I_WILL},
        {text: NO, name: NO},
      ],
      validators: [FormValidators.REQUIRED],
      onChange: (config) => {
        onChange(config);

        // if going from did -> i will / no, then clear all values
        if (nihAnvilUse == I_DID && config.value != I_DID) {
          clearFormValues();
        }

        // if going from i will / no -> did, then clear all values
        if ((nihAnvilUse === I_WILL || nihAnvilUse === NO) && (config.value !== I_WILL && config.value !== NO)) {
          clearFormValues();
        }

        setNihAnvilUse(config.value);
      },
    }),

    h(FormField, {
      isRendered: nihAnvilUse === I_WILL || nihAnvilUse === NO,
      id: 'submittingToAnvil',
      title: 'Are you planning to submit to AnVIL?',
      type: FormFieldTypes.RADIOGROUP,
      options: [
        {text: 'Yes', name: 'yes'},
        {text: 'No', name: 'no'},
      ],
      validators: [FormValidators.REQUIRED],
      onChange: ({key, value}) => {
        onChange({key, value: value === 'yes'});
      },
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
        placeholder: '...',
        validators: [FormValidators.REQUIRED, FormValidators.DATE],
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