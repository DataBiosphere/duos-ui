import React from 'react';
import { useCallback, useState, useEffect } from 'react';
import { Notifications } from '../libs/utils';
import lockIcon from '../images/lock-icon.png';
import { Styles } from '../libs/theme';
import { find, cloneDeep, isNil, isEmpty, toLower } from 'lodash/fp';
import { validateForm } from '../utils/JsonSchemaUtils';
import validateSchema from '../assets/schemas/DataRegistrationV1Validation';

import StudyInformationUpdate from '../components/study_update/EditStudyInfo';
import NihAnvilUseUpdate from '../components/study_update/EditNihAnvilUse';
import NihAdministrationInfoUpdate from '../components/study_update/EditNihAdminInfo';
import NihDataManagementUpdate from '../components/study_update/EditNihDataManagement';
import DataAccessGovernanceUpdate from '../components/study_update/EditDataAccessGovernance';
import { DataSet, User, Institution } from '../libs/ajax';
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
        const me = await User.getMe();
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

  const extract = useCallback((key) => {
    const property = find({ key })(study.properties);
    return property?.value;
  }, [study]);

  const prefillFormData = useCallback(async (study) => {
    setFormData({
      name: study.name,
      description: study.description,
      dataTypes: study.dataTypes,
      piName: study.piName,
      publicVisibility: study.publicVisibility,
      datasets: study.datasets,
      properties: {
        // study info
        studyType: extract('studyType'),
        phenotypeIndication: extract('phenotypeIndication'),
        species: extract('species'),
        dataSubmitterName: extract('dataSubmitterName'),
        dataSubmitterEmail: extract('dataSubmitterEmail'),
        dataCustodianEmail: extract('dataCustodianEmail'),

        // nih anvil use
        nihAnvilUse: radioSelectionToLabels(extract('nihAnvilUse')),
        dbGaPPhsID: extract('dbGaPPhsID'),
        dbGaPStudyRegistrationName: extract('dbGaPStudyRegistrationName'),
        embargoReleaseDate: extract('embargoReleaseDate'),
        sequencingCenter: extract('sequencingCenter'),

        // nih admin info
        piInstitution: extract('piInstitution'),
        nihGrantContractNumber: extract('nihGrantContractNumber'),
        nihICsSupportingStudy: extract('nihICsSupportingStudy'),
        nihProgramOfficerName: extract('nihProgramOfficerName'),
        nihInstitutionCenterSubmission: extract('nihInstitutionCenterSubmission'),
        nihGenomicProgramAdministratorName: extract('nihGenomicProgramAdministratorName'),
        multiCenterStudy: extract('multiCenterStudy'),
        collaboratingSites: extract('collaboratingSites'),
        controlledAccessRequiredForGenomicSummaryResultsGSR: extract('controlledAccessRequiredForGenomicSummaryResultsGSR'),
        controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation: extract('controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation'),

        // nih data management
        alternativeDataSharingPlan: extract('alternativeDataSharingPlan'),
        alternativeDataSharingPlanReasons: extract('alternativeDataSharingPlanReasons'),
        alternativeDataSharingPlanExplanation: extract('alternativeDataSharingPlanExplanation'),
        alternativeDataSharingPlanFile: extract('alternativeDataSharingPlanFile'),
        alternativeDataSharingPlanDataSubmitted: extract('alternativeDataSharingPlanDataSubmitted'),
        alternativeDataSharingPlanDataReleased: extract('alternativeDataSharingPlanDataReleased'),
      },
    });
  }, [extract]);

  useEffect(() => {
    if (isNil(formData.name) && !isEmpty(study)) {
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
    let [valid, validation] = validateForm(validateSchema, registration);
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
      <StudyInformationUpdate user={user} formData={formData} validation={formValidation} onValidationChange={onValidationChange}/>
      <NihAnvilUseUpdate onChange={onChange} formData={formData} validation={formValidation} onValidationChange={onValidationChange}/>
      <NihAdministrationInfoUpdate institutions={institutions}  onChange={onChange} formData={formData} validation={formValidation} onValidationChange={onValidationChange}/>
      <NihDataManagementUpdate onChange={onChange} onFileChange={onFileChange} formData={formData} validation={formValidation} onValidationChange={onValidationChange}/>
      <DataAccessGovernanceUpdate onChange={onChange} onFileChange={onFileChange} setAllConsentGroupsSaved={setAllConsentGroupsSaved} datasets={datasets} validation={formValidation} onValidationChange={onValidationChange}/>

      <div className='flex flex-row' style={{justifyContent: 'flex-end', marginBottom: '2rem'}}>
        <a className='button button-white' onClick={submit}>Submit</a>
      </div>
    </form>
  </div>;
};

export default StudyUpdateForm;