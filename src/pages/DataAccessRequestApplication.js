import { Component } from 'react';
import { a, div, fieldset, form, h, h3, hr, i, input, label, li, ol, p, small, span} from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import ResearcherInfo from './dar_application/ResearcherInfo';
import DataAccessRequest from './dar_application/DataAccessRequest';
import { TypeOfResearch } from './dar_application/TypeOfResearch';
import { Alert } from '../components/Alert';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
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
        checkCollaborator: false,
        rus: '',
        non_tech_rus: '',
        linkedIn: '',
        orcid: '',
        onegender: '',
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
        illegalbehave: '',
        addiction: '',
        sexualdiseases: '',
        stigmatizediseases: '',
        vulnerablepop: '',
        popmigration: '',
        psychtraits: '',
        nothealth: '',
        investigator: '',
        researcher: '',
        projectTitle: '',
        researcherGate: '',
        isThePi: '',
        havePi: '',
        profileName: '',
        piName: '',
        pubmedId: '',
        scientificUrl: ''
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

  }

  //helper function to coordinate local state changes as well as updates to form data on the parent
  formStateChange = (stateVarSetter, attr, event) => {
    const name = event.target.name;
    const value = event.target[attr];
    this.formFieldChange(name, value);
    stateVarSetter(value);
  };

  formFieldChange = (field, value) => {
    this.setState(state => {
      state.formData[field] = value;
      return state;
    }, () => this.checkValidations());
  }

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
        if (!fp.isNil(formData.dar_code)) {
          const dsId = fp.get('datasetId')(formData)[0];
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
    formData.dar_code = fp.isNil(formData.dar_code) ? null : formData.dar_code;
    formData.partial_dar_code = fp.isNil(formData.partial_dar_code) ? null : formData.partial_dar_code;
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
    formData.zipcode = rpProperties.zipcode != null ? rpProperties.zipcode : '';
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
    if (!fp.isNil(formData.dar_code)) {
      completed = '';
    } else if (rpProperties.completed !== undefined) {
      completed = JSON.parse(rpProperties.completed);
    }
    this.setState(prev => {
      prev.completed = completed;
      prev.formData = formData;
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

  handleChange = (e) => {
    const field = e.target.name;
    const value = e.target.value;
    this.setState(prev => {
      prev.formData[field] = value;
      return prev;
    }, () => this.checkValidations());
  };

  checkValidations() {
    if (this.state.showValidationMessages === true && this.state.step === 1) {
      this.verifyStep1();
    } else if (this.state.showValidationMessages === true && this.state.step === 2) {
      this.verifyStep2();
    } else if (this.state.showValidationMessages === true && this.state.step === 3) {
      this.verifyStep3();
    }
  };

  handleCheckboxChange = (e) => {
    const field = e.target.name;
    const value = e.target.checked;
    this.setState(prev => {
      prev.formData[field] = value;
      return prev;
    }, () => this.checkValidations());
  };

  handleRadioChange = (e, field, value) => {
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }
    this.setState(prev => {
      if (field === 'onegender' && value === false) {
        prev.formData.gender = '';
      }
      prev.formData[field] = value;
      return prev;
    }, () => this.checkValidations());
  };

  handleGenderChange = (e, value) => {
    this.setState(prev => {
      prev.formData.gender = value;
      return prev;
    }, () => this.checkValidations());
  };

//NOTE: use nextPage and previous page instead of having indiividual go to pages for each step
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

  step1 = (e) => {
    this.setState(prev => {
      prev.step = 1;
      return prev;
    });
    window.scrollTo(0, 0);
  };

  step2 = (e) => {
    this.setState(prev => {
      prev.step = 2;
      return prev;
    });
    window.scrollTo(0, 0);
  };

  step3 = (e) => {
    this.setState(prev => {
      prev.step = 3;
      return prev;
    });
    window.scrollTo(0, 0);
  };

  step4 = (e) => {
    this.setState(prev => {
      prev.step = 4;
      return prev;
    });
    window.scrollTo(0, 0);
  };

  attestAndSave = (e) => {
    let invalidStep1 = this.verifyStep1();
    let invalidStep2 = this.verifyStep2();
    let invalidStep3 = this.verifyStep3();
    if (!invalidStep1 && !invalidStep2 && !invalidStep3) {
      this.setState({ showDialogSubmit: true });
    }
  };

  isValid(value) {
    let isValid = false;
    if (value !== '' && value !== null && value !== undefined) {
      isValid = true;
    }
    return isValid;
  };

  verifyStep1() {
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
    if (this.state.formData.checkCollaborator !== true
      && !this.isValid(this.state.formData.linkedIn)
      && !this.isValid(this.state.formData.researcherGate)
      && !this.isValid(this.state.formData.orcid)
      && !this.state.nihValid) {
      isNihInvalid = true;
      showValidationMessages = true;
    }
    // DUOS-565: checkCollaborator : false and nihValid : false is an invalid combination
    if (this.state.formData.checkCollaborator !== true
      && !this.state.nihValid) {
      isNihInvalid = true;
      showValidationMessages = true;
    }
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
    const summaryInvalid = fp.isEmpty(this.state.formData.non_tech_rus);
    return datasetsInvalid || titleInvalid || typeOfResearchInvalid || rusInvalid || summaryInvalid;
  };

  isGenderValid(gender, onegender) {
    let isValidGender = false;
    if (onegender === false || (onegender === true && this.isValid(gender))) {
      isValidGender = true;
    }
    return isValidGender;
  }

  verifyStep3() {
    let invalid = false;
    if (!(this.isValid(this.state.formData.forProfit) &&
      this.isValid(this.state.formData.onegender) &&
      this.isGenderValid(this.state.formData.gender, this.state.formData.onegender) &&
      this.isValid(this.state.formData.pediatric) &&
      this.isValid(this.state.formData.illegalbehave) &&
      this.isValid(this.state.formData.addiction) &&
      this.isValid(this.state.formData.sexualdiseases) &&
      this.isValid(this.state.formData.stigmatizediseases) &&
      this.isValid(this.state.formData.vulnerablepop) &&
      this.isValid(this.state.formData.popmigration) &&
      this.isValid(this.state.formData.psychtraits) &&
      this.isValid(this.state.formData.nothealth))) {
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
        // DAR datasetId needs to be a list of ids
        formData.datasetId = fp.map('value')(formData.datasets);
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
      // DAR datasetId needs to be a list of ids
      const datasetId = fp.map('value')(this.state.formData.datasets);
      // DAR ontologies needs to be a list of id/labels.
      const ontologies = fp.map((o) => {return {
        id: o.key,
        label: o.value
      };})(this.state.formData.ontologies);
      this.setState(prev => {
        prev.formData.datasetId = datasetId;
        prev.formData.ontologies = ontologies;
        return prev;
      }, () => this.savePartial());
    } else {
      this.setShowDialogSave(false);
    }
  };

  savePartial = () => {
    let formData = this.state.formData;
    // DAR datasetId needs to be a list of ids
    formData.datasetId = fp.map('value')(formData.datasets);
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
      dar_code,
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
      ontologies = []
    } = this.state.formData;
    const { dataRequestId } = this.props.match.params;
    const eRACommonsDestination = fp.isNil(dataRequestId) ? 'dar_application' : ('dar_application/' + dataRequestId);
    const { problemSavingRequest, showValidationMessages,  step1, step3 } = this.state;
    const isTypeOfResearchInvalid = this.isTypeOfResearchInvalid();
    const genderLabels = ['Female', 'Male'];
    const genderValues = ['F', 'M'];

    //NOTE: component is only here temporarily until component conversion has been complete
    //ideally this, along with the other variable initialization should be done with a useEffect hook
    const TORComponent = TypeOfResearch({
      hmb: hmb,
      hmbHandler: this.setHmb,
      poa: poa,
      poaHandler: this.setPoa,
      diseases: diseases,
      diseasesHandler: this.setDiseases,
      disabled: (dar_code !== null),
      ontologies: ontologies,
      ontologiesHandler: this.onOntologiesChange,
      other: other,
      otherHandler: this.setOther,
      otherText: otherText,
      otherTextHandler: this.setOtherText
    });

    return (
      div({ className: 'container' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
          div({ className: 'row no-margin' }, [
            Notification({notificationData: this.state.notificationData}),
            div({
              className: (this.state.formData.dar_code !== null ?
                'col-lg-10 col-md-9 col-sm-9 ' :
                this.state.formData.dar_code === null ? 'col-lg-12 col-md-12 col-sm-12 ' : 'col-xs-12 no-padding')
            }, [
              PageHeading({
                id: 'requestApplication', imgSrc: '/images/icon_add_access.png', iconSize: 'medium', color: 'access',
                title: 'Data Access Request Application',
                description: 'The section below includes a series of questions intended to allow our Data Access Committee to evaluate a newly developed semi-automated process of data access control.'
              })
            ]),
            div({ isRendered: this.state.formData.dar_code !== null, className: 'col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding' }, [
              a({ id: 'btn_back', onClick: this.back, className: 'btn-primary btn-back' }, [
                i({ className: 'glyphicon glyphicon-chevron-left' }), 'Back'
              ])
            ])
          ]),
          hr({ className: 'section-separator' }),

          div({ className: 'row fsi-row-lg-level fsi-row-md-level multi-step-buttons no-margin' }, [

            a({
              id: 'btn_step_1',
              onClick: this.step1,
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 1 ? 'active' : '')
            }, [
              small({}, ['Step 1']),
              'Researcher Information',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_2',
              onClick: this.step2,
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 2 ? 'active' : '')
            }, [
              small({}, ['Step 2']),
              'Data Access Request',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_3',
              onClick: this.step3,
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 3 ? 'active' : '')
            }, [
              small({}, ['Step 3']),
              'Research Purpose Statement',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_4',
              onClick: this.step4,
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
                darCode: this.state.formData.dar_code,
                eRACommonsDestination: eRACommonsDestination,
                formStateChange: this.formStateChange,
                invalidInvestigator: step1.inputInvestigator.invalid,
                invalidResearcher: step1.inputResearcher.invalid,
                investigator: investigator,
                linkedIn: linkedIn,
                location: this.props.location,
                nihValid: this.state.nihValid,
                onNihStatusUpdate: this.onNihStatusUpdate,
                orcid: orcid,
                partialSave: this.partialSave,
                researcher: this.state.formData.researcher,
                researcherGate: researcherGate,
                showValidationMessages: showValidationMessages,
                nextPage: this.nextPage
              }))
            ]),

            div({ isRendered: this.state.step === 2 }, [
              h(DataAccessRequest, {
                darCode: dar_code,
                datasets: this.state.formData.datasets,
                onDatasetsChange: this.onDatasetsChange,
                showValidationMessages: showValidationMessages,
                formStateChange: this.formStateChange,
                projectTitle: this.state.formData.projectTitle,
                isTypeOfResearchInvalid: isTypeOfResearchInvalid,
                TypeOfResearch: TORComponent,
                methods,
                controls,
                population,
                forProfit,
                rus: this.state.formData.rus,
                nonTechRus: this.state.formData.non_tech_rus,
                nextPage: this.nextPage,
                prevPage: this.prevPage,
                partialSave: this.partialSave
              })
            ]),

            div({ isRendered: this.state.step === 3 }, [
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({ disabled: this.state.formData.dar_code !== null }, [

                  h3({ className: 'rp-form-title access-color' }, ['3. Research Purpose Statement']),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' },
                        ['3.1 In order to ensure appropriate review, please answer the questions below:'])
                    ]),
                    div({ className: 'row no-margin' }, [
                      span({
                        className: 'cancel-color required-field-error-span', isRendered: step3.inputPurposes.invalid && showValidationMessages,
                        style: { 'marginLeft': '15px' }
                      }, ['All fields are required'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.1 Will this data be used exclusively or partially for a commercial purpose?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.forProfit, onChange: this.handleRadioChange, id: 'forProfit', name: 'forProfit',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' }, ['3.1.2 Please indicate if this study is limited to one gender?'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.onegender, onChange: this.handleRadioChange, id: 'onegender', name: 'onegender',
                        required: true
                      }),
                      div({
                        isRendered: this.state.formData.onegender === 'true' || this.state.formData.onegender === true,
                        className: 'multi-step-fields', disabled: (this.state.formData.dar_code !== null)
                      }, [
                        span({}, ['Please specify']),
                        div({ className: 'radio-inline' }, [
                          genderLabels.map((option, ix) => {
                            return (
                              label({
                                key: 'gender' + ix,
                                onClick: (e) => this.handleGenderChange(e, genderValues[ix]),
                                id: 'lbl_gender_' + ix,
                                htmlFor: 'rad_gender_' + ix,
                                className: 'radio-wrapper'
                              }, [
                                input({
                                  type: 'radio',
                                  id: 'rad_gender_' + ix,
                                  name: this.state.name,
                                  checked: this.state.formData.gender === genderValues[ix],
                                  onChange: () => { }
                                }),
                                span({ className: 'radio-check' }),
                                span({ className: 'radio-label' }, [genderLabels[ix]])
                              ])
                            );
                          })
                        ])
                      ])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.3 Please indicate if this study is restricted to a  pediatric population (under the age of 18)?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.pediatric, onChange: this.handleRadioChange, id: 'pediatric', name: 'pediatric', required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.4 Does the research aim involve the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization)?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.illegalbehave, onChange: this.handleRadioChange, id: 'illegalbehave', name: 'illegalbehave',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.5 Does the research aim involve the study of alcohol or drug abuse, or abuse of other addictive products?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.addiction, onChange: this.handleRadioChange, id: 'addiction', name: 'addiction', required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.6 Does the research aim involve the study of sexual preferences or sexually transmitted diseases?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.sexualdiseases, onChange: this.handleRadioChange, id: 'sexualdiseases', name: 'sexualdiseases',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.7 Does the research aim involve the study of any stigmatizing illnesses?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.stigmatizediseases, onChange: this.handleRadioChange, id: 'stigmatizediseases',
                        name: 'stigmatizediseases', required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.8 Does the study target a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or ["SIGNIFICANTLY"] economically or educationally disadvantaged persons)?'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.vulnerablepop, onChange: this.handleRadioChange, id: 'vulnerablepop', name: 'vulnerablepop',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.9 Does the research aim involve the study of Population Origins/Migration patterns?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.popmigration, onChange: this.handleRadioChange, id: 'popmigration', name: 'popmigration',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.10 Does the research aim involve the study of psychological traits, including intelligence, attention, emotion?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.psychtraits, onChange: this.handleRadioChange, id: 'psychtraits', name: 'psychtraits',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.11 Does the research correlate ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways that are not easily related to Health?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.nothealth, onChange: this.handleRadioChange, id: 'nothealth', name: 'nothealth', required: true
                      })
                    ])
                  ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    a({ id: 'btn_prev', onClick: this.step2, className: 'btn-primary f-left access-background' }, [
                      span({ className: 'glyphicon glyphicon-chevron-left', 'aria-hidden': 'true' }), 'Previous Step'
                    ]),

                    a({ id: 'btn_next', onClick: this.step4, className: 'btn-primary f-right access-background' }, [
                      'Next Step', span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' })
                    ]),

                    a({
                      id: 'btn_save', isRendered: this.state.formData.dar_code === null, onClick: this.partialSave,
                      className: 'f-right btn-secondary access-color'
                    }, ['Save'])
                  ])
                ])
              ])
            ]),

            div({ isRendered: this.state.step === 4 }, [
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({ disabled: this.state.formData.dar_code !== null }, [

                  h3({ className: 'rp-form-title access-color' }, ['4.1 Data Use Agreements']),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        'DUOS Library Card Data Access Agreement & Attestation'
                      ])
                    ]),

                    div({ className: 'row no-margin' }, [
                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                        span ({ className: 'rp-agreement rp-last-group' }, ['Under the National Institutes of Health (NIH) Genomic Data Sharing Policy, the Genomic Data User Code of Conduct sets forth principles for responsible management and use of large-scale genomic data and associated phenotypic data accessed through controlled access to NIHdesignated data repositories (e.g., the database of Genotypes and Phenotypes (dbGaP), repositories established as NIH Trusted Partners). Failure to abide by any term within this Code of Conduct may result in revocation of approved access to datasets obtained through these repositories. Investigators who are approved to access data agree to:']),

                        ol({ className: 'rp-agreement rp-last-group' }, [
                          li({}, ['Use datasets solely in connection with the research project described in the approved Data Access Request for each dataset']),
                          li({}, ['Make no attempt to identify or contact individual participants or groups from whom data were collected, or generate information that could allow participants’ identities to be readily ascertained, without appropriate approvals from the submitting institutions;']),
                          li({}, ['Maintain the confidentiality of the data and not distribute them to any entity or individual beyond those specified in the approved Data Access Request;']),
                          li({}, ['Adhere to the NIH Security Best Practices for Controlled-Access Data Subject to the NIH Genomic Data Sharing Policy and ensure that only approved users can gain access to data files;']),
                          li({}, ['Acknowledge the Intellectual Property terms as specified in the Library Card Agreement; ']),
                          li({}, ['Provide appropriate acknowledgement in any dissemination of research findings including the investigator(s) who generated the data, the funding source, accession numbers of the dataset, and the data repository from which the data were accessed; and,']),
                          li({}, ['Report any inadvertent data release, breach of data security, or other data management incidents in accordance with the terms specified in the Library Card Agreement. ']),
                        ])
                      ]),

                      div({ className: 'row no-margin' }, [
                        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                          label({ className: 'control-label default-color' },
                            ['By submitting this data access request, you agree to comply with all terms relevant to Authorized Users put forth in the agreement.'])
                        ]),

                        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                          a({
                            id: 'link_downloadAgreement', href: 'duos_librarycardagreementtemplate_rev_2020-04-14.pdf', target: '_blank',
                            className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                          }, [
                            span({ className: 'glyphicon glyphicon-download' }),
                            'DUOS Library Card Agreement'
                          ])
                        ]),

                        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                          p({ className: 'rp-agreement' },
                            ['For your request to be reviewed, your Signing Official must authorize you by sending a signed Library Card data access agreement']),
                          a({ href: '/home_about', target: '_blank' }, '(instructions here)')
                        ])
                      ])
                    ]),

                    div({ className: 'row no-margin' }, [
                      div({ isRendered: showValidationMessages, className: 'rp-alert' }, [
                        Alert({ id: 'formErrors', type: 'danger', title: 'Please, complete all required fields.' })
                      ]),

                      div({ isRendered: problemSavingRequest, className: 'rp-alert' }, [
                        Alert({
                          id: 'problemSavingRequest', type: 'danger',
                          title: 'Some errors occurred, Data Access Request Application couldn\'t be created.'
                        })
                      ])
                    ])
                  ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    a({ id: 'btn_prev', onClick: this.step3, className: 'f-left btn-primary access-background' }, [
                      span({ className: 'glyphicon glyphicon-chevron-left', 'aria-hidden': 'true' }), 'Previous Step'
                    ]),

                    a({
                      id: 'btn_submit', isRendered: this.state.formData.dar_code === null, onClick: this.attestAndSave,
                      className: 'f-right btn-primary access-background bold'
                    }, ['Attest and Send']),

                    ConfirmationDialog({
                      title: 'Data Request Confirmation', disableOkBtn: this.state.disableOkBtn, disableNoBtn: this.state.disableOkBtn,
                      color: 'access', showModal: this.state.showDialogSubmit, action: { label: 'Yes', handler: this.dialogHandlerSubmit }
                    }, [div({ className: 'dialog-description' }, ['Are you sure you want to send this Data Access Request Application?'])]),
                    h(ReactTooltip, { id: 'tip_clearNihAccount', place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }),

                    a({
                      id: 'btn_save', isRendered: this.state.formData.dar_code === null, onClick: this.partialSave,
                      className: 'f-right btn-secondary access-color'
                    }, ['Save'])
                  ])
                ])
              ])
            ])
          ])
        ])
      ])
    );
  }
}

export default DataAccessRequestApplication;
