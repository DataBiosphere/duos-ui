import { Component } from 'react';
import { div, b, span, a, h4, hr, i, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { Votes, Election, Consent, Files } from '../libs/ajax';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Storage } from "../libs/storage";

class DulReview extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
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

  back = () => {
    const user = this.state.currentUser;
    const page = user.isChairPerson ? '/chair_console' :
      user.isMember ? '/member_console' :
        user.isAdmin ? '/admin_console' :
          user.isResearcher ? '/dataset_catalog?reviewProfile' :
            user.isDataOwner ? '/data_owner_console' :
              user.isAlumni ? '/summary_votes' : '/';
    this.props.history.push(page);
<<<<<<< HEAD
  }
=======
  };
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9

  componentDidMount() {
    this.voteInfo();
    this.back = this.back.bind(this);
    this.logVote = this.logVote.bind(this);
    this.setEnableVoteButton = this.setEnableVoteButton.bind(this);
  }

  async voteInfo() {
    const voteId = this.props.match.params.voteId;
    const consentId = this.props.match.params.consentId;

    Votes.find(consentId, voteId).then(
      vote => {
        this.setState({
          voteId: voteId,
          vote: vote
        });
      }
    );

    Election.findElectionByVoteId(voteId).then(
      election => {
        this.setState({
          election: election
        });
      }
    );

    Consent.findConsentById(consentId).then(
      consent => {
        this.setState({
          consent: consent,
          consentName: consent.dulName
        });
      }
    );
  };

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
  };

  async processVote(vote) {
    if (vote.createDate === null) {
      Votes.postVote(this.state.consent.consentId, vote).then(
        data => {
          this.setState({ showConfirmationDialog: true, alertMessage: "Your vote has been successfully logged!" });
        }
      ).catch(error => {
        this.setState({ showConfirmationDialog: true, alertMessage: "Sorry, something went wrong when trying to submit the vote. Please try again." });
      })

    } else {
      Votes.updateVote(this.state.consent.consentId, vote).then(
        data => {
          this.setState({ showConfirmationDialog: true, alertMessage: "Your vote has been successfully edited!" });
        }
      ).catch(error => {
        this.setState({ showConfirmationDialog: true, alertMessage: "Sorry, something went wrong when trying to submit the vote. Please try again." });
      })
    }
  };

  downloadDUL = (e) => {
    Files.getDulFile(this.props.match.params.consentId, this.state.election.dulName);
  };

  confirmationHandlerOK = (answer) => (e) => {
    this.setState({ showConfirmationDialog: false });
    this.back();
  };

  render() {

    const consentData = span({ className: "consent-data" }, [
      b({ isRendered: this.state.consent.groupName, className: "pipe", "ng-bind-html": "consentGroupName", dangerouslySetInnerHTML: { __html: this.state.consent.groupName } }, []),
      this.state.consent.name
    ]);

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "dulReview", imgSrc: "/images/icon_dul.png", iconSize: "medium", color: "dul", title: "Data Use Limitations Congruence Review", description: consentData }),
          ]),

          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({
              id: "btn_back",
              onClick: this.back,
              className: "btn-primary btn-back"
            }, [
                i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
              ])
          ]),
        ]),

        div({ className: "accordion-title dul-color" }, ["Were the data use limitations in the Data Use Letter accurately converted to structured limitations?"]),
        hr({ className: "section-separator" }),
        h4({ className: "hint" }, ["Please review the Data Use Letter and determine if the Data Use Limitations were accurately converted to Structured Limitations"]),

        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Data Use Limitations"]),
            ]),
            div({ id: "panel_dul", className: "panel-body cm-boxbody" }, [
              button({ id: "btn_downloadDataUseLetter", className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
            ])
          ]),

          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Structured Limitations"]),
            ]),
            div({ id: "panel_structuredDul", className: "panel-body cm-boxbody translated-restriction", dangerouslySetInnerHTML: { __html: this.state.consent.translatedUseRestriction } }, [])
          ]),
        ]),

        div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
          div({ className: "jumbotron box-vote dul-background-lighter" }, [
            SubmitVoteBox({
              id: "dulReview",
              color: "dul",
              title: "Were the data use limitations in the Data Use Letter accurately converted to structured limitations?",
              voteStatus: this.state.vote.vote != null ? this.state.vote.vote : null,
              rationale: this.state.vote.rationale == null ? '' : this.state.vote.rationale,
              action: { label: "Vote", handler: this.logVote },
              key: this.state.voteId
            })
          ]),

          ConfirmationDialog({
            isRendered: this.state.showConfirmationDialog,
            showModal: this.state.showConfirmationDialog,
            title: "Vote confirmation",
            color: "dul",
            type: "informative",
            action: { label: "Ok", handler: this.confirmationHandlerOK }
          }, [div({ className: "dialog-description" }, [this.state.alertMessage])])
        ]),
      ])
    );
  }
}

export default DulReview;
