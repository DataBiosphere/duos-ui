import React from 'react';
import { set, cloneDeep } from 'lodash/fp';
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
import { isEmpty } from 'lodash';


export const DataSubmissionForm = () => {

  const [institutions, setInstitutions] = useState([]);
  const [failedInit, setFailedInit] = useState(false);

  useEffect(() => {

    const getAllInstitutions = async() => {
      const institutions = await Institution.list();
      const institutionNames = institutions.map((institution) => institution.name);
      setInstitutions(institutionNames);
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

  let formData = {};

  const separateDatasetAndFiles = (formData) => {
    const dataset = cloneDeep(formData);
    console.log(dataset)
    const files = {};


    if (!isEmpty(dataset.alternativeDataSharingPlanFile)) {
      files.alternativeDataSharingPlan = dataset.alternativeDataSharingPlanFile;
      delete dataset.alternativeDataSharingPlanFile;
    }
    
    const consentGroups = dataset['consentGroups'];

    for (let i = 0; i < consentGroups?.length; i++) {
      if (!isEmpty(consentGroups[i].nihInstitutionalCertificationFile)) {
        files['consentGroups['+i+'].nihInstitutionalCertification'] = dataset.nihInstitutionalCertificationFile;
        delete consentGroups[i].nihInstitutionalCertificationFile;
      }
    }

    return [dataset, files];
  }

  // return just the files from
  const getMultiPartFormData = () => {
    const multiPartFormData = new FormData();
    const [dataset, files] = separateDatasetAndFiles(formData);

    multiPartFormData.append('dataset', dataset);
    for (const field of Object.keys(files)) {
      multiPartFormData.append(field, files[field]);
    }
    
    return multiPartFormData;
  } 

  const submit = async () => {
    const multiPartFormData = getMultiPartFormData();
    await DataSet.registerDataset(multiPartFormData);
  };

  const onChange = ({ key, value, isValid }) => {
    /* eslint-disable no-console */
    console.log('StudyInfo OnChange:', key, value, isValid);
    formData = set(key, value, formData);
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