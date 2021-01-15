import { Page, Document, StyleSheet, View, PDFViewer, Text, Font } from '@react-pdf/renderer';
import {h} from 'react-hyperscript-helpers';
import {DataUseTranslation} from '../libs/dataUseTranslation';
import isEmpty from 'lodash/fp/isEmpty';

const styles = StyleSheet.create({
  page: {
    margin: 50
  },
  header: {
    fontSize: 25,
    fontWeight: 600,
    textAlign: "center",
    marginBottom: 30
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 20
  },
  smLabel: {
    fontSize: 15,
    fontWeight: 800,
    marginBottom: 10,
    marginRight: 30,
    width: 200
  },
  text: {
    fontSize: 13
  },
  twoColumnText: {
    fontSize: 13,
    width: 250
  },
  listItem: {
    fontSize: 13,
    marginBottom: 10
  },
  flexboxContainer: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 30
  },
  listContainer: {
    width: "100%"
  },
  label: {
    marginBottom: 10,
    fontSize: 15
  },
  section: {
    marginBottom: 20
  }
});

const SmallLabelTextComponent = (props) => {
  const {label, text, style = {}} = props;
  return h(View, {style}, [
    h(Text, {style: styles.smLabel}, [label]),
    h(Text, {style: styles.twoColumnText}, [text || "N/A"])
  ]);
};

const LabelListComponent = (props) => {
  const {list} = props;
  let textList = list.map((item) => {
    const {description, manualReview} = item;
    const manualReviewStatement = manualReview ? ' Requires manual review.' : '';
    return h(Text, {style: styles.listItem}, [description + manualReviewStatement]);
  });

  if(isEmpty(textList)) {
    textList = [h(Text, {style: styles.listItem}, ["N/A"])];
  }
  const label = h(Text, {style: styles.label}, [props.label]);
  const result = h(View, {style: styles.section}, [label, ...textList]);
  return result;
};

const StandardLabelTextComponent = (props) => {
  const {statement, label} = props;
  return h(View, {style: styles.section}, [
    h(Text, {style: styles.label}, [label]),
    h(Text, {style: styles.text}, [statement || "N/A"])
  ]);
};

const ApprovalSection = (props => {
  const {irb, collaborator} = props;
  return h(View, {style: styles.section}, [
    h(Text, {style: styles.label}, ["Approvals"]),
    h(Text, {style: styles.text}, [`IRB Approval: ${isEmpty(irb) ? "Yes" : "No"}`]),
    h(Text, {style: styles.text}, [`Letter of Collaboration Given: ${isEmpty(collaborator) ? "Yes" : "No"}`])
  ]);
});

export default function ApplicationDownloadLink(props) {
  const {darInfo, researcherProfile} = props;
  const datasets = props.datasets.map((dataset) => {
    const namePropertyObj = dataset.properties.find((property) =>  property.propertyName === "Dataset Name");
    //using {description: value} so it can be listed via LabelListComponent
    return {description: namePropertyObj.propertyValue};
  });
  const translatedSRPs = DataUseTranslation.translateDarInfo(darInfo);

  const getCollaborators = (darInfo, key) => {
    const collaborators = darInfo[key];
    if(!isEmpty(collaborators)) {
      return collaborators.map((collaborator) => {
        return collaborator.name;
      }).join(', ');
    } else {
      return '---';
    }
  };

  const internalCollaborators = getCollaborators(darInfo, 'internalCollaborators');
  const externalCollaborators = getCollaborators(darInfo, 'externalCollaborators');
  const labCollaborators = getCollaborators(darInfo, 'labCollaborators');

  return h(PDFViewer, {width: 1800, height: 800}, [
    h(Document, {style: styles.page}, [
      h(Page, {}, [ //Researcher Info Page
        h(View, {style: styles.page}, [
          h(Text, {style: styles.header}, [`${darInfo.darCode} Application`]),
          h(Text, {style: styles.subHeader}, ["Applicant Information"]),
          h(View, {style: styles.flexboxContainer}, [
            h(SmallLabelTextComponent, {label: "NIH eRA Commons ID", text: researcherProfile.nihUsername, style:{marginRight: 30}}),
            h(SmallLabelTextComponent, {label: "LinkedIn Profile", text: researcherProfile.linkedIn})
          ]),
          h(View, {style: styles.flexboxContainer}, [
            h(SmallLabelTextComponent, {label: "ORC ID", text: researcherProfile.orcid, style:{marginRight: 30}}),
            h(SmallLabelTextComponent, {label: "ResearcherGate ID", text: researcherProfile.orcid}),
          ]),
          h(View, {style: styles.flexboxContainer}, [
            h(SmallLabelTextComponent, {label: "Researcher", text: researcherProfile.profileName, style:{marginRight: 30}}),
            h(SmallLabelTextComponent, {label: "Principal Investigator", text: `${researcherProfile.isThePI ? researcherProfile.profileName : researcherProfile.piName}`})
          ]),
          h(View, {style: styles.flexboxContainer}, [
            h(SmallLabelTextComponent, {label: "Institution", text: researcherProfile.institution, style:{marginRight: 30}}),
            h(SmallLabelTextComponent, {label: "Department", text: researcherProfile.department})
          ]),
          h(View, {style: styles.flexboxContainer}, [
            h(SmallLabelTextComponent, {label: "Location", text: `${researcherProfile.city}, ${researcherProfile.state}\n${researcherProfile.country}`,
              style:{marginRight: 30}
            }),
            h(SmallLabelTextComponent, {label: "Researcher Email", text: researcherProfile.academicEmail}),
          ]),
          h(View, {style: styles.flexboxContainer}, [
            h(SmallLabelTextComponent, {label: "Signing Official", text: darInfo.signingOfficial, style:{marginRight: 30}}),
            h(SmallLabelTextComponent, {label: "IT Director", text: darInfo.itDirector})
          ]),
          h(SmallLabelTextComponent, {label: 'Lab Staff Collaborators', text: labCollaborators, style: {marginBottom: 20}}),
          h(SmallLabelTextComponent, {label: 'Internal Collaborators', text: internalCollaborators, style: {marginBottom: 20}}),
          h(SmallLabelTextComponent, {label: 'External Collaborators', text: externalCollaborators, style: {marginBottom: 20}})
        ])
      ]),
      h(Page, {}, [ //Data Use Request Page
        h(View, {style: styles.page}, [
          h(Text, {style: styles.subHeader}, ['Data Access Request']),
          h(StandardLabelTextComponent, {label: 'Project Title', text: darInfo.projectTitle}),
          h(LabelListComponent, {label: 'Datasets Requested', list: datasets}),
          h(LabelListComponent, {label: "Primary Structured Research Purposes", list: translatedSRPs.primary}),
          h(LabelListComponent, {label: "Secondary Structured Research Purposes", list: translatedSRPs.secondary}),
          h(ApprovalSection, {irb: darInfo.irbDocumentLocation, collaborator: darInfo.collaborationLetterLocation}),
          h(StandardLabelTextComponent, {label: "Research Use Statement", text: darInfo.rus}),
          h(StandardLabelTextComponent, {label: "Non-Technical Research Use Statement", text: darInfo.nonTechRus})
        ])
      ])
    ])
  ]);
};
