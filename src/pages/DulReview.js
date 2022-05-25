import { Component } from 'react';
import { div, b, span, a, h4, hr, i, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { Votes, Election, Consent } from '../libs/ajax';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Storage } from '../libs/storage';
import { Navigation } from '../libs/utils';
import TranslatedDULComponent from '../components/TranslatedDULComponent';
import dulIcon from '../images/icon_dul.png';

class DulReview extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
    this.voteInfo = this.voteInfo.bind(this);
  }

  initialState() {
    let currentUser = Storage.getCurrentUser();
    return {
      currentUser: currentUser,
      showConfirmationDialog: false,
      enableVoteButton: false,
      consent: {},
      election: {},
      vote: {},
      voteId: null,
    };
  }

  async componentDidMount() {
    await this.voteInfo();
    this.logVote = this.logVote.bind(this);
    this.setEnableVoteButton = this.setEnableVoteButton.bind(this);
  }

  async voteInfo() {
    const voteId = this.props.match.params.voteId;
    const consentId = this.props.match.params.consentId;

    const votesPromise = Votes.find(consentId, voteId);
    const electionPromise = Election.findElectionByVoteId(voteId);
    const consentPromise = Consent.findConsentById(consentId);

    const [votes, elections, consent] = await Promise.all([votesPromise, electionPromise, consentPromise]);

    this.setState( prev => {
      prev.votes = votes;
      prev.elections = elections;
      prev.consent = consent;
      prev.consentName = consent.dulName;
      return prev;
    });
  }

  setEnableVoteButton() {
    this.setState(prev => {
      prev.enableVoteButton = true;
      return prev;
    });
  }

  logVote(vote, rationale) {
    let voteToUpdate = this.state.vote;
    voteToUpdate.vote = vote;
    voteToUpdate.rationale = rationale;
    this.processVote(voteToUpdate);
  }

  async processVote(vote) {
    if (vote.createDate === null) {
      Votes.postVote(this.state.consent.consentId, vote).then(
        () => {
          this.setState({ showConfirmationDialog: true, alertMessage: 'Your vote has been successfully logged!' });
        }
      ).catch(() => {
        this.setState({ showConfirmationDialog: true, alertMessage: 'Sorry, something went wrong when trying to submit the vote. Please try again.' });
      });

    } else {
      Votes.updateVote(this.state.consent.consentId, vote).then(
        () => {
          this.setState({ showConfirmationDialog: true, alertMessage: 'Your vote has been successfully edited!' });
        }
      ).catch(() => {
        this.setState({ showConfirmationDialog: true, alertMessage: 'Sorry, something went wrong when trying to submit the vote. Please try again.' });
      });
    }
  }

  confirmationHandlerOK = () => () => {
    this.setState({ showConfirmationDialog: false });
    Navigation.back(this.state.currentUser, this.props.history);
  };

  render() {

    const consentData = span({ className: 'consent-data' }, [
      b({ isRendered: this.state.consent.groupName, className: 'pipe', 'ng-bind-html': 'consentGroupName', dangerouslySetInnerHTML: { __html: this.state.consent.groupName } }, []),
      this.state.consent.name
    ]);

    return (

      div({ className: 'container container-wide' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding' }, [
            PageHeading({ id: 'dulReview', imgSrc: dulIcon, iconSize: 'medium', color: 'dul', title: 'Data Use Limitations Congruence Review', description: consentData }),
          ]),

          div({ className: 'col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding' }, [
            a({
              id: 'btn_back',
              onClick: () => Navigation.back(this.state.currentUser, this.props.history),
              className: 'btn-primary btn-back'
            }, [
              i({ className: 'glyphicon glyphicon-chevron-left' }), 'Back'
            ])
          ]),
        ]),

        div({ className: 'accordion-title dul-color' }, ['Were the data use limitations in the Data Use Letter accurately converted to structured limitations?']),
        hr({ className: 'section-separator' }),
        h4({ className: 'hint' }, ['Please review the Data Use Letter and determine if the Data Use Limitations were accurately converted to Structured Limitations']),
        h(TranslatedDULComponent, {restrictions: this.state.consent.dataUse, isDUL: true}),
        div({ className: 'col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12' }, [
          div({ className: 'jumbotron box-vote dul-background-lighter' }, [
            SubmitVoteBox({
              id: 'dulReview',
              color: 'dul',
              title: 'Were the data use limitations in the Data Use Letter accurately converted to structured limitations?',
              voteStatus: this.state.vote.vote != null ? this.state.vote.vote : null,
              rationale: this.state.vote.rationale == null ? '' : this.state.vote.rationale,
              action: { label: 'Vote', handler: this.logVote },
              key: this.state.voteId
            })
          ]),

          ConfirmationDialog({
            isRendered: this.state.showConfirmationDialog,
            showModal: this.state.showConfirmationDialog,
            title: 'Vote confirmation',
            color: 'dul',
            type: 'informative',
            action: { label: 'Ok', handler: this.confirmationHandlerOK }
          }, [div({ className: 'dialog-description' }, [this.state.alertMessage])])
        ]),
      ])
    );
  }
}

export default DulReview;
