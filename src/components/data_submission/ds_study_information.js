import { useState, useEffect } from 'react';
import { h, h2, div } from 'react-hyperscript-helpers';
import { Notifications, isEmailAddress } from '../../libs/utils';
import { User } from '../../libs/ajax';
import { FormFieldTypes, FormField, FormTable } from '../forms/forms';

const updateUserAndFields = async ({ setUser, onChange }) => {
  const me = await User.getMe();
  setUser(me);
  onChange({key: 'dataSubmitterId', value: me.dacUserId});
};

export default function DataSubmissionStudyInformation(props) {
  const { onChange } = props;
  const [user, setUser] = useState(null);

  //init hook, need to make ajax calls here
  useEffect(() => {
    const init = async () => {
      try {
        updateUserAndFields({ setUser, ...props });
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve user data from server'});
      }
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // need the eslint to force useEffect to only run on initialization

  return h(div, {
    style: {
      padding: '50px 0',
      maxWidth: 800,
      margin: 'auto'
    }
  }, [
    h2('Study Information'),
    FormField({
      id: 'studyName',
      title: 'Study Name',
      required: true,
      onChange
    }),
    FormField({
      id: 'studyType',
      title: 'Study Type',
      type: FormFieldTypes.SELECT,
      selectOptions: [
        'Observational', 'Interventional', 'Descriptive',
        'Analytical', 'Prospective', 'Retrospective',
        'Case report', 'Case series', 'Cross-sectional',
        'Cohort study'
      ],
      onChange
    }),
    FormField({
      id: 'studyDescription',
      title: 'Study Description',
      placeholder: 'Description',
      onChange
    }),
    FormField({
      id: 'dataTypes',
      title: 'Data Types',
      placeholder: 'Type',
      defaultValue: [],
      type: FormFieldTypes.MULTITEXT,
      onChange
    }),
    FormTable({
      id: 'fileTypes',
      formFields: [
        {
          id: 'fileType',
          title: 'File Type',
          type: FormFieldTypes.SELECT,
          selectOptions: ['Arrays', 'Genome', 'Exome', 'Survey', 'Phenotype']
        }, {
          id: 'functionalEquivalence',
          title: 'Functional Equivalence',
          placeholder: 'Type'
        }, {
          id: 'numberOfParticipants',
          title: '# of Participants',
          placeholder: 'Number',
          type: FormFieldTypes.NUMBER
        }
      ],
      defaultValue: [{}],
      onChange
    }),
    FormField({
      id: 'phenotypeIndication',
      title: 'Phenotype/Indication Studied',
      onChange
    }),
    FormField({
      id: 'species',
      title: 'Species',
      onChange
    }),
    FormField({
      id: 'piName',
      title: 'Principal Investigator Name',
      onChange
    }),
    FormField({
      id: 'dataSubmitterName',
      title: 'Data Submitter Name',
      defaultValue: user?.displayName,
      disabled: true,
      onChange
    }),
    FormField({
      id: 'dataSubmitterEmail',
      title: 'Data Submitter Email',
      defaultValue: user?.email,
      disabled: true,
      onChange
    }),
    FormField({
      id: 'dataCustodianEmail',
      title: 'Data Custodian Email',
      type: FormFieldTypes.MULTITEXT,
      defaultValue: [],
      isValid: isEmailAddress,
      onChange
    }),
    FormField({
      id: 'publicVisibility',
      title: 'Public Visibility',
      required: true,
      type: FormFieldTypes.SLIDER,
      defaultValue: true,
      description: `Please select if you would like your dataset
        to be publicly visible for the requesters to see and select
        for an access request`,
      toggleText: 'Visible',
      onChange
    })
  ]);
}
