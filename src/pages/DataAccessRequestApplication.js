import { Component } from 'react';
import { a, div, form, h, hr, i, small, span} from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import ResearcherInfo from './dar_application/ResearcherInfo';
import DataAccessRequest from './dar_application/DataAccessRequest';
import ResearchPurposeStatement from './dar_application/ResearchPurposeStatement';
import DataUseAgreements from './dar_application/DataUseAgreements';
import { TypeOfResearch } from './dar_application/TypeOfResearch';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import { DAR, Researcher } from '../libs/ajax';
import { NotificationService } from '../libs/notificationService';
import { Storage } from '../libs/storage';
import { Navigation } from "../libs/utils";
import * as fp from 'lodash/fp';

import './DataAccessRequestApplication.css';

class DataAccessRequestApplication extends Component {

  constructor(props) {
    super(props);
    this.state = {
      nihValid: false,
      disableOkBtn: false,
      showValidationMessages: false,
      file: {
        name: ''
      },
      completed: '',
      showDialogSubmit: false,
      showDialogSave: false,
      step: 1,
      formData: {
        datasets: [],
        dar_code: null,
        labCollaborators: [],
        internalCollaborators: [],
        checkCollaborator: false,
        rus: '',
        nonTechRus: '',
        linkedIn: '',
        orcid: '',
        oneGender: '',
        methods: '',
        controls: '',
        population: '',
        hmb: false,
        poa: false,
        diseases: false,
        ontologies: [],
        other: false,
        otherText: '',
        forProfit: '',
        gender: '',
        pediatric: '',
        illegalBehavior: '',
        addiction: '',
        sexualDiseases: '',
        stigmatizedDiseases: '',
        vulnerablePopulation: '',
        populationMigration: '',
        psychiatricTraits: '',
        notHealth: '',
        investigator: '',
        researcher: '',
        projectTitle: '',
        researcherGate: '',
        isThePi: '',
        havePi: '',
        profileName: '',
        piName: '',
        pubmedId: '',
        scientificUrl: '',
        otherCollaborators: []
      },
      step1: {
        inputResearcher: {
          invalid: false
        },
        inputInvestigator: {
          invalid: false
        },
        inputNih: {
          invalid: false
        }
      },
      step3: {
        inputPurposes: {
          invalid: false
        }
      },
      problemSavingRequest: false
    };

    this.goToStep = this.goToStep.bind(this);
    this.formFieldChange = this.formFieldChange.bind(this);
    this.partialSave = this.partialSave.bind(this);
  }

  //helper function to coordinate local state changes as well as updates to form data on the parent
  formFieldChange = (dataset) => {
    const {name, value} = dataset;
    this.setState(state => {
      state.formData[name] = value;
      return state;
    }, () => this.checkValidations());
  };

  onNihStatusUpdate = (nihValid) => {
    if (this.state.nihValid !== nihValid) {
      this.setState(prev => {
        prev.nihValid = nihValid;
        return prev;
      });
    }
  };

  async componentDidMount() {
    await this.init();
    ReactTooltip.rebuild();
    const notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
    this.setState(prev => {
      prev.notificationData = notificationData;
      return prev;
    });
  }

  async init() {
    const { dataRequestId } = this.props.match.params;
    let formData = {};
    if (!fp.isNil(dataRequestId)) {
      // Handle the case where we have an existing DAR id
      // Same endpoint works for any dataRequestId, not just partials.
      DAR.getPartialDarRequest(dataRequestId).then(data => {
        formData = data;
        // Handle the case where the DAR is already submitted. We have to
        // show the single dataset that was selected for this DAR and not
        // all of the original datasets that may have been originally selected.
        if (!fp.isNil(formData.darCode)) {
          const dsId = fp.get('datasetIds')(formData)[0];
          formData.datasets = fp.filter({value: dsId.toString()})(formData.datasets);
        }
      });
    } else {
      // Lastly, try to get the form data from local storage and clear out whatever was there previously
      formData = Storage.getData('dar_application') === null ? this.state.formData : Storage.getData('dar_application');
      Storage.removeData('dar_application');
    }
    let currentUserId = Storage.getCurrentUser().dacUserId;
    let rpProperties = await Researcher.getPropertiesByResearcherId(currentUserId);
    formData.darCode = fp.isNil(formData.darCode) ? null : formData.darCode;
    formData.partialDarCode = fp.isNil(formData.partialDarCode) ? null : formData.partialDarCode;
    formData.ontologies = this.formatOntologyItems(formData);
    formData.researcher = rpProperties.profileName != null ? rpProperties.profileName : '';
    if (rpProperties.piName === undefined && rpProperties.isThePI === 'true') {
      formData.investigator = rpProperties.profileName;
    } else if (rpProperties.piName === undefined && rpProperties.isThePI === 'false') {
      formData.investigator = '--';
    } else {
      formData.investigator = rpProperties.piName;
    }

    formData.linkedIn = rpProperties.linkedIn !== undefined ? rpProperties.linkedIn : '';
    formData.researcherGate = rpProperties.researcherGate !== undefined ? rpProperties.researcherGate : '';
    formData.orcid = rpProperties.orcid !== undefined ? rpProperties.orcid : '';
    formData.institution = rpProperties.institution != null ? rpProperties.institution : '';
    formData.department = rpProperties.department != null ? rpProperties.department : '';
    formData.division = rpProperties.division != null ? rpProperties.division : '';
    formData.address1 = rpProperties.address1 != null ? rpProperties.address1 : '';
    formData.address2 = rpProperties.address2 != null ? rpProperties.address2 : '';
    formData.city = rpProperties.city != null ? rpProperties.city : '';
    formData.zipCode = rpProperties.zipCode != null ? rpProperties.zipCode : '';
    formData.country = rpProperties.country != null ? rpProperties.country : '';
    formData.state = rpProperties.state != null ? rpProperties.state : '';
    formData.piName = rpProperties.piName !== null ? rpProperties.piName : '';
    formData.academicEmail = rpProperties.academicEmail != null ? rpProperties.academicEmail : '';
    formData.piEmail = rpProperties.piEmail != null ? rpProperties.piEmail : '';
    formData.isThePi = rpProperties.isThePI !== undefined ? rpProperties.isThePI : '';
    formData.havePi = rpProperties.havePI !== undefined ? rpProperties.havePI : '';
    formData.pubmedId = rpProperties.pubmedID !== undefined ? rpProperties.pubmedID : '';
    formData.scientificUrl = rpProperties.scientificURL !== undefined ? rpProperties.scientificURL : '';
    formData.userId = Storage.getCurrentUser().dacUserId;

    let completed = false;
    if (!fp.isNil(formData.darCode)) {
      completed = '';
    } else if (rpProperties.completed !== undefined) {
      completed = JSON.parse(rpProperties.completed);
    }
    this.setState(prev => {
      prev.completed = completed;
      prev.formData = fp.merge(prev.formData, formData);
      return prev;
    });

  };

  formatOntologyItems = (formData) => {
    let ontologyItems = [];
    // Filter null values. TODO: Possible bug in saving partial dars
    let formDataOntologies = fp.pickBy(fp.identity)(formData.ontologies);
    if (!fp.isNil(formDataOntologies) && !fp.isEmpty(formDataOntologies)) {
      ontologyItems = fp.map((item) => {
        return {
          key: item.id,
          value: item.id,
          label: item.label,
          item: { id: item.id, label: item.label }
        };
      })(formDataOntologies);
    }
    return ontologyItems;
  };

  updateShowValidationMessages = (value) => {
    this.setState((state) => {
      state.showValidationMessages = value;
      return state;
    });
  }

  checkValidations() {
    if (this.state.showValidationMessages === true && this.state.step === 1) {
      this.verifyStep1();
    } else if (this.state.showValidationMessages === true && this.state.step === 2) {
      this.verifyStep2();
    } else if (this.state.showValidationMessages === true && this.state.step === 3) {
      this.verifyStep3();
    }
  };

  handleRadioChange = (e, field, value) => {
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }
    this.setState(prev => {
      if (field === 'oneGender' && value === false) {
        prev.formData.gender = '';
      }
      prev.formData[field] = value;
      return prev;
    }, () => this.checkValidations());
  };

  //NOTE: use nextPage and previous page instead of having individual go to pages for each step
  nextPage = (e) => {
    this.setState(prev => {
      prev.step = prev.step + 1;
      return prev;
    });
    window.scrollTo(0,0);
  }

  prevPage = (e) => {
    this.setState(prev => {
      prev.step = prev.step - 1;
      return prev;
    });
    window.scrollTo(0,0);
  }

  goToStep = (step = 1) => {
    this.setState(prev => {
      prev.step = step;
      return prev;
    });
    window.scrollTo(0, 0);
  }

  attestAndSave = (e) => {
    let invalidStep1 = this.verifyStep1();
    let invalidStep2 = this.verifyStep2();
    let invalidStep3 = this.verifyStep3();
    if (!invalidStep1 && !invalidStep2 && !invalidStep3) {
      this.setState({ showDialogSubmit: true });
    } else {
      this.setState(state => {
        state.showValidationMessages = true;
        return state;
      });
    }
  };

  isValid(value) {
    let isValid = false;
    if (value !== '' && value !== null && value !== undefined) {
      isValid = true;
    }
    return isValid;
  };

  //NOTE: seperated out check functionality from state updates in original function to make it easier to follow
  step1InvalidChecks = () => {
    let isResearcherInvalid = false,
      isInvestigatorInvalid = false,
      showValidationMessages = false,
      isNihInvalid = !this.state.nihValid;

    if (!this.isValid(this.state.formData.researcher)) {
      isResearcherInvalid = true;
      showValidationMessages = true;
    }
    if (!this.isValid(this.state.formData.investigator)) {
      isInvestigatorInvalid = true;
      showValidationMessages = true;
    }
    if (this.state.formData.checkCollaborator !== true &&
      !this.isValid(this.state.formData.linkedIn) &&
      !this.isValid(this.state.formData.researcherGate) &&
      !this.isValid(this.state.formData.orcid) &&
      !this.state.nihValid) {
      isNihInvalid = true;
      showValidationMessages = true;
    }
    // DUOS-565: checkCollaborator : false and nihValid : false is an invalid combination
    if (this.state.formData.checkCollaborator !== true &&
      !this.state.nihValid) {
      isNihInvalid = true;
      showValidationMessages = true;
    }

    return { isResearcherInvalid, isInvestigatorInvalid, showValidationMessages, isNihInvalid };
  };

  //method to be passed to step 4 for error checks/messaging
  step1InvalidResult(dataset) {
    const checkCollaborator = this.state.formData.checkCollaborator;
    const {isResearcherInvalid, isInvestigatorInvalid, showValidationMessages, isNihInvalid} = dataset;
    return isResearcherInvalid || isInvestigatorInvalid || showValidationMessages || (!checkCollaborator && isNihInvalid);
  }

  verifyStep1() {
    const { isResearcherInvalid, isInvestigatorInvalid, isNihInvalid, showValidationMessages } = this.step1InvalidChecks();
    this.setState(prev => {
      prev.step1.inputResearcher.invalid = isResearcherInvalid;
      prev.step1.inputInvestigator.invalid = isInvestigatorInvalid;
      prev.step1.inputNih.invalid = isNihInvalid;
      if (prev.showValidationMessages === false) prev.showValidationMessages = showValidationMessages;
      return prev;
    });
    return showValidationMessages;
  };

  verifyStep2() {
    const datasetsInvalid = fp.isEmpty(this.state.formData.datasets);
    const titleInvalid = fp.isEmpty(this.state.formData.projectTitle);
    const typeOfResearchInvalid = this.isTypeOfResearchInvalid();
    const rusInvalid = fp.isEmpty(this.state.formData.rus);
    const summaryInvalid = fp.isEmpty(this.state.formData.nonTechRus);
    return datasetsInvalid || titleInvalid || typeOfResearchInvalid || rusInvalid || summaryInvalid;
  };

  isGenderValid(gender, oneGender) {
    let isValidGender = false;
    if (oneGender === false || (oneGender === true && this.isValid(gender))) {
      isValidGender = true;
    }
    return isValidGender;
  }

  step3InvalidResult = () => {
    return !(this.isValid(this.state.formData.forProfit) &&
      this.isValid(this.state.formData.oneGender) &&
      this.isGenderValid(this.state.formData.gender, this.state.formData.oneGender) &&
      this.isValid(this.state.formData.pediatric) &&
      this.isValid(this.state.formData.illegalBehavior) &&
      this.isValid(this.state.formData.addiction) &&
      this.isValid(this.state.formData.sexualDiseases) &&
      this.isValid(this.state.formData.stigmatizedDiseases) &&
      this.isValid(this.state.formData.vulnerablePopulation) &&
      this.isValid(this.state.formData.populationMigration) &&
      this.isValid(this.state.formData.psychiatricTraits) &&
      this.isValid(this.state.formData.notHealth));
  }


  verifyStep3() {
    let invalid = false;
    if (this.step3InvalidResult()) {
      this.setState(prev => {
        prev.step3.inputPurposes.invalid = true;
        prev.showValidationMessages = true;
        return prev;
      });
      invalid = true;
    } else {
      this.setState(prev => {
        prev.step3.inputPurposes.invalid = false;
        return prev;
      });
    }
    return invalid;
  }

  partialSave = (e) => {
    this.setState({ showDialogSave: true });
  };

  dialogHandlerSubmit = (answer) => (e) => {
    if (answer === true) {
      let ontologies = [];
      for (let ontology of this.state.formData.ontologies) {
        ontologies.push(ontology.item);
      }
      this.setState(prev => {
        if (ontologies.length > 0) {
          prev.formData.ontologies = ontologies;
        }
        for (var key in prev.formData) {
          if (prev.formData[key] === '') {
            prev.formData[key] = undefined;
          }

        }
        return prev;
      }, () => {
        let formData = this.state.formData;
        // DAR datasetIds needs to be a list of ids
        formData.datasetIds = fp.map('value')(formData.datasets);
        formData.userId = Storage.getCurrentUser().dacUserId;
        this.setState(prev => {
          prev.disableOkBtn = true;
          return prev;
        });
        DAR.postDataAccessRequest(formData).then(response => {
          this.setState({ showDialogSubmit: false });
          Navigation.console(Storage.getCurrentUser(), this.props.history);
        }).catch(e =>
          this.setState(prev => {
            prev.problemSavingRequest = true;
            return prev;
          }));
      });
    } else {
      this.setState({ showDialogSubmit: false });
    }
  };

  setShowDialogSave = (value) => {
    this.setState(prev => {
      prev.showDialogSave = value;
      prev.disableOkBtn = false;
      return prev;
    });
  };

  dialogHandlerSave = (answer) => (e) => {
    this.setState(prev => {
      prev.disableOkBtn = true;
      return prev;
    });
    if (answer === true) {
      // DAR datasetIds needs to be a list of ids
      const datasetIds = fp.map('value')(this.state.formData.datasets);
      // DAR ontologies needs to be a list of id/labels.
      const ontologies = fp.map((o) => {return {
        id: o.key,
        label: o.value
      };})(this.state.formData.ontologies);
      this.setState(prev => {
        prev.formData.datasetIds = datasetIds;
        prev.formData.ontologies = ontologies;
        return prev;
      }, () => this.savePartial());
    } else {
      this.setShowDialogSave(false);
    }
  };

  savePartial = () => {
    let formData = this.state.formData;
    // DAR datasetIds needs to be a list of ids
    formData.datasetIds = fp.map('value')(formData.datasets);
    // Make sure we navigate back to the current DAR after saving.
    const { dataRequestId } = this.props.match.params;
    if (fp.isNil(dataRequestId)) {
      DAR.postPartialDarRequest(formData).then(resp => {
        this.setShowDialogSave(false);
        this.props.history.replace('/dar_application/' + resp.reference_id);
      });
    } else {
      DAR.updatePartialDarRequest(formData).then(resp => {
        this.setShowDialogSave(false);
      });
    }
  };

  onDatasetsChange = (data, action) => {
    this.setState(prev => {
      prev.formData.datasets = data;
      return prev;
    }, () => this.checkValidations());
  };


  /**
   * HMB, POA, Diseases, and Other/OtherText are all mutually exclusive
   */

  isTypeOfResearchInvalid = () => {
    const valid = (
      this.state.formData.hmb === true ||
      this.state.formData.poa === true ||
      (this.state.formData.diseases === true && !fp.isEmpty(this.state.formData.ontologies)) ||
      (this.state.formData.other === true && !fp.isEmpty(this.state.formData.otherText))
    );
    return !valid;
  };

  setHmb = () => {
    this.setState(prev => {
      prev.formData.hmb = true;
      prev.formData.poa = false;
      prev.formData.diseases = false;
      prev.formData.other = false;
      prev.formData.otherText = '';
      prev.formData.ontologies = [];
      return prev;
    });
  };

  setPoa = () => {
    this.setState(prev => {
      prev.formData.hmb = false;
      prev.formData.poa = true;
      prev.formData.diseases = false;
      prev.formData.other = false;
      prev.formData.otherText = '';
      prev.formData.ontologies = [];
      return prev;
    });
  };

  setDiseases = () => {
    this.setState(prev => {
      prev.formData.hmb = false;
      prev.formData.poa = false;
      prev.formData.diseases = true;
      prev.formData.other = false;
      prev.formData.otherText = '';
      return prev;
    });
  };

  onOntologiesChange = (data) => {
    this.setState(prev => {
      prev.formData.ontologies = data;
      return prev;
    });
  };

  setOther = () => {
    this.setState(prev => {
      prev.formData.hmb = false;
      prev.formData.poa = false;
      prev.formData.diseases = false;
      prev.formData.other = true;
      prev.formData.ontologies = [];
      return prev;
    });
  };

  setOtherText = (e) => {
    const value = e.target.value;
    this.setState(prev => {
      prev.formData.otherText = value;
      return prev;
    });
  };

  back = (e) => {
    this.props.history.goBack();
  };

  render() {
    const {
      orcid = '',
      researcherGate = '',
      checkCollaborator = false,
      darCode,
      hmb = false,
      poa = false,
      diseases = false,
      other = false,
      otherText = '',
      population = false,
      forProfit = false,
      controls = false,
      methods = false,
      linkedIn = '',
      investigator = '',
      labCollaborators,
      internalCollaborators,
      ontologies = []
    } = this.state.formData;
    const { dataRequestId } = this.props.match.params;
    const eRACommonsDestination = fp.isNil(dataRequestId) ? 'dar_application' : ('dar_application/' + dataRequestId);
    const { problemSavingRequest, showValidationMessages,  step1 } = this.state;
    const isTypeOfResearchInvalid = this.isTypeOfResearchInvalid();

    //NOTE: component is only here temporarily until component conversion has been complete
    //ideally this, along with the other variable initialization should be done with a useEffect hook
    const TORComponent = TypeOfResearch({
      hmb: hmb,
      hmbHandler: this.setHmb,
      poa: poa,
      poaHandler: this.setPoa,
      diseases: diseases,
      diseasesHandler: this.setDiseases,
      disabled: (darCode !== null),
      ontologies: ontologies,
      ontologiesHandler: this.onOntologiesChange,
      other: other,
      otherHandler: this.setOther,
      otherText: otherText,
      otherTextHandler: this.setOtherText
    });

    const ConfirmationDialogComponent = ConfirmationDialog({
      title: 'Data Request Confirmation',
      disableOkBtn: this.state.disableOkBtn,
      disableNoBtn: this.state.disableOkBtn,
      color: 'access',
      showModal: this.state.showDialogSubmit,
      action: {
        label: 'Yes',
        handler: this.dialogHandlerSubmit
      }
    }, [div({
      className: 'dialog-description'
    }, ['Are you sure you want to send this Data Access Request Application?'])]);

    return (
      div({ className: 'container' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
          div({ className: 'row no-margin' }, [
            Notification({notificationData: this.state.notificationData}),
            div({
              className: (this.state.formData.darCode !== null ?
                'col-lg-10 col-md-9 col-sm-9 ' :
                this.state.formData.darCode === null ? 'col-lg-12 col-md-12 col-sm-12 ' : 'col-xs-12 no-padding')
            }, [
              PageHeading({
                id: 'requestApplication', imgSrc: '/images/icon_add_access.png', iconSize: 'medium', color: 'access',
                title: 'Data Access Request Application',
                description: 'The section below includes a series of questions intended to allow our Data Access Committee to evaluate a newly developed semi-automated process of data access control.'
              })
            ]),
            div({ isRendered: this.state.formData.darCode !== null, className: 'col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding' }, [
              a({ id: 'btn_back', onClick: this.back, className: 'btn-primary btn-back' }, [
                i({ className: 'glyphicon glyphicon-chevron-left' }), 'Back'
              ])
            ])
          ]),
          hr({ className: 'section-separator' }),

          div({ className: 'row fsi-row-lg-level fsi-row-md-level multi-step-buttons no-margin' }, [

            a({
              id: 'btn_step_1',
              onClick: (e => this.goToStep(1, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 1 ? 'active' : '')
            }, [
              small({}, ['Step 1']),
              'Researcher Information',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_2',
              onClick: (e => this.goToStep(2, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 2 ? 'active' : '')
            }, [
              small({}, ['Step 2']),
              'Data Access Request',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_3',
              onClick: (e => this.goToStep(3, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 3 ? 'active' : '')
            }, [
              small({}, ['Step 3']),
              'Research Purpose Statement',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_4',
              onClick: (e => this.goToStep(4, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 4 ? 'active' : '')
            }, [
              small({}, ['Step 4']),
              'Data Use Agreements',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ])
          ])
        ]),
        form({ name: 'form', 'noValidate': true }, [
          div({ id: 'form-views' }, [

            ConfirmationDialog({
              title: 'Save changes?', disableOkBtn: this.state.disableOkBtn, disableNoBtn: this.state.disableOkBtn, color: 'access',
              showModal: this.state.showDialogSave, action: { label: 'Yes', handler: this.dialogHandlerSave }
            }, [
              div({ className: 'dialog-description' },
                ['Are you sure you want to save this Data Access Request? Previous changes will be overwritten.'])
            ]),
            div({ isRendered: this.state.step === 1 }, [
              h(ResearcherInfo, ({
                checkCollaborator: checkCollaborator,
                completed: this.state.completed,
                darCode: this.state.formData.darCode,
                eRACommonsDestination: eRACommonsDestination,
                formFieldChange: this.formFieldChange,
                invalidInvestigator: step1.inputInvestigator.invalid,
                invalidResearcher: step1.inputResearcher.invalid,
                investigator: investigator,
                linkedIn: linkedIn,
                location: this.props.location,
                nihValid: this.state.nihValid,
                onNihStatusUpdate: this.onNihStatusUpdate,
                orcid: orcid,
                internalCollaborators: internalCollaborators,
                labCollaborators: labCollaborators,
                partialSave: this.partialSave,
                researcher: this.state.formData.researcher,
                researcherGate: researcherGate,
                showValidationMessages: showValidationMessages,
                nextPage: this.nextPage
              }))
            ]),

            div({ isRendered: this.state.step === 2 }, [
              h(DataAccessRequest, {
                darCode: darCode,
                datasets: this.state.formData.datasets,
                onDatasetsChange: this.onDatasetsChange,
                showValidationMessages: showValidationMessages,
                formFieldChange: this.formFieldChange,
                projectTitle: this.state.formData.projectTitle,
                isTypeOfResearchInvalid: isTypeOfResearchInvalid,
                TypeOfResearch: TORComponent,
                methods,
                controls,
                population,
                forProfit,
                rus: this.state.formData.rus,
                nonTechRus: this.state.formData.nonTechRus,
                nextPage: this.nextPage,
                prevPage: this.prevPage,
                partialSave: this.partialSave
              })
            ]),

            div({ isRendered: this.state.step === 3 }, [
              h(ResearchPurposeStatement, {
                addiction: this.state.formData.addiction,
                darCode: darCode,
                formFieldChange: this.formFieldChange,
                forProfit: this.state.formData.forProfit,
                gender: this.state.formData.gender,
                handleRadioChange: this.handleRadioChange,
                illegalBehavior: this.state.formData.illegalBehavior,
                nextPage: this.nextPage,
                notHealth: this.state.formData.notHealth,
                oneGender: this.state.formData.oneGender,
                partialSave: this.partialSave,
                pediatric: this.state.formData.pediatric,
                populationMigration: this.state.formData.populationMigration,
                prevPage: this.prevPage,
                psychiatricTraits: this.state.formData.psychiatricTraits,
                sexualDiseases: this.state.formData.sexualDiseases,
                showValidationMessages: showValidationMessages,
                stigmatizedDiseases: this.state.formData.stigmatizedDiseases,
                vulnerablePopulation: this.state.formData.vulnerablePopulation
              })
            ]),

            div({ isRendered: this.state.step === 4 }, [
              h(DataUseAgreements, {
                darCode: darCode,
                problemSavingRequest,
                attestAndSave: this.attestAndSave,
                ConfirmationDialogComponent,
                partialSave: this.partialSave,
                prevPage: this.prevPage,
                step1Invalid: this.step1InvalidResult(this.step1InvalidChecks()),
                step2Invalid: this.verifyStep2(),
                step3Invalid: this.step3InvalidResult(),
                showValidationMessages,
                updateShowValidationMessages: this.updateShowValidationMessages,
                goToStep: this.goToStep
              })
            ])
          ])
        ])
      ])
    );
  }
}

export default DataAccessRequestApplication;
