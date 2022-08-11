import { useState, useEffect } from 'react';
import { h, h2, div } from 'react-hyperscript-helpers';
import { Notifications, isEmailAddress } from '../../libs/utils';
import { User } from '../../libs/ajax';

import { styles, formField } from './ds_common';

const updateUserAndFields = async ({ setUser, onChange }) => {
  const me = await User.getMe();
  setUser(me);
  onChange({key: 'dataSubmitterId', value: me.dacUserId});
};

export default function DataSubmissionStudyInformation(props) {
  const { onChange } = props;
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);
  const [formInfo, setFormInfo] = useState(props.studyInfo || {});

  //init hook, need to make ajax calls here
  useEffect(() => {
    const init = async () => {
      try {
        updateUserAndFields({ setUser, onChange });
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve user data from server'});
      }
    };

    init();
  }, [onChange]);

  return h(div, {
    style: {
      padding: '50px 0',
      maxWidth: 800,
      margin: 'auto'
    }
  }, [
    h2('Study Information'),
    formField({
      id: 'studyName',
      title: 'Study Name',
      required: true,
      onChange, errors, setErrors, formInfo, setFormInfo
    }),
    formField({
      id: 'studyType',
      title: 'Study Type',
      type: 'select',
      selectOptions: [
        'Observational', 'Interventional', 'Descriptive',
        'Analytical', 'Prospective', 'Retrospective',
        'Case report', 'Case series', 'Cross-sectional',
        'Cohort study'
      ],
      onChange, errors, setErrors, formInfo, setFormInfo
    }),
    formField({
      id: 'studyDescription',
      title: 'Study Description',
      placeholder: 'Description',
      onChange, errors, setErrors, formInfo, setFormInfo
    }),
    formField({
      id: 'dataTypes',
      title: 'Data Types',
      placeholder: 'Type',
      type: 'multitext',
      onChange, errors, setErrors, formInfo, setFormInfo
    }),
    div({ style: styles.flexRow, id: 'fileTypes' }, [
      formField({
        id: 'fileType',
        title: 'File Type',
        type: 'select',
        selectOptions: ['Arrays', 'Genome', 'Exome', 'Survey', 'Phenotype'],
        style: { width: '100%', marginRight: 20 },
        onChange, errors, setErrors, formInfo, setFormInfo
      }),
      formField({
        id: 'functionalEquivalence',
        title: 'Functional Equivalence',
        placeholder: 'Type',
        style: { width: '100%', marginRight: 20 },
        onChange, errors, setErrors, formInfo, setFormInfo
      }),
      formField({
        id: 'numberOfParticipants',
        title: '# of Participants',
        placeholder: 'number',
        style: { width: '100%' },
        onChange, errors, setErrors, formInfo, setFormInfo
      })
    ]),
    formField({
      id: 'phenotypeIndication',
      title: 'Phenotype/Indication Studied',
      onChange, errors, setErrors, formInfo, setFormInfo
    }),
    formField({
      id: 'species',
      title: 'Species',
      onChange, errors, setErrors, formInfo, setFormInfo
    }),
    formField({
      id: 'piName',
      title: 'Principal Investigator Name',
      onChange, errors, setErrors, formInfo, setFormInfo
    }),
    formField({
      id: 'dataSubmitterName',
      title: 'Data Submitter Name',
      defaultValue: user?.displayName,
      disabled: true,
      onChange, errors, setErrors, formInfo, setFormInfo
    }),
    formField({
      id: 'dataSubmitterEmail',
      title: 'Data Submitter Email',
      defaultValue: user?.email,
      disabled: true,
      onChange, errors, setErrors, formInfo, setFormInfo
    }),
    formField({
      id: 'dataCustodianEmail',
      title: 'Data Custodian Email',
      type: 'multitext',
      isValid: isEmailAddress,
      onChange, errors, setErrors, formInfo, setFormInfo
    }),
    formField({
      id: 'publicVisibility',
      title: 'Public Visibility',
      required: true,
      type: 'slider',
      defaultValue: true,
      description: `Please select if you would like your dataset
        to be publicly visible for the requesters to see and select
        for an access request`,
      toggleText: 'Visible',
      onChange, errors, setErrors, formInfo, setFormInfo
    })
  ]);
}