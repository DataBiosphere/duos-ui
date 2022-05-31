import { Component } from 'react';
import { div, hr, h4, a, span } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitTriVoteBox } from '../components/SubmitTriVoteBox';
import { ApplicationSummaryModal } from '../components/modals/ApplicationSummaryModal';
import { DatasetSummaryModal } from '../components/modals/DatasetSummaryModal';
import { DAR, DataSet, Consent, Votes } from '../libs/ajax';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import datasetReviewIcon from '../images/icon_dataset_review.png';

const APPROVE = '1';
const DISAPPROVE = '0';
const HAS_CONCERNS = '2';

class DataOwnerReview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showConfirmDialog: false,
      pendingCase: {
        voteId: '',
        referenceId: '',
        dataSetId: ''
      },
      value: '',
      vote: {
        dacUserId: '',
        voteId: '',
        vote: null,
        rationale: '',
        hasConcerns: false,
        createDate: null
      },
      darFields: {
        rus: ''
      },
      dataSet: {
        id: '',
        data: {}
      },
      consent: {
        id: '',
        data: {}
      },
      showError: false,
      alertMessage: '',
    };

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
    this.submitVote = this.submitVote.bind(this);
    this.getDarInfo = this.getDarInfo.bind(this);
    this.getConsentInfo = this.getConsentInfo.bind(this);
    this.getVote = this.getVote.bind(this);
  }

  async componentDidMount() {
    await this.getDarInfo();
    await this.getVote();
    await this.getDataSetInfo();
    await this.getConsentInfo();
  }

  async getDarInfo() {
    const dar = await DAR.describeDar(this.props.match.params.referenceId);
    this.setState(prev => {
      prev.darFields.rus = dar.rus;
      prev.pendingCase.voteId = this.props.match.params.voteId;
      prev.pendingCase.referenceId = this.props.match.params.referenceId;
      prev.pendingCase.dataSetId = this.props.match.params.dataSetId;
      return prev;
    });
  }

  async getDataSetInfo() {
    const dataSet = await DataSet.getDataSetsByDatasetId(this.state.pendingCase.dataSetId);
    this.setState(prev => {
      prev.dataSet.id = dataSet.consentId;
      prev.dataSet.data = dataSet;
      return prev;
    });
  }

  async getConsentInfo() {
    const consent = await Consent.findConsentById(this.state.dataSet.data.consentId);
    this.setState(prev => {
      prev.consent.id = consent.consentId;
      prev.consent.data = consent;
      return prev;
    });
  }

  async getVote() {
    if (this.props.match.params.voteId !== null && Boolean(this.props.match.params.referenceId)) {
      const pendingCaseReview = await Votes.getDarVote(this.props.match.params.referenceId, this.props.match.params.voteId);
      this.setState(prev => {
        prev.vote.dacUserId = pendingCaseReview.dacUserId;
        prev.vote.voteId = pendingCaseReview.voteId;
        prev.vote.vote = pendingCaseReview.vote === null ? undefined : pendingCaseReview.vote;
        prev.vote.hasConcerns = pendingCaseReview.hasConcerns;
        prev.vote.rationale = pendingCaseReview.rationale === null ? '' : pendingCaseReview.rationale;
        prev.vote.createDate = pendingCaseReview.createDate;
        prev.pendingCase.referenceId = this.props.match.params.referenceId;
        return prev;
      });
    }
  }

  handleOpenApplicationModal() {
    this.setState({ showApplicationSummaryModal: true });
  }

  handleOpenDatasetModal() {
    this.setState({ showDatasetSummaryModal: true });
  }

  handleCloseApplicationModal() {
    this.setState({ showApplicationSummaryModal: false });
  }

  handleCloseDatasetModal() {
    this.setState({ showDatasetSummaryModal: false });
  }

  openApplication = () => {
    this.setState(prev => {
      prev.showApplicationSummaryModal = true;
      return prev;
    });
  };

  openDataset = () => {
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
  dialogHandlerCreate = () => () => {
    this.setState(prev => {
      prev.showConfirmDialog = false;
      return prev;
    }
    );
    this.props.history.goBack();
  };

  async submitVote(answer, rationale) {
    let updatedVote = {};

    switch (answer) {
      case (APPROVE): {
        updatedVote.vote = true;
        updatedVote.hasConcerns = false;
        break;
      }
      case DISAPPROVE: {
        updatedVote.vote = false;
        updatedVote.hasConcerns = false;
        break;
      }
      case HAS_CONCERNS: {
        updatedVote.vote = null;
        updatedVote.hasConcerns = true;
        break;
      }
      default: {
        break;
      }
    }
    updatedVote.rationale = rationale;
    updatedVote.voteId = this.state.vote.voteId;
    updatedVote.dacUserId = this.state.vote.dacUserId;
    if ((updatedVote.vote !== this.state.vote.vote) ||
      (updatedVote.rationale !== this.state.vote.rationale) ||
      (updatedVote.hasConcerns !== this.state.vote.hasConcerns)) {
      if (this.state.vote.createDate === null) {
        Votes.postDarVote(this.state.pendingCase.referenceId, updatedVote).then(
          () => {
            this.setState({ showConfirmDialog:true, showError:false, alertMessage: 'Your vote has been successfully logged!'});
          }
        ).catch(() => {
          this.setState({showError:true});
        });
      } else {
        Votes.updateDarVote(this.state.pendingCase.referenceId, updatedVote).then(
          () => {
            this.setState({ showConfirmDialog:true, showError:false, alertMessage: 'Your vote has been successfully edited!'});
          }
        ).catch(() => {
          this.setState({showError:true});
        });
      }
    }
  }

  fixValue = (value) => {
    let newValue = undefined;

    if (value === true) {
      newValue = '1';
    }

    if (value === false) {
      newValue = '0';
    }

    if (value === undefined && this.state.vote.hasConcerns) {
      newValue = '2';
    }

    return newValue;
  };

  render() {

    return (

      div({ className: 'container container-wide' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding' }, [
            PageHeading({ id: 'dataOwnerReview', imgSrc: datasetReviewIcon, iconSize: 'large', color: 'dataset', title: 'Dataset Access Request Review', description: 'Should data access be granted to this applicant?' }),
          ]),
        ]),
        hr({ className: 'section-separator' }),

        div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [

          div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
            div({ className: 'panel-heading cm-boxhead dataset-color' }, [
              h4({}, ['Research Purpose',
                a({
                  className: 'enabled hover-color application-link',
                  onClick: this.openApplication
                }, ['Application summary']),
              ]),
              ApplicationSummaryModal({
                dataRequestId: this.props.match.params.referenceId,
                showModal: this.state.showApplicationSummaryModal,
                onOKRequest: this.okApplicationSummaryModal,
                onCloseRequest: this.closeApplicationSummaryModal
              }),
            ]),
            div({ id: 'rp', className: 'panel-body cm-boxbody' }, [this.state.darFields.rus]),
          ]),

          div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
            div({ className: 'panel-heading cm-boxhead dataset-color' }, [
              h4({}, ['Data Use Limitations',
                a({ className: 'enabled hover-color application-link', onClick: this.openDataset }, ['Dataset summary']),
              ]),
              DatasetSummaryModal({
                isRendered: this.state.showDatasetSummaryModal,
                dataSetId: this.props.match.params.dataSetId,
                showModal: this.state.showDatasetSummaryModal,
                onOKRequest: this.okDatasetSummaryModal,
                onCloseRequest: this.closeDatasetSummaryModal
              })
            ])
          ])
        ]),

        div({ className: 'col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12' }, [
          div({ className: 'jumbotron box-vote' }, [
            SubmitTriVoteBox({
              id: 'dataOwnerReview',
              color: 'dataset',
              title: 'Your Vote',
              isDisabled: this.state.isFormDisabled,
              voteStatus: this.fixValue(this.state.vote.vote),
              radioType: 'multiple',
              radioLabels: ['Approve', 'Disapprove', 'Raise a concern'],
              radioValues: ['1', '0', '2'],
              showAlert: this.state.showError,
              alertMessage: 'Error updating vote.',
              rationale: this.state.vote.rationale,
              action: { label: 'Vote', handler: this.submitVote },
              key: this.state.vote.voteId
            }),
          ]),
        ]),
        ConfirmationDialog({
          title: 'Vote confirmation',
          color: 'dataset',
          showModal: this.state.showConfirmDialog,
          type: 'informative',
          action: {
            label: 'Ok',
            handler: this.dialogHandlerCreate
          }
        }, [
          div({className: 'dialog-description'}, [span({}, [this.state.alertMessage]),
          ])
        ]),
      ])
    );
  }
}

export default DataOwnerReview;
