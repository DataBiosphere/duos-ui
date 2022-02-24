import { Component } from 'react';
import { div, hh, label, form, textarea } from 'react-hyperscript-helpers';
import {getPropertyValuesFromUser} from "../libs/utils";
import {isNil} from "lodash/fp";
import { isEmpty } from 'lodash';

export const ResearcherReview = hh(class ResearcherReview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      user: {},
      institution: {},
      formData: {
        academicEmail: '',
        address1: '',
        address2: '',
        city: '',
        country: '',
        department: '',
        division: '',
        eRACommonsID: '',
        eraCommonsId: '',
        linkedIn: '',
        orcid: '',
        researcherGate: '',
        havePI: false,
        institution: '',
        isThePI: false,
        piEmail: '',
        piName: '',
        profileName: '',
        pubmedID: '',
        scientificURL: '',
        state: '',
        zipcode: ''
      },
    };
  }

  async componentDidMount() {
    await this.findResearcherInfo();
  }

  findResearcherInfo = async () => {
    const user = this.props.user;
    let researcherProps = getPropertyValuesFromUser(user);
    this.setState(prev => {
      prev.user = user;
      prev.institution = !isEmpty(user.institution) ?  user.institution : null;
      prev.formData = researcherProps;
      return prev;
    });
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.user !== prevProps.user) {
      this.setState({
        user: this.props.user
      });
    }
  }

  render() {
    const { formData, user, institution } = this.state;

    return (
      div({ className: "container " }, [
        div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding" }, [
          form({ name: "researcherForm", noValidate: true }, [
            div({ className: "row form-group margin-top-20" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Full Name"]),
                div({ id: "lbl_profileName", className: "control-data", name: "profileName", readOnly: true }, [user.displayName])
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Academic/Business Email Address"]),
                div({ id: "lbl_profileAcademicEmail", className: "control-data", name: "profileAcademicEmail", readOnly: true}, [formData.academicEmail]),
              ])
            ]),

            div({ className: "row margin-top-20" }, [
              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label rp-title-question default-color" }, ["Researcher Identification"])
              ])
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["NIH User Name"]),
                div({ id: "lbl_profileeraCommonsId", className: "control-data", name: "profileeraCommonsId",  readOnly: true}, [formData.eraCommonsId]),
              ]),

              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["LinkedIn Profile"]),
                div({ id: "lbl_profileLinkedIn", className: "control-data", name: "profileLinkedIn", readOnly: true}, [formData.linkedIn]),
              ])
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["ORCID iD"]),
                div({ id: "lbl_profileOrcid", className: "control-data", name: "profileOrcid", readOnly: true}, [formData.orcid]),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["ResearchGate ID"]),
                div({ id: "lbl_profileResearcherGate", className: "control-data", name: "profileResearcherGate", readOnly: true}, [formData.researcherGate]),
              ])
            ]),

            div({ className: "row margin-top-20" }, [
              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["Institution Name"]),
                div({ id: "lbl_profileInstitution", className: "control-data", name: "profileInstitution", readOnly: true}, [isNil(institution) ? '' : institution.name]),
              ])
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Department"]),
                div({ id: "lbl_profileDepartment", className: "control-data", name: "profileDepartment", readOnly: true}, [formData.department]),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Division"]),
                div({ id: "lbl_profileDivision", className: "control-data", name: "profileDivision", readOnly: true}, [formData.division]),
              ])
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Street Address 1"]),
                div({ id: "lbl_profileAddress1", className: "control-data", name: "profileAddress1", readOnly: true}, [formData.address1]),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Street Address 2"]),
                div({ id: "lbl_profileAddress2", className: "control-data", name: "profileAddress2", readOnly: true}, [formData.address2]),
              ])
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["City"]),
                div({ className: "control-data", name: "profileCity", id: "profileCity", readOnly: true}, [formData.city]),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["State"]),
                div({ id: "lbl_profileState", className: "control-data", name: "profileState", readOnly: true}, [formData.state]),
              ])
            ]),

            div({ className: "row no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Zip/Postal Code"]),
                div({ id: "lbl_profileZip", className: "control-data", name: "profileZip", readOnly: true}, [formData.zipcode]),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                label({ className: "control-label" }, ["Country"]),
                div({ id: "lbl_profileCountry", className: "control-data", name: "profileCountry", readOnly: true}, [formData.country]),
              ])
            ]),

            div({ className: "row margin-top-20" }, [
              div({ className: "col-xs-12 " + (formData.isThePI === true ? 'col-lg-12 col-md-12 col-sm-12' : 'col-lg-6 col-md-6 col-sm-6') }, [
                label({ className: "control-label" }, ["Is this researcher the Principal Investigator?"]),
                div({ id: "lbl_researcherIsPI", className: "control-data" }, [formData.isThePI === true ? "Yes" : "No"]),
              ]),

              div({ isRendered: formData.isThePI === false }, [
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                  label({ className: "control-label" }, ["Does the researcher have a Principal Investigator?"]),
                  div({ id: "lbl_researcherhavePI", className: "control-data", readOnly: true}, [formData.havePI === true ? "Yes" : "No"]),
                ])
              ])
            ]),

            div({ className: "row no-margin", isRendered: formData.havePI === true }, [
              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["Principal Investigator Name"]),
                div({ id: "lbl_profilePIName", className: "control-data", name: "profilePIName", readOnly: true}, [formData.piName]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["Principal Investigator Email Address"]),
                div({ id: "lbl_profilePIEmail", className: "control-data", name: "profilePIEmail", readOnly: true}, [formData.piEmail]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["eRA Commons ID"]),
                div({ id: "lbl_profileEraCommons", className: "control-data", name: "profileEraCommons", readOnly: true}, [formData.eraCommonsId]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["Pubmed ID of a publication"]),
                div({ id: "lbl_profilePubmedId", className: "control-data", name: "profilePubmedID", readOnly: true}, [formData.pubmedID]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["URL of a scientific publication"]),
                textarea({
                  value: [formData.scientificURL],
                  readOnly: true,
                  name: "profileScientificURL",
                  id: "lbl_profileScientificURL",
                  className: "control-data textarea",
                  maxLength: "512"
                })
              ])
            ]),

            div({ className: "row no-margin", isRendered: formData.isThePI === true || formData.havePI === false }, [
              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["Pubmed ID of a publication"]),
                div({ id: "lbl_profilePubmedId", className: "control-data", name: "profilePubmedID", readOnly: true}, [formData.pubmedID]),
              ]),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                label({ className: "control-label" }, ["URL of a scientific publication"]),
                textarea({
                  value: [formData.scientificURL],
                  name: "profileScientificURL",
                  id: "lbl_profileScientificURL",
                  className: "control-data textarea",
                  maxLength: "512",
                  readOnly: true
                })
              ])
            ])
          ])
        ]),
      ])
    );
  }
});

export default ResearcherReview;
