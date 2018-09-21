import { Component } from 'react';
import { div, button, hr, h4, a } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { ApplicationSummaryModal } from '../components/modals/ApplicationSummaryModal';
import { DatasetSummaryModal } from '../components/modals/DatasetSummaryModal';
import { DAR } from '../libs/ajax';
const APPROVE = 0;
const DISAPPROVE = 1;
class DataOwnerReview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      pendingCase: {
        voteId: '',
        referenceId: '',
        dataSetId: ''
      },
      value: '',
      voteStatus: null,
      rationale: '',
      darFields: {
        rus: ''
      },
      isFormDisabled: false
    };

    this.myHandler = this.myHandler.bind(this);
    this.handleOpenApplicationModal = this.handleOpenApplicationModal.bind(this);
    this.handleCloseApplicationModal = this.handleCloseApplicationModal.bind(this);
    this.handleOpenDatasetModal = this.handleOpenDatasetModal.bind(this);
    this.handleCloseDatasetModal = this.handleCloseDatasetModal.bind(this);

    this.openApplication = this.openApplication.bind(this);
    this.closeApplicationSummaryModal = this.closeApplicationSummaryModal.bind(this);
    this.okApplicationSummaryModal = this.okApplicationSummaryModal.bind(this);

    this.openDataset = this.openDataset.bind(this);
    this.closeDatasetSummaryModal = this.closeDatasetSummaryModal.bind(this);
    this.okDatasetSummaryModal = this.okDatasetSummaryModal.bind(this);
    this.submit = this.submit.bind(this);
  }
  componentWillMount () {

    // console.log(this.props.match.params.referenceId);



     this.getDarInfo();
  }

  async getDarInfo() {
    console.log("que onda!?= ", this.state.pendingCase.dataSetId);
    const darRus = await DAR.getDarFields(this.props.match.params.referenceId, 'rus');

    this.setState(prev => {
      prev.darFields.rus = darRus.rus;
      return prev;
    });

    this.setState(prev => {
      prev.pendingCase.voteId = this.props.match.params.voteId;
      prev.pendingCase.referenceId = this.props.match.params.referenceId;
      prev.pendingCase.dataSetId = this.props.match.params.dataSetId;
      return prev;
    });
  }

  myHandler(event) {
    // TBD
  }

  handleOpenApplicationModal() {
    this.setState({showApplicationSummaryModal: true});
  }

  handleOpenDatasetModal() {
    this.setState({showDatasetSummaryModal: true});
  }

  handleCloseApplicationModal() {
    this.setState({showApplicationSummaryModal: false});
  }

  handleCloseDatasetModal() {
    this.setState({showDatasetSummaryModal: false});
  }

  logVote = (e) => {

  };

  openApplication = (e) => {
    this.setState(prev => {
      prev.showApplicationSummaryModal = true;
      return prev;
    });
  };

  openDataset = (e) => {
    this.setState(prev => {
      prev.showDatasetSummaryModal = true;
      return prev;
    });
  };

  closeApplicationSummaryModal() {
    this.setState(prev => {
      prev.showApplicationSummaryModal = false;
      return prev;
    });
  }

  closeDatasetSummaryModal() {
    this.setState(prev => {
      prev.showDatasetSummaryModal = false;
      return prev;
    });
  }

  okApplicationSummaryModal() {
    this.setState(prev => {
      prev.showApplicationSummaryModal = false;
      return prev;
    });
  }

  okDatasetSummaryModal() {
    this.setState(prev => {
      prev.showDatasetSummaryModal = false;
      return prev;
    });
  }

  downloadDUL = (e) => {

  };

  handleRadioChange = (e, field, value) => {
    this.setState(prev => {
      prev[field] = value;
      return prev;
    });
  };

  submit = (answer, rationale) => {
    console.log(answer, " ---- ", rationale);

    switch (answer) {
      case APPROVE: {
        break;
      }
      case DISAPPROVE: {
        break;
      }
      default: {
        break;
      }
    }
  };

  render() {
    return (

      div({className: "container container-wide"}, [
        div({className: "row no-margin"}, [
          div({className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding"}, [
            PageHeading({
              imgSrc: "/images/icon_dataset_review.png",
              iconSize: "large",
              color: "dataset",
              title: "Dataset Access Request Review",
              description: "Should data access be granted to this applicant?"
            }),
          ]),
        ]),
        hr({className: "section-separator"}),

        div({className: "row fsi-row-lg-level fsi-row-md-level no-margin"}, [

          div({className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes"}, [
            div({className: "panel-heading cm-boxhead dataset-color"}, [
              h4({}, ["Research Purpose",
                a({
                  className: "enabled hover-color application-link",
                  onClick: this.openApplication
                }, ["Application summary"]),
              ]),
              ApplicationSummaryModal({
                showModal: this.state.showApplicationSummaryModal,
                onOKRequest: this.okApplicationSummaryModal,
                onCloseRequest: this.closeApplicationSummaryModal
              }),
            ]),
            div({id: "rp", className: "panel-body cm-boxbody"}, [this.state.darFields.rus]),
          ]),

          div({className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes"}, [
            div({className: "panel-heading cm-boxhead dataset-color"}, [
              h4({}, ["Data Use Limitations",
                a({className: "enabled hover-color application-link", onClick: this.openDataset}, ["Dataset summary"]),
              ]),
              DatasetSummaryModal({
                showModal: this.state.showDatasetSummaryModal,
                onOKRequest: this.okDatasetSummaryModal,
                onCloseRequest: this.closeDatasetSummaryModal
              }),
            ]),
            div({id: "dul", className: "panel-body cm-boxbody"}, [
              button({
                className: "col-lg-6 col-md-6 col-sm-8 col-xs-12 btn vote-reminder hover-color",
                onClick: this.downloadDUL
              }, ["Download Data Use Letter"]),
            ]),
            div({id: "adsfasdf", className: "panel-body cm-boxbody"}, [
              button({
                className: "col-lg-6 col-md-6 col-sm-8 col-xs-12 btn vote-reminder hover-color",
                onClick: this.handleRadioChange
              }, ["JJJJJJJJJJJJJJJJJILADA"]),
            ]),
          ]),
        ]),

        div({className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12"}, [
          div({className: "jumbotron box-vote"}, [
            SubmitVoteBox({
              id: "dataOwnerReview",
              color: "dataset",
              title: "Your Vote",
              isDisabled: this.state.isFormDisabled,
              status: this.state.voteStatus,
              radioType: "multiple",
              radioLabels: ['Approve', "Disapprove", "Raise a concern"],
              radioValues: ['1', '0', "2"],
              showAlert: false,
              alertMessage: "something",
              action: {label: "Vote", handler: this.submit
              }
            }),
          ]),
        ]),
      ])
    );
  }
}

export default DataOwnerReview;

