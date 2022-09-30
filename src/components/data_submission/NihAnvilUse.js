import {div, h, h2} from 'react-hyperscript-helpers';
import {useState} from 'react';
import {FormField, FormFieldTypes, FormValidators} from '../forms/forms';

const I_DID = 'I Did';
const I_WILL = 'I Will';
const NO = 'No';

const nihAnvilUseLabels = {
  i_did: I_DID,
  i_will: I_WILL,
  no: NO
};

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
    className: 'data-submitter-section',
  }, [
    h2('NIH and AnVIL use'),
    h(FormField, {
      id: 'nihAnvilUse',
      title: 'Will you or did you submit data to the NIH?',
      type: FormFieldTypes.RADIOGROUP,
      options: [
        {text: I_DID, name: 'i_did'},
        {text: I_WILL, name: 'i_will'},
        {text: NO, name: 'no'},
      ],
      validators: [FormValidators.REQUIRED],
      onChange: (config) => {

        const value = nihAnvilUseLabels[config.value];
        onChange({key: config.key, value: value, isValid: config.isValid});

        // if going from did -> i will / no, then clear all values
        if (nihAnvilUse == I_DID && value != I_DID) {
          clearFormValues();
        }

        // if going from i will / no -> did, then clear all values
        if ((nihAnvilUse === I_WILL || nihAnvilUse === NO) && (value !== I_WILL && value !== NO)) {
          clearFormValues();
        }

        setNihAnvilUse(value);
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
        placeholder: 'YYYY-MM-DD',
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