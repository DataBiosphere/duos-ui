import { useState, useEffect } from 'react';
import { h, h2, div, span } from 'react-hyperscript-helpers';
import { isEmpty } from 'lodash/fp';

import { Notifications, isEmailAddress } from '../../libs/utils';
import { User } from '../../libs/ajax';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';

import './ds_common.css';

export default function DataSubmissionStudyInformation(props) {
  const { onChange } = props;
  const [user, setUser] = useState();

  //init hook, need to make ajax calls here
  useEffect(() => {
    const updateUserAndFields = async () => {
      const me = await User.getMe();
      setUser(me);
      onChange({key: 'dataSubmitterId', value: me.dacUserId, isValid: true});
    };

    const init = async () => {
      try {
        updateUserAndFields();
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve user data from server'});
      }
    };

    init();
  }, [onChange]);

  return h(div, {
    className: 'data-submitter-section',
  }, [
    h2('Study Information'),
    h(FormField, {
      id: 'studyName',
      title: 'Study Name',
      validators: [FormValidators.REQUIRED],
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
      isCreatable: true,
      selectConfig: {},
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
    h(FormField, {
      isRendered: !isEmpty(user),
      id: 'dataSubmitterName',
      title: 'Data Submitter Name',
      defaultValue: user?.displayName,
      disabled: true,
      onChange
    }),
    h(FormField, {
      isRendered: !isEmpty(user),
      id: 'dataSubmitterEmail',
      title: 'Data Submitter Email',
      defaultValue: user?.email,
      disabled: true,
      onChange
    }),
    h(FormField, {
      id: 'dataCustodianEmail',
      title: 'Data Custodian Email',
      type: FormFieldTypes.MULTITEXT,
      defaultValue: [],
      validators: [
        { isValid: isEmailAddress, msg: 'Enter a valid email address (example@site.com)' }
      ],
      onChange
    }),
    h(FormField, {
      id: 'publicVisibility',
      title: 'Public Visibility',
      validators: [FormValidators.REQUIRED],
      type: FormFieldTypes.SLIDER,
      defaultValue: true,
      description: `Please select if you would like your dataset
        to be publicly visible for the requesters to see and select
        for an access request`,
      toggleText: span({ style: {
        fontWeight: 'normal',
        fontStyle: 'italic'
      }}, ['Visible']),
      onChange
    })
  ]);
}
