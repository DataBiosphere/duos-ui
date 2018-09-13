import { Component } from 'react';
import { div, hr, label, form } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { User, Researcher } from "../libs/ajax";

class ResearcherReview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      rationale: '',
      status: '',
      enableVoteButton: false,
      voteStatus: null,
      formData: {
        academicEmail: '',
        address1: '',
        address2: '',
        city: '',
        country: '',
        department: '',
        division: '',
        eRACommonsID: '',
        havePI: false,
        havePIValue: '',
        institution: '',
        isThePI: false,
        piEmail: '',
        piName: '',
        piValue: '',
        profileName: '',
        pubmedID: '',
        scientificURL: '',
        state: '',
        zipcode: '',
        status: null,
      }
    }
    this.findUserStatus = this.findUserStatus.bind(this);
    this.findPropertiesByResearcher = this.findPropertiesByResearcher.bind(this);
  }

  componentWillMount() {
    this.findUserStatus();
    this.findPropertiesByResearcher();
  }

  async findPropertiesByResearcher() {
    Researcher.list(this.props.match.params.dacUserId).then(
      data => {
        if (data.isThePI !== undefined) {
          data.isThePI = JSON.parse(data.isThePI);
          data.piValue = data.isThePI === true ? data.piValue = 'Yes' : data.piValue = 'No';
        }
        if (data.havePI !== undefined) {
          data.havePI = JSON.parse(data.havePI);
          data.havePIValue = data.havePI === true ? 'Yes' : data.havePIValue = 'No';
        }
        this.setState(prev => {
          prev.formData = data
          return prev;
        });
      }).catch(error => {
        console.error('Error getting researcher details:', error);
      });;
  }
  async findUserStatus() {
    User.findUserStatus(this.props.match.params.dacUserId).then(
      data => {
        let status = null;
        if (data.status === 'approved') {
          status = true;
        } else if (data.status === 'rejected') {
          status = false;
        }
        this.setState(prev => {
          prev.rationale = data.rationale;
          prev.status = status;
          prev.voteStatus = status || status === null ? '1' : '0';
          return prev;
        });
      });
  }

  render() {
    const { formData } = this.state;
    return (
      div({ className: "container " }, [
        div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          PageHeading({ id: "researcherReview", color: "common", title: "Researcher Review", description: "Should this user be classified as Bonafide Researcher?" }),
          hr({ className: "section-separator" }),
        ]),

        div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
          div({ className: "jumbotron box-vote" }, [
            SubmitVoteBox({
              voteStatus: this.state.voteStatus,
              rationale: this.state.rationale,
              status: this.state.status,
              id: "researcherReview",
              color: "common",
              title: "Your Vote",
              showAlert: false,
              alertMessage: "something!",
              action: { label: "Vote", handler: this.submit }
            }),
          ]),
        ]),

        div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding" }, [
          form({ name: "researcherForm", noValidate: true }, [
            div({ className: "row no-margin form-group" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Full Name"]),
                div({ id: "lbl_profileName", className: "control-data", name: "profileName" }, [formData.profileName]),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Academic/Business Email Address"]),
                div({ id: "lbl_profileAcademicEmail", className: "control-data", name: "profileAcademicEmail" }, [formData.academicEmail]),
              ]),
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12" }, [
                label({ className: "control-label" }, ["Institution Name"]),
                div({ id: "lbl_profileInstitution", className: "control-data", name: "profileInstitution" }, [formData.institution]),
              ]),
              div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12" }, [
                label({ className: "control-label" }, ["Department"]),
                div({ id: "lbl_profileDepartment", className: "control-data", name: "profileDepartment" }, [formData.department]),
              ]),
              div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12" }, [
                label({ className: "control-label" }, ["Division"]),
                div({ id: "lbl_profileDivision", className: "control-data", name: "profileDivision" }, [formData.division]),
              ]),
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Street Address 1"]),
                div({ id: "lbl_profileAddress1", className: "control-data", name: "profileAddress1" }, [formData.address1]),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Street Address 2"]),
                div({ id: "lbl_profileAddress2", className: "control-data", name: "profileAddress2" }, [formData.address2]),
              ]),
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["City"]),
                div({ className: "control-data", name: "profileCity", id: "profileCity" }, [formData.city]),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["State"]),
                div({ id: "lbl_profileState", className: "control-data", name: "profileState" }, [formData.state]),
              ]),
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Zip/Postal Code"]),
                div({ id: "lbl_profileZip", className: "control-data", name: "profileZip" }, [formData.zipcode]),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Country"]),
                div({ id: "lbl_profileCountry", className: "control-data", name: "profileCountry" }, [formData.country]),
              ]),
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-xs-12 " + (formData.isThePI === true ? 'col-lg-12 col-md-12 col-sm-12' : 'col-lg-6 col-md-6 col-sm-6') }, [
                label({ className: "control-label" }, ["Is this researcher the Principal Investigator?"]),
                div({ id: "lbl_researcherIsPI", className: "control-data" }, [formData.piValue]),
              ]),

              div({ isRendered: formData.isThePI === false }, [
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                  label({ className: "control-label" }, ["Does the resercher have a Principal Investigator?"]),
                  div({ id: "lbl_researcherhavePI", className: "control-data" }, [formData.havePIValue]),
                ]),
              ]),
            ]),

            div({ className: "row no-margin", isRendered: formData.havePI === true }, [
              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["Principal Investigator Name"]),
                div({ id: "lbl_profilePIName", className: "control-data", name: "profilePIName" }, [formData.piName]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["Principal Investigator Email Address"]),
                div({ id: "lbl_profilePIEmail", className: "control-data", name: "profilePIEmail" }, [formData.piEmail]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["eRA Commons ID"]),
                div({ id: "lbl_profileEraCommons", className: "control-data", name: "profileEraCommons" }, [formData.eRACommonsID]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["Pubmed ID of a publication"]),
                div({ id: "lbl_profilePubmedId", className: "control-data", name: "profilePubmedID" }, [formData.pubmedID]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["URL of a scientific publication"]),
                div({ id: "lbl_profileScientificURL", className: "control-data", name: "profileScientificURL" }, [formData.scientificURL]),
              ]),
            ]),

            div({ className: "row no-margin", isRendered: formData.isThePI === true || formData.havePI === false }, [
              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["eRA Commons ID"]),
                div({ id: "lbl_profileEraCommons", className: "control-data", name: "profileEraCommons" }, [formData.eRACommonsID]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["Pubmed ID of a publication"]),
                div({ id: "lbl_profilePubmedId", className: "control-data", name: "profilePubmedID" }, [formData.pubmedID]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["URL of a scientific publication"]),
                div({ id: "lbl_profileScientificURL", className: "control-data", name: "profileScientificURL" }, [formData.scientificURL]),
              ]),
            ]),
          ]),
        ])

      ])
    );
  }
}

export default ResearcherReview;

