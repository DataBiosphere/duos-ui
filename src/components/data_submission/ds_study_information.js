import { useState, useEffect } from 'react';
import { h, h2, div } from 'react-hyperscript-helpers';
import { Notifications, isEmailAddress } from '../../libs/utils';
import { User } from '../../libs/ajax';
import { FormFieldTypes, FormField, FormTable } from '../forms/forms';

export default function DataSubmissionStudyInformation(props) {
  const { onChange } = props;
  const [user, setUser] = useState();

  const updateUserAndFields = async () => {
    const me = await User.getMe();
    setUser(me);
    onChange({key: 'dataSubmitterId', value: me.dacUserId});
  };

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
    h(FormField, {
      id: 'studyName',
      title: 'Study Name',
      required: true,
      onChange
    }),
    h(FormField, {
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
    h(FormField, {
      id: 'studyDescription',
      title: 'Study Description',
      placeholder: 'Description',
      onChange
    }),
    h(FormField, {
      id: 'dataTypes',
      title: 'Data Types',
      placeholder: 'Type',
      defaultValue: [],
      type: FormFieldTypes.MULTITEXT,
      onChange
    }),
    h(FormTable, {
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
    h(FormField, {
      id: 'phenotypeIndication',
      title: 'Phenotype/Indication Studied',
      onChange
    }),
    h(FormField, {
      id: 'species',
      title: 'Species',
      onChange
    }),
    h(FormField, {
      id: 'piName',
      title: 'Principal Investigator Name',
      onChange
    }),
    user && h(FormField, {
      id: 'dataSubmitterName',
      title: 'Data Submitter Name',
      defaultValue: user.displayName,
      disabled: true,
      onChange
    }),
    user && h(FormField, {
      id: 'dataSubmitterEmail',
      title: 'Data Submitter Email',
      defaultValue: user.email,
      disabled: true,
      onChange
    }),
    h(FormField, {
      id: 'dataCustodianEmail',
      title: 'Data Custodian Email',
      type: FormFieldTypes.MULTITEXT,
      defaultValue: [],
      validator: (value) => {
        return isEmailAddress(value)
          ? null
          : 'Enter a valid email address (example@site.com)';
      },
      onChange
    }),
    h(FormField, {
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
