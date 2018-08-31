import { Component } from 'react';
import { div, b, span, a, h4, hr, i } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { ElectionPanel } from '../components/ElectionPanel';
import { SubmitVoteBox } from '../components/SubmitVoteBox';

class DulReview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      currentUser: {},
      enableVoteButton: false,
      voteStatus: '1'
    }

    this.setEnableVoteButton = this.setEnableVoteButton.bind(this);
  }

  componentWillMount() {
    this.setState(prev => {
      prev.currentUser = {
        roles: [
          { name: 'MEMBER' },
          { name: 'ADMIN' },
        ]
      };
      return prev;
    });
  }

  setEnableVoteButton() {
    console.log('----------setEnableVoteButton----------');
    this.setState(prev => {
      prev.enableVoteButton = true;
      return prev;
    });
  }


  logVote = () => {
    console.log('----------logVote----------');
  }

  downloadDUL = () => {
    console.log('----------downloadDUL----------');
  }

  setEnableVoteButton = () => {
    console.log('----------setEnableVoteButton----------');
  }

  render() {

    let consentSDul = 'consentSDul';
    let consentName = 'ORSP-124';
    let consentGroupName = 'OD-256: Jackson / HS-08-000245';

    const consentData = span({ className: "consent-data" }, [
      b({ isRendered: consentGroupName, className: "pipe", "ng-bind-html": "consentGroupName" }, [consentGroupName]),
      consentName
    ]);

    let userRoles = {
      member: 'MEMBER',
      chairperson: "CHAIRPERSON"
    }

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "dulReview", imgSrc: "/images/icon_dul.png", iconSize: "medium", color: "dul", title: "Data Use Limitations Congruence Review", description: consentData }),
          ]),

          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            this.state.currentUser.roles.map((rol, rIndex) => {
              return (
                a({ id: "btn_back", href: "/user_console", isRendered: rol.name === userRoles.member, className: "btn vote-button vote-button-back vote-button-bigger" }, [
                  i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
                ])
              );
            }),
            this.state.currentUser.roles.map((rol, rIndex) => {
              return (
                a({ id: "btn_back", href: "/chair_console", isRendered: rol.name === userRoles.chairperson, className: "btn vote-button vote-button-back vote-button-bigger" }, [
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
          ElectionPanel({
            id: "dulPanel",
            color: "dul",
            title: "Data Use Limitations",
            action: { label: "Download Data Use Letter", handler: this.submit }
          }),
          ElectionPanel({
            id: "sdulPanel",
            color: "dul",
            title: "Structured Limitations",
            class: "translated-restriction",
            content: consentSDul,
            action: ""
          }),
        ]),

        div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
          div({ className: "jumbotron box-vote dul-background-lighter" }, [
            SubmitVoteBox({
              id: "dulReview",
              color: "dul",
              title: "Were the data use limitations in the Data Use Letter accurately converted to structured limitations?",
              isDisabled: "isFormDisabled",
              voteStatus: this.state.voteStatus,
              action: { label: "Vote", handler: this.submit }
            }),
          ]),
        ]),
      ])
    );
  }
}

export default DulReview;
