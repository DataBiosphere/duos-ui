import { useState, useEffect } from 'react';
import { h, h2, div, span } from 'react-hyperscript-helpers';
import { isEmpty } from 'lodash/fp';

import { Notifications } from '../../libs/utils';
import { User } from '../../libs/ajax';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';

import './ds_common.css';

export default function DataSubmissionStudyInformation(props) {
  const { onChange, validation, onValidationChange } = props;
  const [user, setUser] = useState();

  //init hook, need to make ajax calls here
  useEffect(() => {
    const updateUserAndFields = async () => {
      const me = await User.getMe();
      setUser(me);
      onChange({key: 'dataSubmitterUserId', value: me.userId, isValid: true});
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
      validation: validation.studyName,
      onChange,
      onValidationChange
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
      validation: validation.studyType,
      selectConfig: {},
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'studyDescription',
      title: 'Study Description',
      placeholder: 'Description',
      validation: validation.studyDescription,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'dataTypes',
      title: 'Data Types',
      placeholder: 'Type',
      type: FormFieldTypes.MULTITEXT,
      validation: validation.dataTypes,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'phenotypeIndication',
      title: 'Phenotype/Indication Studied',
      validation: validation.phenotypeIndication,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'species',
      title: 'Species',
      validation: validation.species,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'piName',
      title: 'Principal Investigator Name',
      validation: validation.piName,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      isRendered: !isEmpty(user),
      id: 'dataSubmitterName',
      title: 'Data Submitter Name',
      defaultValue: user?.displayName,
      validation: validation.dataSubmitterName,
      disabled: true,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      isRendered: !isEmpty(user),
      id: 'dataSubmitterEmail',
      title: 'Data Submitter Email',
      defaultValue: user?.email,
      validation: validation.dataSubmitterEmail,
      disabled: true,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'dataCustodianEmail',
      title: 'Data Custodian Email',
      type: FormFieldTypes.MULTITEXT,
      validators: [
        FormValidators.EMAIL
      ],
      validation: validation.dataCustodianEmail,
      onChange,
      onValidationChange
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
      onChange,
      validation: validation.publicVisibility,
      onValidationChange
    })
  ]);
}
