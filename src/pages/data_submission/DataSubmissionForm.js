import React, {useCallback, useEffect, useState} from 'react';
import {validateForm} from './RegistrationValidation';
import {cloneDeep, isNil} from 'lodash/fp';
import {DataSet, Institution, Study} from '../../libs/ajax';
import {Notifications} from '../../libs/utils';
import lockIcon from '../../images/lock-icon.png';
import {Styles} from '../../libs/theme';
import DataAccessGovernance from './DataAccessGovernance';
import DataSubmissionStudyInformation from './ds_study_information';
import NIHAdministrativeInformation from './NIHAdministrativeInformation';
import NIHDataManagement from './NIHDataManagement';
import NihAnvilUse from './NihAnvilUse';
import {uniqueValidator} from '../../components/forms/formValidation';
import {set} from 'lodash';
import UsgOmbText from '../../components/UsgOmbText';

export const DataSubmissionForm = (props) => {
  const {
    history
  } = props;

  const [registrationSchema, setRegistrationSchema] = useState({});
  const [institutions, setInstitutions] = useState([]);
  const [studyNames, setStudyNames] = useState([]);
  const [failedInit, setFailedInit] = useState(false);

  const [allConsentGroupsSaved, setAllConsentGroupsSaved] = useState(false);
  const studyEditMode = false;

  useEffect(() => {

    const getRegistrationSchema = async() => {
      const schema = await DataSet.getRegistrationSchema();
      setRegistrationSchema(schema);
    };

    const getAllInstitutions = async() => {
      const institutions = await Institution.list();
      setInstitutions(institutions);
    };

    const getAllStudies = async() => {
      const studyNames = await Study.getStudyNames();
      setStudyNames(studyNames);
    };

    const init = async () => {
      try {
        await getRegistrationSchema();
        await getAllInstitutions();
        await getAllStudies();
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

    // check against json schema validator to see if there are uncaught validation issues
    let [valid, validation] = validateForm(registrationSchema, registration);

    // check secondary validation for non-schema validation issues
    if (!uniqueValidator.isValid(registration.studyName, studyNames)) {
      validation.studyName = {
        failed: ['unique'],
        valid: false
      };
      valid = false;
    }

    if (formData.alternativeDataSharingPlan === true) {
      if (isNil(formFiles.alternativeDataSharingPlanFile)) {
        validation.alternativeDataSharingPlanFile = {
          valid: false,
          failed: ['required']
        };
        valid = false;
      }
    }

    setFormValidation(validation);

    if (!valid) {
      Notifications.showError({ text: 'There are errors in your form. Please fix and try again.' });
      return;
    }

    // no validation issues, matches json schema: continue to submission
    const multiPartFormData = createMultiPartFormData(registration);

    DataSet.registerDataset(multiPartFormData).then(() => {
      history.push('/dataset_catalog');
      Notifications.showSuccess({ text: 'Submitted succesfully!' });
    }, (e) => {
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


  return <div>
    {!failedInit && <div style={Styles.PAGE} >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
        <div className='left-header-section' style={Styles.LEFT_HEADER_SECTION} >
          <div style={Styles.ICON_CONTAINER}>
            <img id='lock-icon' src={lockIcon} style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER}>
            <div style={Styles.TITLE}>
              Study Registration Form
              <div style={Styles.MEDIUM_DESCRIPTION}>
                Submit new datasets to DUOS
              </div>
            </div>
          </div>
        </div>
      </div>

      <form style={{ margin: 'auto', maxWidth: 800}}>


        <DataSubmissionStudyInformation onChange={onChange} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode}/>
        <NihAnvilUse onChange={onChange} formData={formData} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode}/>
        <NIHAdministrativeInformation formData={formData} onChange={onChange} institutions={institutions} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode}/>
        <NIHDataManagement formData={formData} onChange={onChange} onFileChange={onFileChange} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode}/>
        <DataAccessGovernance onChange={onChange} onFileChange={onFileChange} validation={formValidation} onValidationChange={onValidationChange} setAllConsentGroupsSaved={setAllConsentGroupsSaved} studyEditMode={studyEditMode}/>

        <div className='flex flex-row' style={{justifyContent: 'flex-end', marginBottom: '2rem'}}>
          <a className='button button-white' onClick={submit}>Submit</a>
        </div>
      </form>
    </div>}
    <UsgOmbText />
  </div>;
};

export default DataSubmissionForm;