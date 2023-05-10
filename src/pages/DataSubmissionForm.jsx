import React,  { useCallback } from 'react';
// import { validateForm } from '../utils/JsonSchemaUtils';

import { cloneDeep, isNil } from 'lodash/fp';
import { useState, useEffect } from 'react';
import { Institution, DataSet } from '../libs/ajax';
import { Notifications } from '../libs/utils';

import lockIcon from '../images/lock-icon.png';
import {Styles} from '../libs/theme';

import DataAccessGovernance from '../components/data_submission/DataAccessGovernance';
import DataSubmissionStudyInformation from '../components/data_submission/ds_study_information';
import NIHAdministrativeInformation from '../components/data_submission/NIHAdministrativeInformation';
import NIHDataManagement from '../components/data_submission/NIHDataManagement';
import NihAnvilUse from '../components/data_submission/NihAnvilUse';
// schema validation is auto-generated from pre-compiled code - if the backend
// schama changes, then run `npm run genschemas` to regenerate this code
// import validateSchema from '../assets/schemas/DataRegistrationV1Validation';
import { set } from 'lodash';

export const DataSubmissionForm = () => {

  const [institutions, setInstitutions] = useState([]);
  const [failedInit, setFailedInit] = useState(false);

  const [allConsentGroupsSaved, setAllConsentGroupsSaved] = useState(false);


  useEffect(() => {
    const getAllInstitutions = async() => {
      const institutions = await Institution.list();
      setInstitutions(institutions);
    };

    const init = async () => {
      try {
        getAllInstitutions();
      } catch (error) {
        setFailedInit(true);
        Notifications.showError({
          text: 'Error: Unable to initialize data from server',
        });
      }
    };

    init();
  }, []);

  const [formFiles, setFormFiles] = useState({});
  const [formData, setFormData] = useState({});

  const [formValidation, setFormValidation] = useState({});

  const formatForRegistration = (formData) => {
    for (const key of Object.keys(formData)) {
      if (isNil(formData[key])) {
        formData[key] = undefined;
      }
    }

    formData.consentGroups.forEach((cg) => {
      for (const key of Object.keys(cg)) {
        if (isNil(cg[key])) {
          cg[key] = undefined;
        }
      }
    });

  };

  // compute multipart/form-data object, includes registration information and all files
  const createMultiPartFormData = (registration) => {

    const multiPartFormData = new FormData();

    multiPartFormData.append('dataset', JSON.stringify(registration));

    for (const field of Object.keys(formFiles)) {
      if (!isNil(formFiles[field])) {
        multiPartFormData.append(field, formFiles[field]);
      }
    }

    return multiPartFormData;
  };

  const submit = async () => {
    if (!allConsentGroupsSaved) {
      Notifications.showError({ text: 'Please save all consent groups and try again.' });
      return;
    }

    const registration = cloneDeep(formData);
    formatForRegistration(registration);

    // check against json schema to see if there are uncaught validation issues
    let [valid, validation] = [true, true];
    // validateForm(validateSchema, registration);
    // if (formData.alternativeDataSharingPlan === true) {
    //   if (isNil(formFiles.alternativeDataSharingPlanFile)) {
    //     validation.alternativeDataSharingPlanFile = {
    //       valid: false,
    //       failed: ['required']
    //     };
    //     valid = false;
    //   }
    // }

    setFormValidation(validation);

    if (!valid) {
      Notifications.showError({ text: 'There are errors in your form. Please fix and try again.' });
      return;
    }

    // no validation issues, matches json schema: continue to submission
    const multiPartFormData = createMultiPartFormData(registration);

    DataSet.registerDataset(multiPartFormData).catch((e) => {
      Notifications.showError({ text: 'Could not submit: ' + e?.response?.data?.message || e.message });
    });
  };

  const onChange = useCallback(({ key, value }) => {
    setFormData((val) => {
      const newForm = cloneDeep(val);
      set(newForm, key, value);
      return newForm;
    });
  }, [setFormData]);

  const onFileChange = useCallback(({ key, value }) => {
    setFormFiles((val) => {
      const newFiles = cloneDeep(val);
      set(newFiles, key, value);
      return newFiles;
    });
  }, [setFormFiles]);

  const onValidationChange = ({ key, validation }) => {
    setFormValidation((val) => {
      const newValidation = cloneDeep(val);
      set(newValidation, key, validation);
      return newValidation;
    });
  };


  return !failedInit && <div style={Styles.PAGE} >
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
      <div className='left-header-section' style={Styles.LEFT_HEADER_SECTION} >
        <div style={Styles.ICON_CONTAINER}>
          <img id='lock-icon' src={lockIcon} style={Styles.HEADER_IMG} />
        </div>
        <div style={Styles.HEADER_CONTAINER}>
          <h1>Register a Dataset</h1>
          <div style={{fontSize: '1.6rem'}}>
            Submit a new dataset to DUOS
          </div>
        </div>
      </div>
    </div>

    <form style={{ margin: 'auto', maxWidth: 800}}>


      <DataSubmissionStudyInformation onChange={onChange} validation={formValidation} onValidationChange={onValidationChange} />
      <NihAnvilUse onChange={onChange} formData={formData} validation={formValidation} onValidationChange={onValidationChange} />
      <NIHAdministrativeInformation formData={formData} onChange={onChange} institutions={institutions} validation={formValidation} onValidationChange={onValidationChange} />
      <NIHDataManagement formData={formData} onChange={onChange} onFileChange={onFileChange} validation={formValidation} onValidationChange={onValidationChange} />
      <DataAccessGovernance onChange={onChange} onFileChange={onFileChange} validation={formValidation} onValidationChange={onValidationChange} setAllConsentGroupsSaved={setAllConsentGroupsSaved} />

      <div className='flex flex-row' style={{justifyContent: 'flex-end', marginBottom: '2rem'}}>
        <a className='button button-white' onClick={submit}>Submit</a>
      </div>
    </form>
  </div>;
};

export default DataSubmissionForm;