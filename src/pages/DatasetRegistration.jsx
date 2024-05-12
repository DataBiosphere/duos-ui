import React, {useState, useEffect, useCallback} from 'react';
import { RadioButton } from '../components/RadioButton';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { Alert } from '../components/Alert';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import { DataSet } from '../libs/ajax/DataSet';
import { DAC } from '../libs/ajax/DAC';
import { NotificationService } from '../libs/notificationService';
import { Storage } from '../libs/storage';
import * as fp from 'lodash/fp';
import AsyncSelect from 'react-select/async';
import DataProviderAgreement from '../assets/Data_Provider_Agreement.pdf';
import addDatasetIcon from '../images/icon_dataset_add.png';
import { searchOntologies } from '../libs/utils';
import { OntologyService } from '../libs/ontologyService';

const getInitialState = () => {
  return {
    dacList: [],
    selectedDac: {},
    allDatasets: '',
    allDatasetNames: [],
    updateDataset: {},
    disableOkBtn: false,
    showValidationMessages: false,
    showModal: false,
    showDialogSubmit: false,
    formData: {
      methods: false,
      genetic: false,
      publication: false,
      collaboration: false,
      ethics: false,
      geographic: false,
      moratorium: false,
      nonProfit: false,
      hmb: false,
      npoa: false,
      diseases: false,
      ontologies: [],
      other: false,
      primaryOtherText: '',
      secondaryOther: false,
      secondaryOtherText: '',
      generalUse: false
    },
    datasetData: {
      datasetName: '',
      researcher: '',
      collectionId: '',
      principalInvestigator: '',
      datasetRepoUrl: '',
      dataType: '',
      species: '',
      phenotype: '',
      nrParticipants: '',
      description: '',
      dac: '',
      consentId: '',
      isValidName: false
    },
    problemSavingRequest: false,
    problemLoadingUpdateDataset: false,
    submissionSuccess: false,
    errorMessage: ''
  };
};

const controlLabelStyle = {
  fontWeight: 500,
  marginTop: '1rem',
  marginBottom: '1rem'
};

const DatasetRegistration = (props) => {
  const [registrationState, setRegistrationState] = useState(getInitialState);

  const { datasetId } = props.match.params;
  const init = useCallback(async () => {
    let updateDataset = [];
    // update dataset case
    if (!fp.isNil(datasetId)) {
      const data = await DataSet.getDataSetsByDatasetId(datasetId);
      updateDataset = data;
      // redirect to blank form if dataset id is invalid or inaccessible
      if (fp.isEmpty(updateDataset) || fp.isNil(updateDataset.dataSetId)) {
        setRegistrationState(prevState => ({
          ...prevState,
          problemLoadingUpdateDataset: true
        }));
        props.history.push('/dataset_registration');
      } else {
        setRegistrationState(prevState => ({
          ...prevState,
          updateDataset
        }));
      }
    }
  }, [datasetId, props.history]);

  const validateDatasetName = useCallback(async (name) => {
    return DataSet.validateDatasetName(name).then(datasetId => {
      let isValid = true;
      //if this is not an update check to make sure this name is not already in use
      if (fp.isEmpty(registrationState.updateDataset)) {
        isValid = (datasetId < 0);
      }
      setRegistrationState(prevState => ({
        ...prevState,
        datasetData: {
          ...prevState.datasetData,
          isValidName: isValid
        }
      }));
    });
  },[registrationState.updateDataset]);


  const prefillDatasetFields = useCallback((dataset) => {
    let name = dataset.name;
    let collectionId = fp.find({ propertyName: 'Sample Collection ID' })(dataset.properties);
    let dataType = fp.find({ propertyName: 'Data Type' })(dataset.properties);
    let species = fp.find({ propertyName: 'Species' })(dataset.properties);
    let phenotype = fp.find({ propertyName: 'Phenotype/Indication' })(dataset.properties);
    let nrParticipants = fp.find({ propertyName: '# of participants' })(dataset.properties);
    let description = fp.find({ propertyName: 'Description' })(dataset.properties);
    let datasetRepoUrl = fp.find({ propertyName: 'url' })(dataset.properties);
    let researcher = fp.find({ propertyName: 'Data Depositor' })(dataset.properties);
    let pi = fp.find({ propertyName: 'Principal Investigator(PI)' })(dataset.properties);
    let dac = fp.find({ dacId: dataset.dacId })(registrationState.dacList);

    setRegistrationState(prevState => {
      let validName = validateDatasetName(registrationState.datasetData.datasetName);
      return {
        ...prevState,
        datasetData: {
          ...prevState.datasetData,
          datasetName: name ? name : '',
          collectionId: collectionId ? collectionId.propertyValue : '',
          dataType: dataType ? dataType.propertyValue : '',
          species: species ? species.propertyValue : '',
          phenotype: phenotype ? phenotype.propertyValue : '',
          nrParticipants: nrParticipants ? nrParticipants.propertyValue : '',
          description: description ? description.propertyValue : '',
          datasetRepoUrl: datasetRepoUrl ? datasetRepoUrl.propertyValue : '',
          researcher: researcher ? researcher.propertyValue : '',
          principalInvestigator: pi ? pi.propertyValue : '',
          dac: dac,
          isValidName: validName
        }
      };
    }
    );

    if (!fp.isEmpty(dataset.dataUse)) {
      prefillDataUseFields(dataset.dataUse);
    }
  },[validateDatasetName, registrationState.datasetData.datasetName]);

  useEffect(() => {
    const fetchData = async () => {
      await init();
      const notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
      const currentUser = await Storage.getCurrentUser();
      const allDatasets = await DataSet.getDatasets();
      const allDatasetNames = allDatasets.map(d => d.name);
      const dacs = await DAC.list();

      setRegistrationState(prevState => ({
        ...prevState,
        notificationData,
        datasetData: {
          ...prevState.datasetData,
          researcher: currentUser.displayName
        },
        allDatasets,
        allDatasetNames,
        dacList: dacs
      }));

      if (!fp.isEmpty(registrationState.updateDataset)) {
        prefillDatasetFields(registrationState.updateDataset);
        const ontologies = await getOntologies(registrationState.formData.diseases);
        const formattedOntologies = formatOntologyItems(ontologies);

        setRegistrationState(prevState => ({
          ...prevState,
          formData: {
            ...prevState.formData,
            ontologies: formattedOntologies,
            diseases: !fp.isEmpty(ontologies)
          }
        }));
      }
    };

    fetchData();
  }, [init, registrationState.formData.diseases, prefillDatasetFields, registrationState.updateDataset]);

  const getOntologies = async (urls = []) => {
    if (fp.isEmpty(urls)) {
      return [];
    } else {
      const doidArr = OntologyService.extractDOIDFromUrl(urls);
      const urlParams = doidArr.join(',');
      const ontologies = await OntologyService.searchOntology(urlParams);
      return ontologies;
    }
  };

  const prefillDataUseFields = (dataUse) => {
    let methods = dataUse.methodsResearch;
    let genetics = dataUse.geneticStudiesOnly;
    let publication = dataUse.publicationResults;
    let collaboration = dataUse.collaboratorRequired;
    let ethics = dataUse.ethicsApprovalRequired;
    let geographic = dataUse.geographicalRestrictions;
    let moratorium = dataUse.publicationMoratorium;
    let nonProfit = dataUse.nonProfitUse;
    let hmb = dataUse.hmbResearch;
    // if the dataset's POA value is set to false, we need to check the NPOA (or NOT POA) option
    // if the dataset's POA value is set to true, leave this unchecked
    let npoa = (dataUse.populationOriginsAncestry === false);
    let diseases = dataUse.diseaseRestrictions;
    let other = dataUse.otherRestrictions;
    let primaryOtherText = dataUse.other;
    let secondaryOther = !fp.isNil(dataUse.secondaryOther);
    let secondaryOtherText = dataUse.secondaryOther;
    let generalUse = dataUse.generalUse;

    setRegistrationState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        methods: methods,
        genetic: genetics,
        publication: publication,
        collaboration: collaboration,
        ethics: ethics,
        geographic: geographic,
        moratorium: moratorium,
        nonProfit: nonProfit,
        hmb: hmb,
        npoa: npoa,
        diseases: diseases,
        other: other,
        primaryOtherText: primaryOtherText,
        secondaryOther: secondaryOther,
        secondaryOtherText: secondaryOtherText,
        generalUse: generalUse
      }
    }));
  };

  const handleOpenModal = () => {
    setRegistrationState(prevState => ({
      ...prevState,
      showModal: true
    }));
  };

  const handleCloseModal = () => {
    setRegistrationState(prevState => ({
      ...prevState,
      showModal: false
    }));
  };

  const handleChange = (e) => {
    const field = e.target.name;
    const value = e.target.value;
    setRegistrationState(prevState => ({
      ...prevState,
      datasetData: {
        ...prevState.datasetData,
        [field]: value
      },
      disableOkBtn: false,
      problemSavingRequest: false,
      submissionSuccess: false
    }));
  };

  // same as handleChange, but adds call to validate dataset name and only affects state if a change has been made
  const handleDatasetNameChange = async (e) => {
    const value = e.target.value;
    if (registrationState.datasetData.datasetName !== value) {
      await validateDatasetName(value);
      setRegistrationState(prevState => ({
        ...prevState,
        datasetData: {
          ...prevState.datasetData,
          datasetName: value
        },
        disableOkBtn: false,
        problemSavingRequest: false,
        submissionSuccess: false
      }));
    }
  };

  const handlePositiveIntegerOnly = (e) => {
    const field = e.target.name;
    const value = e.target.value.replace(/[^\d]/, '');

    if (value === '' || parseInt(value, 10) > -1) {
      setRegistrationState(prevState => ({
        ...prevState,
        datasetData: {
          ...prevState.datasetData,
          [field]: value
        },
        disableOkBtn: false,
        problemSavingRequest: false,
        submissionSuccess: false
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const field = e.target.name;
    const value = e.target.checked;
    setRegistrationState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        [field]: value
      },
      disableOkBtn: false,
      problemSavingRequest: false,
      submissionSuccess: false
    }));
  };

  const validateRequiredFields = (formData) => {
    return (
      isValid(formData.researcher) &&
      isValid(formData.principalInvestigator) &&
      registrationState.datasetData.isValidName &&
      isValid(registrationState.datasetData.datasetName) &&
      isValid(formData.datasetRepoUrl) &&
      isValid(formData.dataType) &&
      isValid(formData.species) &&
      isValid(formData.phenotype) &&
      isValid(formData.nrParticipants) &&
      isValid(formData.description) &&
      isValid(registrationState.selectedDac) &&
      (!fp.isEmpty(registrationState.updateDataset) || !isTypeOfResearchInvalid())
    );
  };



  // generates the css classnames based on what's in the dataset name field and if we have tried to submit
  const showDatasetNameErrorHighlight = (name, showValidationMessages) => {
    if (fp.isEmpty(name)) {
      return showValidationMessages ? 'form-control required-field-error' : 'form-control';
    }
    // if there is a name loaded in because this is an update
    if (!fp.isEmpty(registrationState.updateDataset)) {
      let updateDatasetName = registrationState.updateDataset.name;
      if (name === updateDatasetName) {
        return 'form-control';
      }
      // if the old dataset name has been edited
      else {
        return registrationState.datasetData.isValidName ? 'form-control' : 'form-control required-field-error';
      }
    }
    // if a new dataset name is being edited
    else {
      return registrationState.datasetData.isValidName ? 'form-control' : 'form-control required-field-error';
    }
  };

  const attestAndSave = () => {
    setRegistrationState(prevState => {
      let allValid = validateRequiredFields(prevState.datasetData);
      return {
        ...prevState,
        showDialogSubmit: allValid ? true : false,
        problemLoadingUpdateDataset: false,
        showValidationMessages: allValid ? false :true
      };
    });
  };

  const isValid = (value) => {
    let isValid = false;
    if (value !== '' && value !== null && value !== undefined) {
      isValid = true;
    }
    return isValid;
  };



  // Function to handle dialog submission
  const dialogHandlerSubmit = (answer) => () => {
    if (answer === true) {
      let ontologies = [];
      for (let ontology of registrationState.formData.ontologies) {
        ontologies.push(ontology.item);
      }
      // Update formData and datasetData state
      setRegistrationState(prevState => {
        if (ontologies.length > 0) {
          return {
            ...prevState, formData: {
              ...prevState.formData,
              ontologies
            }};
        }
        return prevState;
      });

      setRegistrationState(prevState => {
        const updatedDatasetData = { ...prevState };
        for (let key in prevState) {
          if (prevState[key] === '') {
            updatedDatasetData[key] = undefined;
          }
        }
        return updatedDatasetData;
      });
      // Set disableOkBtn to true
      setRegistrationState({
        ...registrationState,
        disableOkBtn: true
      });
      // If showValidationMessages is true, hide dialog
      if (registrationState.showValidationMessages) {
        setRegistrationState({
          ...registrationState,
          showDialogSubmit: true
        });
      } else {
        // Handle form submission
        let ds = formatFormData(registrationState.datasetData);
        if (fp.isEmpty(registrationState.updateDataset)) {
          DataSet.postDatasetForm(ds).then(() => {
            setRegistrationState({
              ...registrationState,
              showDialogSubmit: false,
              submissionSuccess: true
            });
          }).catch(e => {
            let errorMessage = (e.status === 409) ?
              'Dataset with this name already exists: ' + registrationState.datasetData.datasetName
              + '. Please choose a different name before attempting to submit again.'
              : 'Some errors occurred, Dataset Registration couldn\'t be completed.';
            setRegistrationState({
              ...registrationState,
              problemSavingRequest: true,
              submissionSuccess: false,
              errorMessage
            });
          });
        } else {
          const { datasetId } = props.match.params;
          DataSet.updateDataset(datasetId, ds).then(() => {
            setRegistrationState({
              ...registrationState,
              showDialogSubmit: false,
              submissionSuccess: true
            });
          }).catch(() => {
            let errorMessage = 'Some errors occurred, the Dataset was not updated.';
            setRegistrationState({
              ...registrationState,
              problemSavingRequest: true,
              submissionSuccess: false,
              errorMessage
            });
          });
        }
      }
    } else {
      setRegistrationState({
        ...registrationState,
        showDialogSubmit: false
      });
    }
  };

  /**
   * HMB, Diseases, and Other/OtherText are all mutually exclusive
   */

  const isTypeOfResearchInvalidChange = () => {
    const valid = (
      registrationState.formData.generalUse === true ||
      registrationState.formData.hmb === true ||
      (registrationState.formData.diseases === true && !fp.isEmpty(registrationState.formData.ontologies)) ||
      (registrationState.formData.other === true && !fp.isEmpty(registrationState.formData.primaryOtherText))
    );
    return !valid;
  };

  const setGeneralUse = () => {
    setRegistrationState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        generalUse: true,
        hmb: false,
        diseases: false,
        ontologies: [],
        other: false,
        primaryOtherText: ''
      },
      disableOkBtn: false,
      problemSavingRequest: false,
      submissionSuccess: false
    }));
  };

  const setHmb = () => {
    setRegistrationState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        generalUse: false,
        hmb: true,
        diseases: false,
        ontologies: [],
        npoa: false,
        other: false,
        primaryOtherText: ''
      },
      disableOkBtn: false,
      problemSavingRequest: false,
      submissionSuccess: false
    }));
  };

  const setDiseases = () => {
    setRegistrationState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        generalUse: false,
        hmb: false,
        diseases: true,
        npoa: false,
        other: false,
        primaryOtherText: ''
      },
      disableOkBtn: false,
      problemSavingRequest: false,
      submissionSuccess: false
    }));
  };

  const onOntologiesChange = (data) => {
    setRegistrationState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        ontologies: data || []
      },
      disableOkBtn: false,
      problemSavingRequest: false,
      submissionSuccess: false
    }));
  };

  const setOther = () => {
    setRegistrationState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        generalUse: false,
        hmb: false,
        diseases: false,
        other: true,
        ontologies: [],
        npoa: false,
        disableOkBtn: false,
        problemSavingRequest: false,
        submissionSuccess: false
      }
    }));
  };

  const setOtherText = (e, level) => {
    const value = e.target.value;
    (level === 'primary') ?
      setRegistrationState(prevState => ({
        ...prevState,
        formData: {
          ...prevState.formData,
          other: true,
          primaryOtherText: value,
          disableOkBtn: false,
          problemSavingRequest: false,
          submissionSuccess: false
        }
      })) :
      setRegistrationState(prevState => ({
        ...prevState,
        formData: {
          ...prevState.formData,
          secondaryOther: true,
          secondaryOtherText: value,
          disableOkBtn: false,
          problemSavingRequest: false,
          submissionSuccess: false
        }
      }));
  };

  const back = () => {
    props.history.goBack();
  };

  const createProperties = () => {
    let properties = [];
    let formData = registrationState.datasetData;

    if (formData.datasetName) {
      properties.push({'propertyName': 'Dataset Name', 'propertyValue': formData.datasetName});
    }
    if (formData.collectionId) {
      properties.push({'propertyName': 'Sample Collection ID', 'propertyValue': formData.collectionId});
    }
    if (formData.dataType) {
      properties.push({'propertyName': 'Data Type', 'propertyValue': formData.dataType});
    }
    if (formData.species) {
      properties.push({'propertyName': 'Species', 'propertyValue': formData.species});
    }
    if (formData.phenotype) {
      properties.push({'propertyName': 'Phenotype/Indication', 'propertyValue': formData.phenotype});
    }
    if (formData.nrParticipants) {
      properties.push({'propertyName': '# of participants', 'propertyValue': formData.nrParticipants});
    }
    if (formData.description) {
      properties.push({'propertyName': 'Description', 'propertyValue': formData.description});
    }
    if (formData.datasetRepoUrl) {
      properties.push({'propertyName': 'url', 'propertyValue': formData.datasetRepoUrl});
    }
    if (formData.researcher) {
      properties.push({'propertyName': 'Data Depositor', 'propertyValue': formData.researcher});
    }
    if (formData.principalInvestigator) {
      properties.push({'propertyName': 'Principal Investigator(PI)', 'propertyValue': formData.principalInvestigator});
    }
  };

  const dacOptionsChange = () => {
    return registrationState.dacList.map(item => ({
      key: item.dacId,
      value: item.dacId,
      label: item.name,
      item: item
    }));
  };

  const onDacChange = (option) => {
    setRegistrationState(prevState => ({
      ...prevState,
      selectedDac: option ? option.item : {},
      datasetData: {
        ...prevState.datasetData,
        dac: option ? option.item : {},
      },
      disableOkBtn: false,
      problemSavingRequest: false,
      problemLoadingUpdateDataset: false
    }));
  };

  const formatFormData = (data) => {
    let result = {};
    result.datasetName = data.datasetName;
    result.dacId = registrationState.selectedDac.dacId;
    result.consentId = data.consentId;
    // The deprecated API this posts to is expecting a `translatedUseRestriction` field
    result.translatedUseRestriction = data.translatedDataUse;
    result.deletable = true;
    result.isAssociatedToDataOwners = true;
    result.updateAssociationToDataOwnerAllowed = true;
    result.properties = createProperties();
    result.dataUse = fp.isEmpty(registrationState.updateDataset) ? formatDataUse(registrationState.formData) : registrationState.updateDataset.dataUse;
    return result;
  };

  const formatDataUse = (data) => {
    let result = {};
    if (data.methods) {
      result.methodsResearch = data.methods;
    }
    if (data.genetic) {
      result.geneticStudiesOnly = data.genetic;
    }
    if (data.publication) {
      result.publicationResults = data.publication;
    }
    if (data.collaboration) {
      result.collaboratorRequired = data.collaboration;
    }
    if (data.ethics) {
      result.ethicsApprovalRequired = data.ethics;
    }
    if (data.geographic) {
      result.geographicalRestrictions = 'Yes';
    }
    if (data.moratorium) {
      result.publicationMoratorium = data.moratorium;
    }
    if (data.npoa) {
      result.populationOriginsAncestry = false;
    }
    if (data.nonProfit) {
      result.nonProfitUse = data.nonProfit;
    }
    if (data.hmb) {
      result.hmbResearch = data.hmb;
    }
    if (data.diseases) {
      let ids = data.ontologies.map(ontology => ontology.id);
      result.diseaseRestrictions = ids;
    }
    if (data.other) {
      result.otherRestrictions = data.other;
    }
    if (fp.trim(data.primaryOtherText).length > 0) {
      result.other = data.primaryOtherText;
    }
    if (data.secondaryOther) {
      result.secondaryOther = data.secondaryOtherText;
    }
    if (data.generalUse) {
      result.generalUse = data.generalUse;
    }
    return result;
  };

  const formatOntologyItems = (ontologies) => {
    const ontologyItems = ontologies.map((ontology) => {
      return {
        id: ontology.id || ontology.item.id,
        key: ontology.id || ontology.item.id,
        value: ontology.id || ontology.item.id,
        label: ontology.label || ontology.item.label,
        item: ontology || ontology.item
      };
    });
    return ontologyItems;
  };

  const {
    hmb = false,
    npoa = false,
    diseases = false,
    other = false,
    primaryOtherText = '',
    secondaryOther = false,
    secondaryOtherText = '',
    genetic = false,
    nonProfit = false,
    publication = false,
    collaboration = false,
    ethics = false,
    geographic = false,
    moratorium = false,
    methods = false,
    generalUse = false,
  } = registrationState.formData;
  const { ontologies } = registrationState.formData;
  const { problemSavingRequest, problemLoadingUpdateDataset, showValidationMessages, submissionSuccess } = registrationState;
  const isTypeOfResearchInvalid = isTypeOfResearchInvalidChange();
  const isUpdateDataset = (!fp.isEmpty(registrationState.updateDataset));
  const dacOptions = dacOptionsChange();
  const profileUnsubmitted = (
    <span>
      Please make sure{' '}
      <Link to="/profile" className="hover-color">
        Your Profile
      </Link>{' '}
      is updated, as it will be linked to your dataset for future correspondence
    </span>
  );

  return (
    <div className='container'>
      <div className='col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12'>
        <div className='row no-margin'>
          <Notification notificationData={registrationState.notificationData} />
          <div className="col-lg-12 col-md-12 col-sm-12">
            <PageHeading
              id="requestApplication"
              imgSrc={addDatasetIcon}
              iconSize="medium"
              color="dataset"
              title="Dataset Registration"
              description="This is an easy way to register a dataset in DUOS!"
            />
          </div>
        </div>
        <hr className="section-separator" />
      </div>

      <form name='form' noValidate={true}>
        <div id='form-views'>
          <div>
            <div className='col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12'>
              <fieldset>
                {registrationState.completed === false && (
                  <div className="rp-alert">
                    <Alert id="profileUnsubmitted" type="danger" title={profileUnsubmitted} />
                  </div>
                )}
                {problemLoadingUpdateDataset && (
                  <div className="rp-alert">
                    <Alert
                      id="problemLoadingUpdateDataset"
                      type="danger"
                      title="The Dataset you were trying to access either does not exist or you do not have permission to edit it."
                    />
                  </div>
                )}
                <h3 className="rp-form-title dataset-color">1. Dataset Information</h3>

                <div className="form-group">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label className="control-label rp-title-question dataset-color">1.1 Data Custodian*</label>
                  </div>

                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <input
                      type="text"
                      name="researcher"
                      id="inputResearcher"
                      defaultValue={registrationState.datasetData.researcher}
                      onBlur={handleChange}
                      disabled={!isUpdateDataset}
                      className={
                        fp.isEmpty(registrationState.datasetData.researcher) && showValidationMessages
                          ? 'form-control required-field-error'
                          : 'form-control'
                      }
                      required={true}
                    />
                    {(fp.isEmpty(registrationState.datasetData.researcher) && showValidationMessages) && (
                      <span className="cancel-color required-field-error-span">Required field</span>
                    )}
                  </div>
                </div>


                <div className="form-group">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label className="control-label rp-title-question dataset-color">1.2 Principal Investigator (PI)*</label>
                  </div>

                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <input
                      type="text"
                      name="principalInvestigator"
                      id="inputPrincipalInvestigator"
                      defaultValue={registrationState.datasetData.principalInvestigator}
                      onBlur={handleChange}
                      className={
                        (fp.isEmpty(registrationState.datasetData.principalInvestigator) && showValidationMessages)
                          ? 'form-control required-field-error'
                          : 'form-control'
                      }
                      required={true}
                    />
                    {(fp.isEmpty(registrationState.datasetData.principalInvestigator) && showValidationMessages) && (
                      <span className="cancel-color required-field-error-span">Required field</span>
                    )}
                  </div>
                </div>

                {/* 1.3 Dataset Name */}
                <div className="form-group">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label className="control-label rp-title-question dataset-color">
                      1.3 Dataset Name*
                      <span>Please provide a publicly displayable name for the dataset</span>
                    </label>
                  </div>

                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group">
                    <input
                      type="text"
                      name="datasetName"
                      id="inputName"
                      maxLength="256"
                      defaultValue={registrationState.datasetData.datasetName}
                      onBlur={handleDatasetNameChange}
                      className={showDatasetNameErrorHighlight(registrationState.datasetData.datasetName, showValidationMessages)}
                      required={true}
                    />
                    {
                      fp.includes(
                        'required-field-error',
                        showDatasetNameErrorHighlight(registrationState.datasetData.datasetName, showValidationMessages)
                      ) && (
                        <span
                          className="cancel-color required-field-error-span"
                        >
                          {registrationState.datasetData.isValidName ? 'Required field' : 'Dataset Name already in use'}
                        </span>
                      )
                    }
                  </div>
                </div>


                <div className="form-group">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label className="control-label rp-title-question dataset-color">
                      1.4 Dataset Repository URL* <span>
                       Please provide the URL at which approved requestors can access the data
                      </span>
                    </label>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group">
                    <input
                      type="url"
                      name="datasetRepoUrl"
                      id="inputRepoUrl"
                      maxLength="256"
                      placeholder="http://..."
                      defaultValue={registrationState.datasetData.datasetRepoUrl}
                      onBlur={handleChange}
                      className={(registrationState.datasetData.datasetRepoUrl === '' && showValidationMessages) ? 'form-control required-field-error' : 'form-control'}
                      required={true}
                    />
                    {(fp.isEmpty(registrationState.datasetData.datasetRepoUrl) && showValidationMessages) && (
                      <span className="cancel-color required-field-error-span">Required field</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label className="control-label rp-title-question dataset-color">
                     1.5 Data Type* </label>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group">
                    <input
                      type="text"
                      name="dataType"
                      id="inputDataType"
                      maxLength="256"
                      defaultValue={registrationState.datasetData.dataType}
                      onBlur={handleChange}
                      className={(fp.isEmpty(registrationState.datasetData.dataType) && showValidationMessages) ? 'form-control required-field-error' : 'form-control'}
                      required={true}
                    />
                    {(fp.isEmpty(registrationState.datasetData.dataType) && showValidationMessages) && (
                      <span className="cancel-color required-field-error-span">Required field</span>
                    )}
                  </div>
                </div>

                {/* Repeat the above structure for the rest of the fields */}

                <div className="form-group">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label className="control-label rp-title-question dataset-color">
                     1.6 Species* </label>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group">
                    <input
                      type="text"
                      name="species"
                      id="inputSpecies"
                      maxLength="256"
                      defaultValue={registrationState.datasetData.species}
                      onBlur={handleChange}
                      className={(fp.isEmpty(registrationState.datasetData.species) && showValidationMessages) ? 'form-control required-field-error' : 'form-control'}
                      required={true}
                    />
                    {(fp.isEmpty(registrationState.datasetData.species) && showValidationMessages) && (
                      <span className="cancel-color required-field-error-span">Required field</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label className="control-label rp-title-question dataset-color">
                     1.7 Phenotype/Indication* </label>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group">
                    <input
                      type="text"
                      name="phenotype"
                      id="inputPhenotype"
                      maxLength="256"
                      defaultValue={registrationState.datasetData.phenotype}
                      onBlur={handleChange}
                      className={(fp.isEmpty(registrationState.datasetData.phenotype) && showValidationMessages) ? 'form-control required-field-error' : 'form-control'}
                      required
                    />
                    {(fp.isEmpty(registrationState.datasetData.phenotype) && showValidationMessages) && (
                      <span className="cancel-color required-field-error-span">Required field</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label className="control-label rp-title-question dataset-color">
                      1.8 # of Participants* </label>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group">
                    <input
                      type="number"
                      name="nrParticipants"
                      id="inputParticipants"
                      maxLength="256"
                      min="0"
                      defaultValue={registrationState.datasetData.nrParticipants}
                      onBlur={handlePositiveIntegerOnly}
                      className={(fp.isEmpty(registrationState.datasetData.nrParticipants) && showValidationMessages) ? 'form-control required-field-error' : 'form-control'}
                      required={true}
                    />
                    {(fp.isEmpty(registrationState.datasetData.nrParticipants) && showValidationMessages) && (
                      <span className="cancel-color required-field-error-span">Required field</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label className="control-label rp-title-question dataset-color">
                       1.9 Dataset Description* </label>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group">
                    <input
                      type="text"
                      name="description"
                      id="inputDescription"
                      maxLength="256"
                      defaultValue={registrationState.datasetData.description}
                      onBlur={handleChange}
                      className={(fp.isEmpty(registrationState.datasetData.description) && showValidationMessages) ? 'form-control required-field-error' : 'form-control'}
                      required={true}
                    />
                    {(fp.isEmpty(registrationState.datasetData.description) && showValidationMessages) && (
                      <span className="cancel-color required-field-error-span">Required field</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label className="control-label rp-title-question dataset-color">
                      1.10 Data Access Committee* </label>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <Select
                      name="dac"
                      id="inputDac"
                      onChange={(option) => onDacChange(option)}
                      blurInputOnSelect={true}
                      value={fp.filter((dac) => registrationState.selectedDac?.dacId === dac.value, dacOptions)}
                      openMenuOnFocus={true}
                      isDisabled={false}
                      isClearable={true}
                      isMulti={false}
                      isSearchable={true}
                      options={dacOptions}
                      placeholder="Select a DAC..."
                      className={(fp.isEmpty(registrationState.selectedDac) && showValidationMessages) ? 'required-field-error' : ''}
                      required={true}
                    />
                    {(fp.isEmpty(registrationState.selectedDac) && showValidationMessages) && (
                      <span className="cancel-color required-field-error-span">Required field</span>
                    )}
                  </div>
                </div>
              </fieldset>

              <h3 className='rp-form-title dataset-color'>2. Data Use Terms</h3>

              <div className="form-group">
                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                  <label className="control-label rp-title-question dataset-color">
                    2.1 Primary Data Use Terms* <span style={{ marginBottom: '1.5rem' }}>
                     Please select one of the following data use permissions for your dataset.
                    </span>
                  </label>
                  <div style={{ marginLeft: '15px' }} className="row">
                    {
                      registrationState.isTypeOfResearchInvalid && registrationState.showValidationMessages && (
                        <span
                          className='cancel-color required-field-error-span'
                        >
                        One of the following fields is required.<br />
                        Disease related studies require a disease selection.<br />
                        Other studies require additional details.
                        </span>
                      )
                    }
                  </div>

                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <RadioButton
                      id="checkGeneral"
                      name="checkPrimary"
                      value="general"
                      defaultChecked={generalUse}
                      onClick={setGeneralUse}
                      label="General Research Use: "
                      description="Use is permitted for any research purpose"
                      disabled={isUpdateDataset}
                    />
                    <RadioButton
                      id="checkHmb"
                      name="checkPrimary"
                      value="hmb"
                      defaultChecked={hmb}
                      onClick={setHmb}
                      label="Health/Medical/Biomedical Use: "
                      description="Use is permitted for any health, medical, or biomedical purpose"
                      disabled={isUpdateDataset}
                    />
                    <RadioButton
                      id="checkDisease"
                      name="checkPrimary"
                      value="diseases"
                      defaultChecked={diseases}
                      onClick={setDiseases}
                      label="Disease-related studies: "
                      description="Use is permitted for research on the specified disease"
                      disabled={isUpdateDataset}
                    />
                    <div
                      style={{
                        marginTop: '1rem',
                        marginBottom: '2rem',
                        color: '#777',
                        cursor: diseases ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <AsyncSelect
                        id="sel_diseases"
                        isDisabled={isUpdateDataset || !diseases}
                        isMulti={true}
                        loadOptions={(query, callback) => searchOntologies(query, callback)}
                        onChange={(option) => onOntologiesChange(option)}
                        value={ontologies}
                        placeholder="Please enter one or more diseases"
                        classNamePrefix="select"
                      />
                    </div>
                    <RadioButton
                      id="checkOther"
                      name="checkPrimary"
                      value="other"
                      defaultChecked={other}
                      onClick={setOther}
                      label="Other Use:"
                      description="Permitted research use is defined as follows: "
                      disabled={isUpdateDataset}
                    />
                    <textarea
                      style={{ margin: '1rem 0' }}
                      className="form-control"
                      value={primaryOtherText}
                      onChange={(e) => setOtherText(e, 'primary')}
                      name="primaryOtherText"
                      id="primaryOtherText"
                      maxLength="512"
                      rows="2"
                      required={other}
                      placeholder="Please specify if selected (max. 512 characters)"
                      disabled={isUpdateDataset || !other}
                    />
                  </div>
                  <div className="form-group">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                      <label className="control-label rp-title-question dataset-color">
                        2.2 Secondary Data Use Terms
                        <span>Please select all applicable data use parameters.</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <div className="checkbox">
                      <input
                        checked={methods}
                        onChange={handleCheckboxChange}
                        id="checkMethods"
                        type="checkbox"
                        className="checkbox-inline rp-checkbox"
                        name="methods"
                        disabled={isUpdateDataset}
                      />
                      <label className="regular-checkbox rp-choice-questions" htmlFor="checkMethods">
                        <span className="access-color">No methods development or validation studies (NMDS)</span>
                      </label>
                    </div>

                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                      <div className="checkbox">
                        <input
                          checked={genetic}
                          onChange={handleCheckboxChange}
                          id="checkGenetic"
                          type="checkbox"
                          className="checkbox-inline rp-checkbox"
                          name="genetic"
                          disabled={isUpdateDataset}
                        />
                        <label className="regular-checkbox rp-choice-questions" htmlFor="checkGenetic">
                          <span className="access-color">Genetic Studies Only (GSO)</span>
                        </label>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                      <div className="checkbox">
                        <input
                          checked={publication}
                          onChange={handleCheckboxChange}
                          id="checkPublication"
                          type="checkbox"
                          className="checkbox-inline rp-checkbox"
                          name="publication"
                          disabled={isUpdateDataset}
                        />
                        <label className="regular-checkbox rp-choice-questions" htmlFor="checkPublication">
                          <span className="access-color">Publication Required (PUB)</span>
                        </label>
                      </div>
                    </div>

                    {/* Repeat similar structures for other checkboxes */}
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                      <div className="checkbox">
                        <input
                          checked={collaboration}
                          onChange={handleCheckboxChange}
                          id="checkCollaboration"
                          type="checkbox"
                          className="checkbox-inline rp-checkbox"
                          name="collaboration"
                          disabled={isUpdateDataset}
                        />
                        <label className="regular-checkbox rp-choice-questions" htmlFor="checkCollaboration">
                          <span className="access-color">Collaboration Required (COL)</span>
                        </label>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                      <div className="checkbox">
                        <input
                          checked={ethics}
                          onChange={handleCheckboxChange}
                          id="checkEthics"
                          type="checkbox"
                          className="checkbox-inline rp-checkbox"
                          name="ethics"
                          disabled={isUpdateDataset}
                        />
                        <label className="regular-checkbox rp-choice-questions" htmlFor="checkEthics">
                          <span className="access-color">Ethics Approval Required (IRB)</span>
                        </label>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                      <div className="checkbox">
                        <input
                          checked={geographic}
                          onChange={handleCheckboxChange}
                          id="checkGeographic"
                          type="checkbox"
                          className="checkbox-inline rp-checkbox"
                          name="geographic"
                          disabled={isUpdateDataset}
                        />
                        <label className="regular-checkbox rp-choice-questions" htmlFor="checkGeographic">
                          <span className="access-color">Geographic Restriction (GS-)</span>
                        </label>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                      <div className="checkbox">
                        <input
                          checked={moratorium}
                          onChange={handleCheckboxChange}
                          id="checkMoratorium"
                          type="checkbox"
                          className="checkbox-inline rp-checkbox"
                          name="moratorium"
                          disabled={isUpdateDataset}
                        />
                        <label className="regular-checkbox rp-choice-questions" htmlFor="checkMoratorium">
                          <span className="access-color">Publication Moratorium (MOR)</span>
                        </label>
                      </div>
                    </div>

                    {
                      generalUse || npoa && (
                        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                          <div className="checkbox">
                            <input
                              checked={registrationState.npoa}
                              onChange={this.handleCheckboxChange}
                              id="checkNpoa"
                              type="checkbox"
                              className="checkbox-inline rp-checkbox"
                              name="npoa"
                              disabled={isUpdateDataset}
                            />
                            <label className="regular-checkbox rp-choice-questions" htmlFor="checkNpoa">
                              <span className="access-color">No Populations Origins or Ancestry Research (NPOA)</span>
                            </label>
                          </div>
                        </div>
                      )
                    }
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                      <div className="checkbox">
                        <input
                          checked={nonProfit}
                          onChange={handleCheckboxChange}
                          id="checkNonProfit"
                          type="checkbox"
                          className="checkbox-inline rp-checkbox"
                          name="nonProfit"
                          disabled={isUpdateDataset}
                        />
                        <label className="regular-checkbox rp-choice-questions" htmlFor="checkNonProfit">
                          <span className="access-color">Non-Profit Use Only (NPU)</span>
                        </label>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                      <div className="checkbox">
                        <input
                          checked={secondaryOther}
                          onChange={handleCheckboxChange}
                          id="checkSecondaryOther"
                          type="checkbox"
                          className="checkbox-inline rp-checkbox"
                          name="secondaryOther"
                          disabled={isUpdateDataset}
                        />
                        <label className="regular-checkbox rp-choice-questions" htmlFor="checkSecondaryOther">
                          <span className="access-color">Other Secondary Use Terms:</span>
                        </label>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                      <textarea
                        defaultValue={secondaryOtherText}
                        onBlur={(e) => setOtherText(e, 'secondary')}
                        name="secondaryOtherText"
                        id="inputSecondaryOtherText"
                        className="form-control"
                        rows="6"
                        required={false}
                        placeholder="Note - adding free text data use terms in the box will inhibit your dataset from being read by the DUOS Algorithm for decision support."
                        disabled={isUpdateDataset || !secondaryOther}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <h3 className='rp-form-title dataset-color'>3. Data Provider Agreement</h3>

              <div className="form-group">
                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                  <label className="control-label rp-title-question dataset-color">3.1 DUOS Data Provider Agreement</label>
                </div>

                <div className="row no-margin">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <label style={controlLabelStyle} className="default-color">
                     By submitting this Data Provider Agreement, you agree to comply with all terms relevant to Dataset Custodians put forth in the agreement.
                    </label>
                  </div>

                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group">
                    <a
                      rel="noreferrer"
                      id="link_downloadAgreement"
                      href={DataProviderAgreement}
                      target="_blank"
                      className="col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color"
                    >
                      <span className="glyphicon glyphicon-download" />
                       DUOS Data Provider Agreement
                    </a>
                  </div>
                </div>

                <div className="row no-margin">
                  <div className={showValidationMessages ? 'rp-alert' : 'hidden'}>
                    <Alert id="formErrors" type="danger" title="Please, complete all required fields." />
                  </div>

                  {
                    problemSavingRequest && (
                      <div className='rp-alert'>
                        <Alert id="problemSavingRequest" type="danger" title={registrationState.errorMessage} />
                      </div>
                    )
                  }

                  {
                    submissionSuccess && (
                      <div className='rp-alert'>
                        <Alert
                          id="submissionSuccess"
                          type="info"
                          title={isUpdateDataset ? 'Dataset was successfully updated.' : 'Dataset was successfully registered.'}
                        />
                      </div>
                    )
                  }

                  <div className="row no-margin">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                      <a
                        id="btn_submit"
                        onClick={attestAndSave}
                        className="f-right btn-primary dataset-background bold"
                      >
                        {isUpdateDataset ? 'Update Dataset' : 'Register in DUOS!'}
                      </a>

                      <ConfirmationDialog
                        title="Dataset Registration Confirmation"
                        disableOkBtn={registrationState.disableOkBtn}
                        color="dataset"
                        showModal={registrationState.showDialogSubmit}
                        action={{ label: 'Yes', handler: dialogHandlerSubmit }}
                      >
                        <div className="dialog-description">Are you sure you want to submit this Dataset Registration?</div>
                      </ConfirmationDialog>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DatasetRegistration;




