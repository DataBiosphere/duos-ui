import React from 'react';
import Ajv2020 from "ajv/dist/2020"
import { addFormats, validate } from '../utils/JsonSchemaUtils';

import { cloneDeep, isNil } from 'lodash/fp';
import { useState, useEffect } from 'react';
import { Institution, DataSet, Schema } from '../libs/ajax';
import { Notifications } from '../libs/utils';

import lockIcon from '../images/lock-icon.png';
import {Styles} from '../libs/theme';

import DataAccessGovernance from '../components/data_submission/DataAccessGovernance';
import DataSubmissionStudyInformation from '../components/data_submission/ds_study_information';
import NIHAdministrativeInformation from '../components/data_submission/NIHAdministrativeInformation';
import NIHDataManagement from '../components/data_submission/NIHDataManagement';
import NihAnvilUse from '../components/data_submission/NihAnvilUse';
import { set } from 'lodash';


export const DataSubmissionForm = () => {

  const [institutions, setInstitutions] = useState([]);
  const [failedInit, setFailedInit] = useState(false);
  const [schema, setSchema] = useState();
  const [validateSchema, setValidateSchema] = useState();

  useEffect(() => {
    const getAllInstitutions = async() => {
      const institutions = await Institution.list();
      setInstitutions(institutions);
    };
    const getSchema = async () => {
      const schema = await Schema.datasetRegistrationV1();
      setSchema(schema);
      console.log(schema);
    }

    const init = async () => {
      try {
        getAllInstitutions();
        getSchema();
      } catch (error) {
        setFailedInit(true);
        Notifications.showError({
          text: 'Error: Unable to initialize data from server',
        });
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!isNil(schema)) {
      const validator = addFormats(new Ajv2020({strict: false, allErrors: true})).compile(schema);
      console.log(validator)
      setValidateSchema((_) => validator);
    } else {
      setValidateSchema();
    }
  }, [schema]);

  const formFiles = {};
  const formData = { publicVisibility: true };

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
  const getMultiPartFormData = () => {
    const registration = cloneDeep(formData);
    formatForRegistration(registration);

    console.log(validateSchema);
    const [valid, validation] = validate(validateSchema, registration);
    
    setFormValidation(validation);
    console.log();
    console.log(validateSchema.errors);

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
    const multiPartFormData = getMultiPartFormData();

    DataSet.registerDataset(multiPartFormData).catch((e) => {
      Notifications.showError({ text: 'Could not submit: ' + e?.response?.data?.message || e.message });
    });
  };

  const onChange = ({ key, value, isValid }) => {
    /* eslint-disable no-console */
    console.log('StudyInfo OnChange:', key, value, isValid);

    formData[key] = value;
  };

  const onFileChange = ({ key, value, isValid }) => {
    /* eslint-disable no-console */
    console.log('File OnChange:', key, value, isValid);

    formFiles[key] = value;
  };

  const onValidationChange = ({ key, validation }) => {
    console.log('Validation OnChange:', key, validation);

    setFormValidation((val) => {
      const newValidation = cloneDeep(val);
      set(newValidation, key, validation);
      return newValidation;
    });
  }


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
      <NihAnvilUse onChange={onChange} initialFormData={formData} />
      <NIHAdministrativeInformation initialFormData={formData} onChange={onChange} institutions={institutions} />
      <NIHDataManagement initialFormData={formData} onChange={onChange} onFileChange={onFileChange} />
      <DataAccessGovernance onChange={onChange} onFileChange={onFileChange} />

      <div className='flex flex-row' style={{justifyContent: 'flex-end', marginBottom: '2rem'}}>
        <a className='button button-white' onClick={submit}>Submit</a>
      </div>
    </form>
  </div>;
};

export default DataSubmissionForm;