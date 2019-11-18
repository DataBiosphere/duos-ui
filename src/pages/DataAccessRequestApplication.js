import { Component } from 'react';
import { a, br, div, fieldset, form, h, h3, hr, i, input, label, li, ol, p, small, span, textarea } from 'react-hyperscript-helpers';
import { Link } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import ReactTooltip from 'react-tooltip';
import { Alert } from '../components/Alert';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { eRACommons } from '../components/eRACommons';
import { PageHeading } from '../components/PageHeading';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
import { DAR, Researcher } from '../libs/ajax';
import { Storage } from '../libs/storage';

import './DataAccessRequestApplication.css';


const noOptionMessage = 'Start typing a Dataset Name, Sample Collection ID, or PI';

class DataAccessRequestApplication extends Component {

  constructor(props) {
    super(props);
    this.dialogHandlerSave = this.dialogHandlerSave.bind(this);
    this.setShowDialogSave = this.setShowDialogSave.bind(this);
    this.verifyCheckboxes = this.verifyCheckboxes.bind(this);
    this.state = {
      nihValid: false,
      disableOkBtn: false,
      showValidationMessages: false,
      optionMessage: noOptionMessage,
      file: {
        name: ''
      },
      showModal: false,
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
        other: '',
        othertext: '',
        linkedIn: '',
        orcid: '',
        ontologies: [],
        onegender: '',
        diseases: '',
        methods: '',
        controls: '',
        population: '',
        hmb: '',
        poa: '',
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
        urlDAA: '',
        nameDAA: '',
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
        inputTitle: {
          invalid: false
        },
        inputNih: {
          invalid: false
        }
      },
      step2: {
        inputDatasets: {
          invalid: false
        },
        inputRUS: {
          invalid: false
        },
        inputNonTechRUS: {
          invalid: false
        },
        inputOther: {
          invalid: false
        }
      },
      step3: {
        inputPurposes: {
          invalid: false
        }
      },
      step4: {
        uploadFile: {
          invalid: false
        }
      },
      problemSavingRequest: false
    };

    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.onNihStatusUpdate = this.onNihStatusUpdate.bind(this);
  }

  onNihStatusUpdate(nihValid) {
    if (this.state.nihValid !== nihValid) {
      this.setState(prev => {
        prev.nihValid = nihValid;
        return prev;
      });
    }
  };

  async componentDidMount() {
    await this.init();
    this.props.history.push('/dar_application');
    ReactTooltip.rebuild();
  }

  async init() {
    let formData = Storage.getData('dar_application') === null ? this.state.formData : Storage.getData('dar_application');
    Storage.removeData('dar_application');
    if (this.props.location.props !== undefined && this.props.location.props.formData !== undefined) {
      if (this.props.location.props.formData.dar_code !== undefined) {
        formData = this.props.location.props.formData;
        formData.ontologies = this.getOntologies(formData);
      } else if (this.props.location.props.formData.datasetId !== undefined) {
        // set datasets sent by data set catalog
        formData.datasets = this.processDataSet(this.props.location.props.formData.datasetId);
      }
    }
    let currentUserId = Storage.getCurrentUser().dacUserId;
    let rpProperties = await Researcher.getPropertiesByResearcherId(currentUserId);
    formData.dar_code = formData.dar_code === undefined ? null : formData.dar_code;
    formData.partial_dar_code = formData.partial_dar_code === undefined ? null : formData.partial_dar_code;

    formData.researcher = rpProperties.profileName != null ? rpProperties.profileName : '';

    if (rpProperties.piName === undefined && rpProperties.isThePI === 'true') {
      formData.investigator = rpProperties.profileName;
    } else if (rpProperties.piName === undefined && rpProperties.isThePI === 'false') {
      formData.investigator = '--';
    } else {
      formData.investigator = rpProperties.piName;
    }

    if (formData.dar_code === null) {
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
      formData.nameDAA = rpProperties.nameDAA != null ? rpProperties.nameDAA : '';
      formData.urlDAA = rpProperties.urlDAA != null ? rpProperties.urlDAA : '';
      formData.academicEmail = rpProperties.academicEmail != null ? rpProperties.academicEmail : '';
      formData.piEmail = rpProperties.piEmail != null ? rpProperties.piEmail : '';
      formData.isThePi = rpProperties.isThePI !== undefined ? rpProperties.isThePI : '';
      formData.havePi = rpProperties.havePI !== undefined ? rpProperties.havePI : '';
      formData.pubmedId = rpProperties.pubmedID !== undefined ? rpProperties.pubmedID : '';
      formData.scientificUrl = rpProperties.scientificURL !== undefined ? rpProperties.scientificURL : '';
    }

    formData.userId = Storage.getCurrentUser().dacUserId;

    if (formData.dar_code !== null || formData.partial_dar_code !== null) {
      formData.datasets = this.processDataSet(formData.datasetId);
    }
    let completed = false;
    if (formData.dar_code !== null) {
      completed = '';
    } else if (rpProperties.completed !== undefined) {
      completed = JSON.parse(rpProperties.completed);
    }
    this.setState(prev => {
      prev.completed = completed;
      prev.formData = formData;
      if (formData.nameDAA !== '') {
        prev.file.name = formData.nameDAA;
      }
      return prev;
    });

  };

  getOntologies(formData) {
    let ontologies = {};
    if (formData.ontologies !== undefined && formData.ontologies !== null) {
      ontologies = formData.ontologies.map(function(item) {
        return {
          key: item.id,
          value: item.id,
          label: item.label,
          item: item
        };
      });
    }
    return ontologies;
  }

  processDataSet(datasetIdList) {
    return datasetIdList.map(function(item) {
      return {
        value: item.id,
        label: item.concatenation
      };
    });
  }

  handleFileChange(event) {
    if (event.target.files !== undefined && event.target.files[0]) {
      let file = event.target.files[0];
      this.setState({
        file: file
      });
    }
  };

  handleOpenModal() {
    this.setState({ showModal: true });
  };

  handleCloseModal() {
    this.setState({ showModal: false });
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
    } else if (this.state.showValidationMessages === true && this.state.step === 4) {
      this.verifyStep4();
    }
  };

  handleCheckboxChange = (e) => {
    const field = e.target.name;
    const value = e.target.checked;
    this.setState(prev => {
      if (field === 'other' && value === false) {
        prev.formData.othertext = '';
      }
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
    let invalidStep4 = this.verifyStep4();
    if (!invalidStep1 && !invalidStep2 && !invalidStep3 && !invalidStep4) {
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
    let isTitleInvalid = false,
      isResearcherInvalid = false,
      isInvestigatorInvalid = false,
      isDAAInvalid = false,
      showValidationMessages = false,
      isNihInvalid = !this.state.nihValid;

    if (!this.isValid(this.state.formData.projectTitle)) {
      isTitleInvalid = true;
      showValidationMessages = true;
    }
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
      && !this.state.nihValid
      && !this.isValid(this.state.formData.uploadFile)) {
      isDAAInvalid = true;
      isNihInvalid = true;
      showValidationMessages = true;
    }
    this.setState(prev => {
      prev.step1.inputTitle.invalid = isTitleInvalid;
      prev.step1.inputResearcher.invalid = isResearcherInvalid;
      prev.step1.inputInvestigator.invalid = isInvestigatorInvalid;
      prev.step1.inputNih.invalid = isNihInvalid;
      prev.step4.uploadFile.invalid = isDAAInvalid;
      if (prev.showValidationMessages === false) prev.showValidationMessages = showValidationMessages;
      return prev;
    });
    return showValidationMessages;
  };

  verifyStep2() {
    let isDatasetsInvalid = false, isRusInvalid = false, isSummaryInvalid = false;
    if (this.state.formData.datasets.length === 0) {
      isDatasetsInvalid = true;
    }
    if (!this.isValid(this.state.formData.rus)) {
      isRusInvalid = true;
    }
    if (!this.isValid(this.state.formData.non_tech_rus)) {
      isSummaryInvalid = true;
    }
    let isCheckboxesInvalid = this.verifyCheckboxes(isDatasetsInvalid, isRusInvalid, isSummaryInvalid);
    return isDatasetsInvalid || isRusInvalid || isSummaryInvalid || isCheckboxesInvalid;
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

  verifyStep4() {
    let isDAAInvalid = false;
    if (!this.isValid(this.state.file.name) && !this.state.formData.checkCollaborator) {
      this.setState(prev => {
        prev.step4.uploadFile.invalid = true;
        prev.showValidationMessages = true;
        return prev;
      });
      isDAAInvalid = true;
    } else {
      this.setState(prev => {
        prev.step4.uploadFile.invalid = false;
        return prev;
      });
    }
    return isDAAInvalid;
  }

  verifyCheckboxes(isDatasetsInvalid, isRusInvalid, isSummaryInvalid) {
    if (this.state.formData.controls !== true &&
      this.state.formData.population !== true &&
      this.state.formData.diseases !== true &&
      this.state.formData.methods !== true &&
      this.state.formData.hmb !== true &&
      this.state.formData.poa !== true &&
      this.state.formData.other !== true) {
      this.setState(prev => {
        prev.atLeastOneCheckboxChecked = false;
        prev.showValidationMessages = true;
        prev.step2.inputRUS.invalid = isRusInvalid;
        prev.step2.inputNonTechRUS.invalid = isSummaryInvalid;
        prev.step2.inputDatasets.invalid = isDatasetsInvalid;
        return prev;
      });
      return true;
    } else {
      this.setState(prev => {
        prev.atLeastOneCheckboxChecked = true;
        prev.step2.inputRUS.invalid = isRusInvalid;
        prev.step2.inputNonTechRUS.invalid = isSummaryInvalid;
        prev.step2.inputDatasets.invalid = isDatasetsInvalid;
        if (prev.showValidationMessages === false) {
          prev.showValidationMessages = isRusInvalid || isSummaryInvalid || isDatasetsInvalid;
        }
        return prev;
      });
      return false;
    }
  };

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
        let ds = [];
        this.state.formData.datasets.forEach(dataset => {
          ds.push(dataset.value);
        });
        formData.datasetId = ds;
        formData.userId = Storage.getCurrentUser().dacUserId;
        this.setState(prev => {
          prev.disableOkBtn = true;
          return prev;
        });
        DAR.postDAA(this.state.file.name, this.state.file, '').then(response => {
          formData.urlDAA = response.urlDAA;
          formData.nameDAA = response.nameDAA;
          if (formData.dar_code !== undefined && formData.dar_code !== null) {
            DAR.updateDar(formData, formData.dar_code).then(response => {
              this.setState({ showDialogSubmit: false });
              this.props.history.push('researcher_console');
            });
          } else {
            DAR.postDataAccessRequest(formData).then(response => {
              this.setState({ showDialogSubmit: false });
              this.props.history.push('researcher_console');
            }).catch(e =>
              this.setState(prev => {
                prev.problemSavingRequest = true;
                return prev;
              }));
          }
        });
      });
    } else {
      this.setState({ showDialogSubmit: false });
    }
  };

  setShowDialogSave(value) {
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
      let ontologies = [];
      for (let ontology of this.state.formData.ontologies) {
        ontologies.push(ontology.item);
      }
      let datasets = this.state.formData.datasets.map(function(item) {
        return {
          id: item.value,
          concatenation: item.label
        };
      });
      this.setState(prev => {
        prev.formData.datasetId = datasets;
        prev.formData.ontologies = ontologies;
        return prev;
      }, () => this.savePartial());
    } else {
      this.setShowDialogSave(false);
    }
  };

  savePartial() {

    if (this.state.file !== undefined && this.state.file.name !== '') {
      DAR.postDAA(this.state.file.name, this.state.file, '').then(response => {
        this.saveDAR(response);
      });
    } else {
      this.saveDAR(null);
    }
  };

  saveDAR(response) {
    let formData = this.state.formData;
    if (response !== null) {
      formData.urlDAA = response.urlDAA;
      formData.nameDAA = response.nameDAA;
    }
    if (formData.partial_dar_code === null) {
      DAR.postPartialDarRequest(formData).then(resp => {
        this.setShowDialogSave(false);
        this.props.history.push('researcher_console');
      });
    } else {
      DAR.updatePartialDarRequest(formData).then(resp => {
        this.setShowDialogSave(false);
        this.props.history.push({ pathname: 'researcher_console' });
      });
    }
  }


  onOntologiesChange = (data, action) => {
    this.setState(prev => {
      prev.formData.ontologies = data;
      return prev;
    });
  };

  onDatasetsChange = (data, action) => {
    this.setState(prev => {
      prev.formData.datasets = data;
      return prev;
    }, () => this.checkValidations());
  };

  searchDataSets(query, callback) {
    DAR.getAutoCompleteDS(query).then(items => {
      let options = items.map(function(item) {
        return {
          key: item.id,
          value: item.id,
          label: item.concatenation
        };
      });
      callback(options);
    });

  };

  searchOntologies(query, callback) {
    let options = [];
    DAR.getAutoCompleteOT(query).then(
      items => {
        options = items.map(function(item) {
          return {
            key: item.id,
            value: item.id,
            label: item.label,
            item: item
          };
        });
        callback(options);
      });
  };

  back = (e) => {
    this.props.history.goBack();
  };

  render() {

    const {
      orcid = '',
      researcherGate = '',
      othertext = '',
      checkCollaborator = false,
      other = false,
      poa = false,
      hmb = false,
      population = false,
      controls = false,
      methods = false,
      diseases = false,
      linkedIn = '',
      investigator = ''
    } = this.state.formData;

    const { problemSavingRequest, showValidationMessages, atLeastOneCheckboxChecked, step1, step2, step3, step4 } = this.state;

    const genderLabels = ['Female', 'Male'];
    const genderValues = ['F', 'M'];

    const profileUnsubmitted = span({}, [
      'Please submit ',
      h(Link, { to: '/profile', className: 'hover-color' }, ['Your Profile']),
      ' to be able to create a Data Access Request'
    ]);

    const profileSubmitted = span({}, [
      'Please make sure ',
      h(Link, { to: '/profile', className: 'hover-color' }, ['Your Profile']),
      ' is updated, as it will be submited with your DAR Application'
    ]);

    return (

      div({ className: 'container' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
          div({ className: 'row no-margin' }, [
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
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({ disabled: this.state.formData.dar_code !== null }, [

                  div({ isRendered: this.state.completed === false, className: 'rp-alert' }, [
                    Alert({ id: 'profileUnsubmitted', type: 'danger', title: profileUnsubmitted })
                  ]),
                  div({ isRendered: this.state.completed === true, className: 'rp-alert' }, [
                    Alert({ id: 'profileSubmitted', type: 'info', title: profileSubmitted })
                  ]),

                  h3({ className: 'rp-form-title access-color' }, ['1. Researcher Information']),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' }, ['1.1 Researcher*'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      input({
                        type: 'text',
                        name: 'researcher',
                        id: 'inputResearcher',
                        value: this.state.formData.researcher,
                        disabled: true,
                        className: step1.inputResearcher.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                        required: true
                      }),
                      span({
                        isRendered: (step1.inputResearcher.invalid) && (showValidationMessages), className: 'cancel-color required-field-error-span'
                      }, ['Required field'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group checkbox' }, [
                      input({
                        type: 'checkbox',
                        id: 'chk_collaborator',
                        name: 'checkCollaborator',
                        className: 'checkbox-inline rp-checkbox',
                        disabled: this.state.formData.dar_code !== null,
                        checked: checkCollaborator,
                        onChange: this.handleCheckboxChange
                      }),
                      label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'chk_collaborator' },
                        ['I am a collaborator of the PI/Data Custodian for the selected dataset(s)'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '1.2 Researcher Identification',
                        div({ isRendered: this.state.formData.checkCollaborator !== true, className: 'display-inline' }, ['*']),
                        div({ isRendered: this.state.formData.checkCollaborator === true, className: 'display-inline italic' }, [' (optional)']),
                        span({ className: 'default-color' },
                          ['Please authenticate your eRA Commons account. Other profiles are optional:'])
                      ])
                    ]),

                    span({
                      isRendered: showValidationMessages, className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12 cancel-color required-field-error-span'
                    }, ['NIH eRA Authentication is required']),

                    div({ className: 'row no-margin' }, [
                      eRACommons({
                        className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group',
                        destination: 'dar_application',
                        onNihStatusUpdate: this.onNihStatusUpdate,
                        location: this.props.location,
                        validationError: showValidationMessages
                      }),
                      div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group' }, [
                        label({ className: 'control-label' }, ['LinkedIn Profile']),
                        input({
                          type: 'text',
                          name: 'linkedIn',
                          id: 'inputLinkedIn',
                          value: linkedIn,
                          onChange: this.handleChange,
                          disabled: false,
                          className: 'form-control',
                          required: true
                        })
                      ])
                    ]),

                    div({ className: 'row no-margin' }, [
                      div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                        label({ className: 'control-label' }, ['ORCID iD']),
                        input({
                          type: 'text',
                          name: 'orcid',
                          id: 'inputOrcid',
                          value: orcid,
                          onChange: this.handleChange,
                          disabled: false,
                          className: 'form-control',
                          required: true
                        })
                      ]),

                      div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                        label({ className: 'control-label' }, ['ResearchGate ID']),
                        input({
                          type: 'text',
                          name: 'researcherGate',
                          id: 'inputResearcherGate',
                          value: researcherGate,
                          onChange: this.handleChange,
                          disabled: false,
                          className: 'form-control',
                          required: true
                        })
                      ])
                    ])
                  ]),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '1.3 Principal Investigator* ',
                        span({}, ['By typing in the name of the principal investigator, I certify that he or she is aware of this research study.'])
                      ])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      input({
                        type: 'text',
                        name: 'investigator',
                        id: 'inputInvestigator',
                        value: investigator,
                        disabled: true,
                        className: step1.inputInvestigator.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span', isRendered: (step1.inputInvestigator.invalid) && (showValidationMessages)
                      }, ['Required field'])
                    ])
                  ]),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '1.4 Descriptive Title of Project* ',
                        span({}, ['Please note that coordinated requests by collaborating institutions should each use the same title.'])
                      ])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group' }, [
                      input({
                        type: 'text',
                        name: 'projectTitle',
                        id: 'inputTitle',
                        maxLength: '256',
                        value: this.state.formData.projectTitle,
                        onChange: this.handleChange,
                        className: step1.inputTitle.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                        required: true,
                        disabled: this.state.formData.dar_code !== null
                      }),
                      span({ className: 'cancel-color required-field-error-span', isRendered: step1.inputTitle.invalid && showValidationMessages },
                        ['Required field'])
                    ])
                  ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    a({ id: 'btn_next', onClick: this.step2, className: 'btn-primary f-right access-background' }, [
                      'Next Step', span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' })
                    ]),

                    a({
                      id: 'btn_save', isRendered: this.state.formData.dar_code === null, onClick: this.partialSave,
                      className: 'btn-secondary f-right access-color'
                    }, ['Save'])
                  ])
                ])
              ])
            ]),

            div({ isRendered: this.state.step === 2 }, [
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({ disabled: this.state.formData.dar_code !== null }, [

                  h3({ className: 'rp-form-title access-color' }, ['2. Data Access Request']),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '2.1 Select Dataset(s)*',
                        span({},
                          ['Please start typing the Dataset Name, Sample Collection ID, or PI of the dataset(s) for which you would like to request access:'])
                      ])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      h(AsyncSelect, {
                        id: 'sel_datasets',
                        key: this.state.formData.datasets.value,
                        isDisabled: this.state.formData.dar_code !== null,
                        isMulti: true,
                        loadOptions: (query, callback) => this.searchDataSets(query, callback),
                        onChange: (option) => this.onDatasetsChange(option),
                        value: this.state.formData.datasets,
                        noOptionsMessage: () => this.state.optionMessage,
                        loadingMessage: () => this.state.optionMessage,
                        classNamePrefix: 'select',
                        placeholder: 'Dataset Name, Sample Collection ID, or PI',
                        className: step2.inputDatasets.invalid && showValidationMessages ?
                          ' required-select-error select-autocomplete' :
                          'select-autocomplete'

                      }),
                      span({ className: 'cancel-color required-field-error-span', isRendered: step2.inputDatasets.invalid && showValidationMessages },
                        ['Required field'])
                    ])

                  ]),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '2.2 Research use statement (RUS)* ',
                        span({}, [
                          'A RUS is a brief description of the applicant’s proposed use of the dataset(s). The RUS will be reviewed by all parties responsible for data covered by this Data Access Request. Please note that if access is approved, you agree that the RUS, along with your name and institution, will be included on this website to describe your research project to the public.',
                          br(),
                          'Please enter your RUS in the area below. The RUS should be one or two paragraphs in length and include research objectives, the study design, and an analysis plan (including the phenotypic characteristics that will be tested for association with genetic variants). If you are requesting multiple datasets, please describe how you will use them. Examples of RUS can be found at ',
                          a({ target: '_blank', href: 'http://epi.grants.cancer.gov/dac/examples.html' }, ['here'], '.')
                        ])
                      ])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      textarea({
                        value: this.state.formData.rus, onChange: this.handleChange,
                        name: 'rus',
                        id: 'inputRUS',
                        className: step2.inputRUS.invalid && showValidationMessages ? ' required-field-error form-control' : 'form-control',
                        rows: '6',
                        required: true,
                        placeholder: 'Please limit your RUS to 2200 characters.',
                        disabled: this.state.formData.dar_code !== null
                      }),
                      span({ className: 'cancel-color required-field-error-span', isRendered: step2.inputRUS.invalid && showValidationMessages },
                        ['Required field'])
                    ])
                  ]),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '2.3 Non-Technical summary* ',
                        span({}, [
                          'Please enter below a non-technical summary of your RUS suitable for understanding by the general public (written at a high school reading level or below).'
                        ])
                      ])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      textarea({
                        value: this.state.formData.non_tech_rus,
                        onChange: this.handleChange,
                        name: 'non_tech_rus',
                        id: 'inputNonTechRUS',
                        className: step2.inputNonTechRUS.invalid && showValidationMessages ? 'required-field-error form-control' : 'form-control',
                        rows: '3',
                        required: true,
                        placeholder: 'Please limit your non-technical summary to 1100 characters.',
                        disabled: this.state.formData.dar_code !== null
                      }),
                      span(
                        { className: 'cancel-color required-field-error-span', isRendered: step2.inputNonTechRUS.invalid && showValidationMessages },
                        ['Required field'])
                    ])
                  ]),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '2.4 Type of Research* ',
                        span({}, ['Select all applicable options.'])
                      ])
                    ]),
                    div({ className: 'row no-margin' }, [
                      span({
                        className: 'cancel-color required-field-error-span', isRendered: !atLeastOneCheckboxChecked && showValidationMessages,
                        style: { 'marginLeft': '15px' }
                      }, ['At least one of the following fields is required'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      div({ className: 'checkbox' }, [
                        input({
                          checked: diseases,
                          onChange: this.handleCheckboxChange,
                          name: 'diseases',
                          id: 'checkDiseases',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          disabled: (this.state.formData.dar_code !== null)
                        }),
                        label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'checkDiseases' }, [
                          span({}, ['2.4.1 Disease-related studies: ']),
                          'The primary purpose of the research is to learn more about a particular disease or disorder (e.g., type 2 diabetes), a trait (e.g., blood pressure), or a set of related conditions (e.g., autoimmune diseases, psychiatric disorders).'
                        ])
                      ])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      div({ className: 'checkbox' }, [
                        input({
                          checked: methods,
                          onChange: this.handleCheckboxChange,
                          id: 'checkMethods',
                          type: 'checkbox',
                          disabled: (this.state.formData.dar_code !== null),
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods'
                        }),
                        label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'checkMethods' }, [
                          span({}, ['2.4.2 Methods development and validation studies: ']),
                          'The primary purpose of the research is to develop and/or validate new methods for analyzing or interpreting data (e.g., developing more powerful methods to detect epistatic, gene-environment, or other types of complex interactions in genome-wide association studies). Data will be used for developing and/or validating new methods.'
                        ])
                      ])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      div({ className: 'checkbox' }, [
                        input({
                          checked: controls,
                          onChange: this.handleCheckboxChange,
                          id: 'checkControls',
                          type: 'checkbox',
                          disabled: (this.state.formData.dar_code !== null),
                          className: 'checkbox-inline rp-checkbox',
                          name: 'controls'
                        }),
                        label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'checkControls' }, [
                          span({}, ['2.4.3 Controls: ']),
                          'The reason for this request is to increase the number of controls available for a comparison group (e.g., a case-control study).'
                        ])
                      ])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      div({ className: 'checkbox' }, [
                        input({
                          checked: population,
                          onChange: this.handleCheckboxChange,
                          id: 'checkPopulation',
                          type: 'checkbox',
                          disabled: (this.state.formData.dar_code !== null),
                          className: 'checkbox-inline rp-checkbox',
                          name: 'population'
                        }),
                        label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'checkPopulation' }, [
                          span({}, ['2.4.4 Population structure or normal variation studies: ']),
                          'The primary purpose of the research is to understand variation in the general population (e.g., genetic substructure of a population).'
                        ])
                      ])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      div({ className: 'checkbox' }, [
                        input({
                          checked: hmb,
                          onChange: this.handleCheckboxChange,
                          id: 'checkHmb',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'hmb',
                          disabled: (this.state.formData.dar_code !== null)
                        }),
                        label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'checkHmb' }, [
                          span({}, ['2.4.5 Health/medical/biomedical research: ']),
                          'The primary purpose of the study is to investigate a health/medical/biomedical (or biological) phenomenon or condition.'
                        ])
                      ])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      div({ className: 'checkbox' }, [
                        input({
                          checked: poa,
                          onChange: this.handleCheckboxChange,
                          id: 'checkPoa',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'poa',
                          disabled: (this.state.formData.dar_code !== null)
                        }),
                        label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'checkPoa' }, [
                          span({}, ['2.4.6 Population origins or ancestry research: ']),
                          'The outcome of this study is expected to provide new knowledge about the origins of a certain population or its ancestry.'
                        ])
                      ])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      div({ className: 'checkbox' }, [
                        input({
                          checked: other,
                          onChange: this.handleCheckboxChange,
                          id: 'checkOther',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'other',
                          disabled: (this.state.formData.dar_code !== null)
                        }),
                        label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'checkOther' }, [span({}, ['2.4.7 Other:'])])
                      ])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [

                      textarea({
                        value: othertext,
                        onChange: this.handleChange,
                        name: 'othertext',
                        id: 'inputOtherText',
                        maxLength: '512',
                        rows: '2',
                        required: this.state.formData.other,
                        className: step2.inputOther.invalid && this.state.formData.other && showValidationMessages ?
                          ' required-field-error form-control' :
                          'form-control',
                        placeholder: 'Please specify if selected (max. 512 characters)',
                        disabled: this.state.formData.dar_code !== null || this.state.formData.other !== true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: step2.inputOther.invalid && this.state.formData.other && showValidationMessages
                      }, ['Required field'])
                    ])
                  ]),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '2.5 Please state the disease area(s) this study focus on ',
                        span({}, ['Choose any number of Disease Ontology ; or none.'])
                      ])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-last-group' }, [
                      h(AsyncSelect, {
                        id: 'sel_diseases',
                        isDisabled: this.state.formData.dar_code !== null,
                        isMulti: true,
                        loadOptions: (query, callback) => this.searchOntologies(query, callback),
                        onChange: (option) => this.onOntologiesChange(option),
                        value: this.state.formData.ontologies,
                        placeholder: 'Please enter one or more ontologies',
                        className: 'select-autocomplete',
                        classNamePrefix: 'select'
                      })
                    ])
                  ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    a({ id: 'btn_prev', onClick: this.step1, className: 'btn-primary f-left access-background' }, [
                      span({ className: 'glyphicon glyphicon-chevron-left', 'aria-hidden': 'true' }), 'Previous Step'
                    ]),

                    a({ id: 'btn_next', onClick: this.step3, className: 'btn-primary f-right access-background' }, [
                      'Next Step', span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' })
                    ]),

                    a({
                      id: 'btn_save', isRendered: this.state.formData.dar_code === null, onClick: this.partialSave,
                      className: 'btn-secondary f-right access-color'
                    }, ['Save'])
                  ])
                ])
              ])
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

                  h3({ className: 'rp-form-title access-color' }, ['4. Data Use Agreements']),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '4.1 Data Access Agreement',
                        div({ isRendered: this.state.formData.checkCollaborator !== true, className: 'display-inline' }, ['*']),
                        div({ isRendered: this.state.formData.checkCollaborator === true, className: 'display-inline italic' }, [' (optional)'])
                      ])
                    ]),

                    div({ className: 'row no-margin' }, [
                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                        label({ className: 'control-label default-color' },
                          ['1. Download the Data Access Agreement template and have your organization\'s Signing Official sign it'])
                      ]),

                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                        a({
                          id: 'link_downloadAgreement', href: 'BroadDataAccessAgreement.pdf', target: '_blank',
                          className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                        }, [
                          span({ className: 'glyphicon glyphicon-download' }),
                          'Download Agreement Template'
                        ])
                      ]),

                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                        label({ className: 'control-label default-color' },
                          ['2. Upload your template of the Data Access Agreement signed by your organization\'s Signing Official']),
                        p({ className: 'rp-agreement' },
                          ['By uploading and submitting the Data Access Agreement with your Data Access Request application you agree to comply with all terms put forth in the agreement.'])
                      ]),

                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                        div({
                          style: { paddingTop: 7 },
                          className: 'fileUpload col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                        }, [
                          span({ className: 'glyphicon glyphicon-upload' }),
                          'Upload S.O. Signed Agreement',
                          input({ id: 'uploadFile', type: 'file', onChange: this.handleFileChange, className: 'upload', required: true })
                        ])
                      ]),
                      p({ id: 'txt_uploadFile', className: 'fileName daa', isRendered: this.state.file.name !== '' || this.state.formData.nameDAA }, [
                        'Your currently uploaded Data Access Agreement: ',
                        span({ className: 'italic normal' }, [this.state.file.name !== '' ? this.state.file.name : this.state.formData.nameDAA])
                      ]),
                      span({
                        className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12 cancel-color required-field-error-span',
                        isRendered: step4.uploadFile.invalid && showValidationMessages
                      }, ['Required field'])
                    ]),

                    div({ className: 'row no-margin' }, [
                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                        label({ className: 'control-label rp-title-question' }, ['4.2 Attestation Statement'])
                      ]),

                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                        label({ className: 'control-label default-color' }, ['I attest to the following:']),

                        ol({ className: 'rp-agreement rp-last-group' }, [
                          li({}, ['Data will only be used for approved research']),
                          li({},
                            ['Data confidentiality will be protected and the investigator will never make any attempt at "re-identification"']),
                          li({},
                            ['All applicable laws, local institutional policies, and terms and procedures specific to the study’s data access policy will be followed.']),
                          li({}, ['No attempts will be made to identify individual study participants from whom data were obtained.']),
                          li({}, ['Data will not be sold or shared with third parties.']),
                          li({},
                            ['The contributing investigator(s) who conducted the original study and the funding organizations involved in supporting the original study will be acknowledged in publications resulting from the analysis of those data.'])
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
