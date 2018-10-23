import { Component, Fragment } from 'react';
import { div, button, i, span, b, a, hr, h4, h3, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { Election, Files, Email } from '../libs/ajax';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Storage } from '../libs/storage';

class DulCollect extends Component {

  constructor(props) {
    super(props);
    this.back = this.back.bind(this);
    this.state = this.initialState();
    this.handlerReminder = this.handlerReminder(this);
  };

  back() {
    this.props.history.goBack();
  };

  async componentDidMount() {
    const consentId = this.props.match.params.consentId;
    let election = await Election.electionReviewResource(consentId, 'TranslateDUL');
    this.setGraphData(election.reviewVote);
    this.setState(prev => {
      prev.loading = false;
      prev.dulVoteList = this.chunk(election.reviewVote, 2);
      prev.consentGroupName = election.consent.groupName;
      prev.consentName = election.consent.name;
      prev.dulName = election.consent.dulName;
      prev.translatedUseRestriction = election.election.translatedUseRestriction;
      prev.projectTitle = election.election.projectTitle;
      prev.finalVote = election.election.finalVote;
      prev.finalRationale = election.election.finalRationale;
      prev.finalVoteDate = election.election.finalVoteDate;
      prev.election = election.election;
      return prev;
    });
  
  };

  chunk(arr, size) {
    let newArr = [];
    for (let i = 0; i < arr.length; i += size) {
      newArr.push(arr.slice(i, i + size));
    }
    return newArr;
  };

  initialState() {
    return {
      buttonDisabled: false,
      loading: true,
      isFormDisabled: true,
      showConfirmationDialogOK: false,
      dialogTitle: 'Email Notification Sent.',
      showDialogReminder: false,
      isReminderSent: false,
      createDate: '',
      hasUseRestriction: Boolean,
      projectTitle: '',
      consentName: '',
      translatedUseRestriction: '',
      consentGroupName: null,
      finalVote: '',
      finalRationale: '',
      finalVoteDate: '',
      dulVoteList: [],
      chartData: [
        ['Results', 'Votes'],
        ['Yes', 0],
        ['No', 0],
        ['Pending', 0]
      ]
    };
  };


  downloadDUL = (e) => {
    Files.getDulFile(this.props.match.params.consentId, this.state.dulName);
  };


  handlerReminder = (e) => (voteId) => {
    this.setState(prev => {
      prev.buttonDisabled = true;
      return prev;
    });
    this.sendReminder(voteId).then(reminder => {
      this.setState(prev => {
        prev.showDialogReminder = true;
        prev.isReminderSent = true;
        prev.buttonDisabled = false;
        return prev;
      });
    }).catch(error => {
      this.setState(prev => {
        prev.showDialogReminder = true;
        prev.isReminderSent = false;
        prev.dialogTitle = 'Email Notification Error.';
        return prev;
      });
    })
  };

  async sendReminder(voteId) {
    return await Email.sendReminderEmail(voteId);
  };

  dialogHandlerReminder = (answer) => (e) => {
    this.setState({ showDialogReminder: false });
  };

  dulCollect = (vote, rationale) => {
    this.setState(
      prev => {
        prev.showConfirmationDialogOK = true;
        prev.finalVote = vote;
        prev.finalRationale = rationale;
        return prev;
      }
    );
  };

  confirmationHandlerOK = (answer) => async (e) => {
    if (answer === true) {
      let election = this.state.election;
      election.status = 'Closed';
      election.finalVote = this.state.finalVote;
      election.finalRationale = this.state.finalRationale;
      await Election.updateElection(election.electionId, election);
      this.setState(prev => {
        prev.showConfirmationDialogOK = false;
        return prev;
      });
      this.props.history.goBack();
    } else {
      this.setState(prev => {
        prev.showConfirmationDialogOK = false;
        return prev;
      });
    }
  };

    setGraphData(votes) {
      var yes = 0, no = 0, empty = 0;
      for (var i = 0; i < votes.length; i++) {
        switch (votes[i].vote.vote) {
          case true:
            yes++;
            break;
          case false:
            no++;
            break;
          default:
            empty++;
            break;
        }
      }
      this.setState(prev => {
        prev.isFormDisabled = empty === 0 ? false : true;
        prev.chartData = [
          ['Results', 'Votes'],
          ['Yes', yes],
          ['No', no],
          ['Pending', empty]
        ];
        return prev;
      });
    };


    render() {

      if (this.state.loading) { return LoadingIndicator(); }

      const consentData = span({ className: "consent-data" }, [
        b({ isRendered: this.state.consentGroupName, className: "pipe", dangerouslySetInnerHTML: { __html: this.state.consentGroupName } }, []),
        this.state.consentName
      ]);

      return (

        div({ className: "container container-wide" }, [
          div({ className: "row no-margin" }, [
            div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
              PageHeading({ id: "collectDul", imgSrc: "/images/icon_dul.png", iconSize: "medium", color: "dul", title: "Collect votes for Data Use Limitations Congruence Review", description: consentData }),
            ]),
            div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
              a({ id: "btn_back", onClick: () => this.back(), className: "btn-primary btn-back" }, [
                i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
              ])
            ]),
          ]),

          ConfirmationDialog({
            title: this.state.dialogTitle, color: 'dul', showModal: this.state.showDialogReminder, type: "informative", action: { label: "Ok", handler: this.dialogHandlerReminder }
          }, [
              div({ className: "dialog-description" }, [
                span({ isRendered: this.state.isReminderSent === true }, ["The reminder was successfully sent."]),
                span({ isRendered: this.state.isReminderSent === false }, ["The reminder couldn't be sent. Please contact Support."]),
              ]),
            ]),
          div({ className: "accordion-title dul-color" }, ["Were the data use limitations in the Data Use Letter accurately converted to structured limitations?"]),

          hr({ className: "section-separator", style: { 'marginTop': '0' } }),
          h4({ className: "hint" }, ["Please review the Data Use Letter, Structured Limitations, and DAC votes to determine if the Data Use Limitations were appropriately converted to Structured Limitations"]),

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
              div({ id: "panel_structuredDul", className: "panel-body cm-boxbody translated-restriction", dangerouslySetInnerHTML: { __html: this.state.translatedUseRestriction } }, [])
            ]),
          ]),

          //-----

          div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
            CollectResultBox({
              id: "dulCollectResult",
              title: "Vote Results",
              color: "dul",
              type: "stats",
              class: "col-lg-4 col-md-4 col-sm-12 col-xs-12",
              chartData: this.state.chartData
            }),

            div({ className: "col-lg-8 col-md-8 col-sm-12 col-xs-12 jumbotron box-vote-results dul-background-lighter" }, [
              SubmitVoteBox({
                id: "dulCollect",
                color: "dul",
                title: "Were the data use limitations in the Data Use Letter accurately converted to structured limitations?",
                isDisabled: this.state.isFormDisabled || !Storage.getCurrentUser().isChairPerson,
                voteStatus: this.state.finalVote,
                rationale: this.state.finalRationale,
                action: { label: "Vote", handler: this.dulCollect }
              }),
            ]),
            ConfirmationDialog({
              title: "Post Final Vote?", color: 'dul', showModal: this.state.showConfirmationDialogOK,
              action: { label: "Yes", handler: this.confirmationHandlerOK }
            }, [
                div({ className: "dialog-description" }, [
                  span({}, ["If you post this vote the Election will be closed with current results."]),
                ]),
              ]),
          ]),

          h3({ className: "cm-subtitle" }, ["Data Access Committee Votes"]),

          this.state.dulVoteList.map((row, rIndex) => {
            return h(Fragment, { key: rIndex }, [
              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                row.map((vm, vIndex) => {
                  return h(Fragment, { key: vIndex }, [
                    SingleResultBox({
                      id: "dulSingleResult_" + vIndex,
                      color: "dul",
                      data: vm,
                      buttonDisabled: this.state.buttonDisabled,
                      handler: this.handlerReminder
                    })
                  ]);
                })
              ]),
            ]);
          })

        ])
      );
    }
  }

  export default DulCollect;

