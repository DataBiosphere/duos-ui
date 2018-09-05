import { Component } from 'react';
import { div, button, hr, label, h2, small, h3, input, form, span } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';

class ResearcherReview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      formData: {
        academicEmail: 'academicEmail',
        address1: 'address1',
        address2: 'address2',
        city: 'city',
        country: 'country',
        department: 'department',
        division: 'division',
        eRACommonsID: 'eRACommonsID',
        havePI: true,
        havePIValue: 'havePIValue',
        institution: 'institution',
        isThePI: true,
        piEmail: 'piEmail',
        piName: 'piName',
        piValue: 'piValue',
        profileName: 'profileName',
        pubmedID: 'pubmedID',
        scientificURL: 'scientificURL',
        state: 'state',
        zipcode: 'zipcode',
        status: null,
      }
    }

  }

  setEnableVoteButton = (event, name, value) => {
    // TBD
  }

  render() {

    const { formData } = this.state;

    return (

      // div({ className: "container " }, [
      //   div({ className: "row no-margin" }, [
      //     div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
      //       PageHeading({ id: "researcherReview", color: "common", title: "Researcher Review", description: "Should this user be classified as Bonafide Researcher?" }),
      //     ]),
      //   ]),
      //   hr({ className: "section-separator" }),
      //   button({}, ["Click Me!"])
      // ])

      div({ className: "container" }, [
        div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          h2({ className: "cm-title common-color" }, [
            div({ id: "dacUser" }, ["Researcher review"]),
            small({}, ["Should this user be classified as Bonafide Researcher?"]),
          ]),
          hr({ className: "section-separator" }),

          div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [

            div({ className: "jumbotron box-vote" }, [
              h3({ className: "cm-results-subtitle common-color" }, ["Your vote"]),
              hr({ className: "box-separator" }),
              form({ className: "form-horizontal", id: "voteForm" }, [

                div({ className: "form-group first-form-group" }, [
                  label({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label common-color" }, ["Vote"]),
                  div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [

                    // div({ className: "radio-inline" }, [
                    //   input({ type: "radio", "value": "status", value: "approved", onClick: this.setEnableVoteButton, className: "regular-radio", id: "bonafidePositive", name: "bonafideVote" }),
                    //   label({ htmlFor: "bonafidePositive" }, []),
                    //   label({ htmlFor: "bonafidePositive", className: "radio-button-text" }, ["Yes"]),

                    //   input({ type: "radio", "value": "status", value: "rejected", onClick: this.setEnableVoteButton, className: "regular-radio", id: "bonafideNegative", name: "bonafideVote" }),
                    //   label({ htmlFor: "bonafideNegative" }, []),
                    //   label({ htmlFor: "bonafideNegative", className: "radio-button-text" }, ["No"]),
                    // ]),
                    YesNoRadioGroup({ value: this.state.formData.status, onChange: this.setEnableVoteButton, name: 'bonafideVote' }),
                  ]),

                ]),

                div({ className: "form-group" }, [
                  span({ isRendered: "status === 'approved'" }, [
                    label({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label common-color" }, ["Comments"]),
                  ]),

                  span({ isRendered: "status !== 'approved'" }, [
                    label({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label common-color" }, ["Rationale"]),
                  ]),
                  div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                    input({
                      type: "text", name: "inputRationale", "value": "rationale", onChange: this.setEnableVoteButton, className: "form-control col-lg-10 col-md-8 col-sm-6 col-xs-6 vote-input",
                      placeholder: "Describe here your rationale or comments (be as specific as possible)."
                    }),
                  ]),
                  div({ className: "form-group form-group-bottom" }, [
                    div({ className: "col-lg-3 col-lg-offset-9 col-md-3 col-md-offset-9 col-sm-6 col-sm-offset-6 col-xs-6 col-xs-offset-6" }, [
                      button({ "ng-disabled": "enableVoteButton === false", onClick: this.logStatus, className: "btn btn-primary col-lg-12 col-md-12 col-sm-12 col-xs-12 vote-button common-background" }, [
                        "Vote"
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),

          div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding" }, [
            form({ name: "researcherForm", noValidate: true }, [

              div({ className: "row form-group" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                  label({ className: "control-label" }, ["Full Name"]),
                  div({ className: "control-data", name: "profileName", id: "profileName" }, [formData.profileName]),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                  label({ className: "control-label" }, ["Academic/Business Email Address"]),
                  div({ className: "control-data", name: "profileAcademicEmail", id: "profileAcademicEmail" }, [formData.academicEmail]),
                ]),
              ]),

              div({ className: "row" }, [
                div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12" }, [
                  label({ className: "control-label" }, ["Institution Name"]),
                  div({ className: "control-data", name: "profileInstitution", id: "profileInstitution" }, [formData.institution]),
                ]),
                div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12" }, [
                  label({ className: "control-label" }, ["Department"]),
                  div({ className: "control-data", name: "profileDepartment", id: "profileDepartment" }, [formData.department]),
                ]),
                div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12" }, [
                  label({ className: "control-label" }, ["Division"]),
                  div({ className: "control-data", name: "profileDivision", id: "profileDivision" }, [formData.division]),
                ]),
              ]),

              div({ className: "row" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                  label({ className: "control-label" }, ["Street Address 1"]),
                  div({ className: "control-data", name: "profileAddress1", id: "profileAddress1" }, [formData.address1]),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                  label({ className: "control-label" }, ["Street Address 2"]),
                  div({ className: "control-data", name: "profileAddress2", id: "profileAddress2" }, [formData.address2]),
                ]),
              ]),

              div({ className: "row" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                  label({ className: "control-label" }, ["City"]),
                  div({ className: "control-data", name: "profileCity", id: "profileCity" }, [formData.city]),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                  label({ className: "control-label" }, ["State"]),
                  div({ className: "control-data", name: "profileState", id: "profileState" }, [formData.state]),
                ]),
              ]),

              div({ className: "row" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                  label({ className: "control-label" }, ["Zip/Postal Code"]),
                  div({ className: "control-data", name: "profileZip", id: "profileZip" }, [formData.zipcode]),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                  label({ className: "control-label" }, ["Country"]),
                  div({ className: "control-data", name: "profileCountry", id: "profileCountry" }, [formData.country]),
                ]),
              ]),

              div({ className: "row" }, [
                div({ className: "col-xs-12 " + (formData.isThePI === true ? 'col-lg-12 col-md-12 col-sm-12' : 'col-lg-6 col-md-6 col-sm-6') }, [
                  label({ className: "control-label" }, ["Is this researcher the Principal Investigator?"]),
                  div({ className: "control-data" }, [formData.piValue]),
                ]),

                div({ isRendered: formData.isThePI === false }, [
                  div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                    label({ className: "control-label" }, ["Does the resercher have a Principal Investigator?"]),
                    div({ className: "control-data", id: "researcherhavePI" }, [formData.havePIValue]),
                  ]),
                ]),
              ]),

              div({ className: "row", isRendered: formData.havePI === true }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Principal Investigator Name"]),
                  div({ className: "control-data", name: "profilePIName", id: "profilePIName" }, [formData.piName]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Principal Investigator Email Address"]),
                  div({ className: "control-data", name: "profilePIEmail", id: "profilePIEmail" }, [formData.piEmail]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["eRA Commons ID"]),
                  div({ className: "control-data", name: "profileEraCommons" }, [formData.eRACommonsID]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Pubmed ID of a publication"]),
                  div({ className: "control-data", name: "profilePubmedID" }, [formData.pubmedID]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["URL of a scientific publication"]),
                  div({ className: "control-data", name: "profileScientificURL" }, [formData.scientificURL]),
                ]),
              ]),

              div({ className: "row", isRendered: formData.isThePI === true || formData.havePI === false }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["eRA Commons ID"]),
                  div({ className: "control-data", name: "profileEraCommons" }, [formData.eRACommonsID]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Pubmed ID of a publication"]),
                  div({ className: "control-data", name: "profilePubmedID" }, [formData.pubmedID]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["URL of a scientific publication"]),
                  div({ className: "control-data", name: "profileScientificURL" }, [formData.scientificURL]),
                ]),
              ]),
            ]),
          ])

        ]),
      ])
    );
  }
}

export default ResearcherReview;

