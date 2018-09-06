import { Component } from 'react';
import { div, button, i, span, b, a, h4 } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { Election, Files } from '../libs/ajax';

class DulPreview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      consentPreview: {}
    };
    this.electionReview();
    this.back = this.back.bind(this);
    this.electionReview = this.electionReview.bind(this);
    this.downloadDUL = this.downloadDUL.bind(this);
  }

  back() {
    this.props.history.goBack();
  }

  async electionReview() {
    const consentId = this.props.match.params.consentId;
    const consent = await Election.electionReviewResource(consentId, 'TranslateDUL');
    this.setState({consentPreview: consent.consent});
  }

  componentWillMount() {
    this.mockState();
    this.setState(prev => {
      prev.currentUser = {
        roles: [
          { name: 'CHAIRPERSON' },
          { name: 'ADMIN' },
        ]
      };
      return prev;
    });
  }

  mockState() {
    this.setState(prev => {
      prev.consentGroupName = 'GroupName 01';
      prev.consentName = 'ORSP-124';
      return prev;
    });
  }

  download = (e) => {
    const filename = e.target.getAttribute('filename');
    const value = e.target.getAttribute('value');
    console.log('------------download-------------', filename, value);
 };

  downloadDUL = () => {
    Files.getDulFile(this.props.match.params.consentId).then(
      blob => {
        if (blob.size !== 0) {
          this.createBlobFile(this.state.consentPreview.name, blob);
        }
      }
    );
  };


  render() {

    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe" }, [this.state.consentPreview.groupName]),
      this.state.consentPreview.name
    ]);

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({
              id: "previewDul",
              imgSrc: "/images/icon_dul.png",
              iconSize: "medium",
              color: "dul",
              title: "Data Use Limitations Congruence Preview",
              description: consentData
            }),
          ]),
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({
              id: "btn_back",
              onClick: this.back,
              className: "btn vote-button vote-button-back vote-button-bigger" }, [
              i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
            ])
          ]),
        ]),

        div({ className: "accordion-title dul-color" },
          ["Were the data use limitations in the Data Use Letter accurately converted to structured limitations?"]),

        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Data Use Limitations"]),
            ]),
            div({
              id: "panel_dul",
              className: "panel-body cm-boxbody" }, [
              button({
                className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color",
                onClick: () => this.downloadDUL()
              }, ["Download Data Use Letter"]),
            ])
          ]),

          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Structured Limitations"]),
            ]),
            div({ id: "panel_structuredDul", className: "panel-body cm-boxbody translated-restriction" }, [this.state.consentPreview.translatedUseRestriction])
          ]),
        ]),
      ])
    );
  }
}

export default DulPreview;

