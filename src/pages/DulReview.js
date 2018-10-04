import { Component } from 'react';
import { div, b, span, a, h4, hr, i, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { Votes, Election, Consent, Files } from '../libs/ajax';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Storage } from "../libs/storage";

class DulReview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showConfirmationDialog: false,
      loading: true,
      value: '',
      currentUser: {},
      enableVoteButton: false,
      consent: {},
      election: {},
      vote: {vote: '', rational: null}
    };
    this.logVote = this.logVote.bind(this);
    this.setEnableVoteButton = this.setEnableVoteButton.bind(this);
  }

  componentDidMount() {
    this.setState(prev => {
      prev.currentUser = Storage.getCurrentUser();
      return prev;
    });
    this.voteInfo();
  }

  async voteInfo() {
    let vote = await Votes.find(this.props.match.params.consentId, this.props.match.params.voteId);
    let election = await Election.findElectionByVoteId(this.props.match.params.voteId);
    let consent = await Consent.findConsentById(this.props.match.params.consentId);
    this.setState(prev => { 
      prev.vote = vote; 
      prev.loading = false;
      prev.election = election; 
      prev.consent = consent;
      return prev;
    });
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
    if(vote.createDate === null){
      Votes.postVote(this.state.consent.consentId, vote).then( 
        data => {
          this.setState({ showConfirmationDialog: true, alertMessage: "Your vote has been successfully logged!" });
        }
      ).catch(error => {
          this.setState({ showConfirmationDialog: true, alertMessage: "Sorry, something went wrong when trying to submit the vote. Please try again." });
      })

    } else  {
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
    Files.getDulFile(this.props.match.params.consentId, this.state.consentName);
  };

  confirmationHandlerOK = (answer) => (e) => {
    this.setState({ showConfirmationDialog: false });
    this.props.history.goBack();
  };

  render() {

    if (this.state.loading) { return LoadingIndicator(); }

    const consentData = span({ className: "consent-data" }, [
      b({ isRendered: this.state.consent.groupName, className: "pipe", "ng-bind-html": "consentGroupName", dangerouslySetInnerHTML: { __html: this.state.consent.groupName } }, []),
      this.state.consent.name
    ]);

    let userRoles = {
      member: 'MEMBER',
      chairperson: "CHAIRPERSON"
    };

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "dulReview", imgSrc: "/images/icon_dul.png", iconSize: "medium", color: "dul", title: "Data Use Limitations Congruence Review", description: consentData }),
          ]),

          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            this.state.currentUser.roles.map(rol => {
              return (
                a({ id: "btn_back", key: rol, href: "/user_console", isRendered: rol.name === userRoles.member, className: "btn-primary btn-back" }, [
                  i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
                ])
              );
            }),
            this.state.currentUser.roles.map(rol => {
              return (
                a({ id: "btn_back", key: rol, href: "/chair_console", isRendered: rol.name === userRoles.chairperson, className: "btn-primary btn-back" }, [
                  i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
                ])
              );
            }),
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
            div({ id: "panel_structuredDul", className: "panel-body cm-boxbody translated-restriction",  dangerouslySetInnerHTML: { __html: this.state.consent.translatedUseRestriction }}, [])
          ]),
        ]),

        div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
          div({ className: "jumbotron box-vote dul-background-lighter" }, [
            SubmitVoteBox({
              id: "dulReview",
              color: "dul",
              title: "Were the data use limitations in the Data Use Letter accurately converted to structured limitations?",
              voteStatus: this.state.vote.vote,
              rationale: this.state.vote.rationale,
              action: { label: "Vote", handler: this.logVote }
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
