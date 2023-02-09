import React from 'react';
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
import { isEmpty, set } from 'lodash';
import { Storage } from '../libs/storage';


export const DataSubmissionForm = () => {

  const [institutions, setInstitutions] = useState([]);
  const [failedInit, setFailedInit] = useState(false);
  const [user, setUser] = useState({});

  useEffect(() => {
    const getAllInstitutions = async() => {
      const institutions = await Institution.list();
      setInstitutions(institutions);
    };

    const init = async () => {
      try {
        getAllInstitutions();
        setUser(await Storage.getCurrentUser());
      } catch (error) {
        setFailedInit(true);
        Notifications.showError({
          text: 'Error: Unable to initialize data from server',
        });
      }
    };

    init();
  }, []);

  const formData = { publicVisibility: true };

  const addAdditionalFields = (formData) => {
    formData['dataSubmitterUserId'] = user.userId;

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

  // separate json object and files to send to consent
  const separateRegistrationAndFiles = (formData) => {
    const registration = cloneDeep(formData);
    addAdditionalFields(registration);
    const files = {};

    if (!isEmpty(registration.alternativeDataSharingPlanFile)) {
      files.alternativeDataSharingPlan = registration.alternativeDataSharingPlanFile;
      delete registration.alternativeDataSharingPlanFile;
    }

    const consentGroups = registration['consentGroups'];

    for (let i = 0; i < consentGroups?.length; i++) {
      if (!isEmpty(consentGroups[i].nihInstitutionalCertificationFile)) {
        files['consentGroups['+i+'].nihInstitutionalCertification'] = registration.nihInstitutionalCertificationFile;
        delete consentGroups[i].nihInstitutionalCertificationFile;
      }
    }

    return [registration, files];
  };

  // compute multipart/form-data object, includes registration information and all files
  const getMultiPartFormData = () => {
    const multiPartFormData = new FormData();
    const [registration, files] = separateRegistrationAndFiles(formData);

    multiPartFormData.append('dataset', JSON.stringify(registration));
    for (const field of Object.keys(files)) {
      multiPartFormData.append(field, files[field]);
    }

    return multiPartFormData;
  };

  const submit = async () => {
    const multiPartFormData = getMultiPartFormData();

    DataSet.registerDataset(multiPartFormData).catch((e) => {
      Notifications.showError({ text: 'Could not submit: ' + e?.response?.data?.message || e.message });
    });
  };

  const onChange = ({ key, value, isValid }) => {
    /* eslint-disable no-console */
    console.log('StudyInfo OnChange:', key, value, isValid);

    set(formData, key, value);
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


      <DataSubmissionStudyInformation onChange={onChange} />
      <NihAnvilUse onChange={onChange} initialFormData={formData} />
      <NIHAdministrativeInformation initialFormData={formData} onChange={onChange} institutions={institutions} />
      <NIHDataManagement initialFormData={formData} onChange={onChange} />
      <DataAccessGovernance onChange={onChange} />

      <div className='flex flex-row' style={{justifyContent: 'flex-end', marginBottom: '2rem'}}>
        <a className='button button-white' onClick={submit}>Submit</a>
      </div>
    </form>
  </div>;
};

export default DataSubmissionForm;