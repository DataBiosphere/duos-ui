import React from 'react';
import { useCallback, useState, useEffect } from 'react';
import { Notifications } from '../libs/utils';
import lockIcon from '../images/lock-icon.png';
import { Styles } from '../libs/theme';
import { cloneDeep, isNil, isEmpty, toLower } from 'lodash/fp';

import DataSubmissionStudyInformation from '../components/data_submission/ds_study_information';
import NihAnvilUse from '../components/data_submission/NihAnvilUse';
import NIHAdministrativeInformation from '../components/data_submission/NIHAdministrativeInformation';
import NIHDataManagement from '../components/data_submission/NIHDataManagement';
import DataAccessGovernance from '../components/data_submission/DataAccessGovernance';
import { DataSet, User, Institution } from '../libs/ajax';
import {Storage} from '../libs/storage';
import { set } from 'lodash';


export const StudyUpdateForm = (props) => {
  const { history } = props;
  const { studyId } = props.match.params;

  const [formData, setFormData] = useState({properties:{}});
  const [study, setStudy] = useState({});
  const [user, setUser] = useState({});
  const [failedInit, setFailedInit] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [allConsentGroupsSaved, setAllConsentGroupsSaved] = useState(false);
  const [formFiles, setFormFiles] = useState({});
  const studyEditMode = true;

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

  const onFileChange = useCallback(({ key, value }) => {
    setFormFiles((val) => {
      const newFiles = cloneDeep(val);
      set(newFiles, key, value);
      return newFiles;
    });
  }, [setFormFiles]);

  const onChange = useCallback(({ key, value }) => {
    setFormData((val) => {
      const newForm = cloneDeep(val);
      set(newForm, key, value);
      return newForm;
    });
  }, [setFormData]);

  useEffect(() => {
    const init = async () => {
      try {
        const me = Storage.getCurrentUser();
        setUser(me);
        setStudy(await DataSet.getStudyById(studyId));
        setFailedInit(false);
      } catch (error) {
        Notifications.showError({ text: 'Failed to load study' });
      }
    };
    init();
  }, [studyId]);

  const radioSelectionToLabels = (selection) => {
    if (!isNil(selection)) {
      const lowerCaseSelection = toLower(selection);
      switch (lowerCaseSelection) {
        case 'i am nhgri funded and i have a dbgap phs id already':
          return 'yes_nhgri_yes_phs_id';
        case 'i am nhgri funded and i do not have a dbgap phs id already':
          return 'yes_nhgri_no_phs_id';
        case 'i am not nhgri funded but i am seeking to submit data to anvil':
          return 'no_nhgri_yes_anvil';
        case 'i am not nhgri funded and do not plan to store data in anvil':
          return 'no_nhgri_no_anvil';
        default:
          return undefined;
      }
    }
  };

  const toYYYYMMDD = (dateString) => {
    if(!isNil(dateString)){
      return new Date(dateString).toISOString().split('T')[0];
    }
  };

  const extractAllProperties = useCallback(() => {
    var properties = {};

    study.properties.forEach((property) => {
      properties[property.key] = property?.value;
    });

    // fix up some of the properties
    properties['nihAnvilUse'] = radioSelectionToLabels(properties['nihAnvilUse']);
    properties['alternativeDataSharingPlanTargetDeliveryDate'] = toYYYYMMDD(properties['alternativeDataSharingPlanTargetDeliveryDate']);
    properties['alternativeDataSharingPlanTargetPublicReleaseDate'] = toYYYYMMDD(properties['alternativeDataSharingPlanTargetPublicReleaseDate']);
    properties['embargoReleaseDate'] = toYYYYMMDD(properties['embargoReleaseDate']);

    return properties;
  }, [study]);

  const prefillFormData = useCallback(async (study) => {
    const userId = study.createUserId;
    const dataSubmitter = await User.getById(userId);

    setFormData({
      studyName: study.name,
      studyDescription: study.description,
      dataTypes: study.dataTypes,
      piName: study.piName,
      publicVisibility: study.publicVisibility,
      datasets: study.datasets,
      dataSubmitterName: dataSubmitter.displayName,
      dataSubmitterEmail: dataSubmitter.email,
      properties: extractAllProperties()
    });
  }, [extractAllProperties]);

  useEffect(() => {
    if (isNil(formData.studyName) && !isEmpty(study)) {
      prefillFormData(study);
    }
  }, [prefillFormData, study, formData]);

  const datasets = formData.datasets;

  const [formValidation, setFormValidation] = useState({});

  const formatForRegistration = (formData) => {

    for (const key of Object.keys(formData)) {
      if (isNil(formData[key])) {
        formData[key] = undefined;
      }
    }

    formData?.consentGroups?.forEach((cg) => {
      for (const key of Object.keys(cg)) {
        if (isNil(cg[key])) {
          cg[key] = undefined;
        }
      }
    });

  };

  // compute multipart/form-data object, includes registration information and all files
  const createMultiPartFormData = (update) => {

    const multiPartFormData = new FormData();

    multiPartFormData.append('dataset', JSON.stringify(update));

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

    const update = cloneDeep(formData);
    formatForRegistration(update);
    const multiPartFormData = createMultiPartFormData(update);

    DataSet.updateStudy(studyId, multiPartFormData).then(() => {
      history.push('/dataset_catalog');
      Notifications.showSuccess({ text: 'Submitted succesfully!' });
    }, (e) => {
      Notifications.showError({ text: 'Could not submit: ' + e?.response?.data?.message || e.message });
    });
  };

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
          <div style={Styles.TITLE}>
            Study Update Form
            <div style={Styles.MEDIUM_DESCRIPTION}>
              This is an easy way to update a study in DUOS!
            </div>
          </div>
        </div>
      </div>
    </div>

    <form style={{ margin: 'auto', maxWidth: 800 }}>
      <DataSubmissionStudyInformation onChange={onChange} user={user} formData={formData} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode}/>
      <NihAnvilUse onChange={onChange} formData={formData} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode}/>
      <NIHAdministrativeInformation institutions={institutions}  onChange={onChange} formData={formData} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode}/>
      <NIHDataManagement onChange={onChange} onFileChange={onFileChange} formData={formData} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode}/>
      <DataAccessGovernance onChange={onChange} onFileChange={onFileChange} setAllConsentGroupsSaved={setAllConsentGroupsSaved} datasets={datasets} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode}/>

      <div className='flex flex-row' style={{justifyContent: 'flex-end', marginBottom: '2rem'}}>
        <a className='button button-white' onClick={submit}>Submit</a>
      </div>
    </form>
  </div>;
};

export default StudyUpdateForm;