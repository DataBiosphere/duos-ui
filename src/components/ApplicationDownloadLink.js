import { Page, Document, StyleSheet, View, /*PDFViewer*/ PDFDownloadLink, Text} from '@react-pdf/renderer';
import {h, span, i} from 'react-hyperscript-helpers';
import {DataUseTranslation} from '../libs/dataUseTranslation';
import {isNil, isEmpty} from 'lodash/fp';
import { Theme } from '../libs/theme';
import {useEffect, useState} from 'react';

const styles = StyleSheet.create({
  page: {
    padding: 50
  },
  header: {
    fontSize: 25,
    fontWeight: 600,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 23,
    fontWeight: 800,
    marginBottom: 20,
    marginTop: 40
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
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 30
  },
  listContainer: {
    width: '100%'
  },
  label: {
    marginBottom: 10,
    fontSize: 16
  },
  section: {
    marginBottom: 20
  },
});

const iconStyle = {
  marginRight: '0.5rem'
};

const CloudUseSection = (props) => {
  const {cloudUse, localUse, anvilUse, cloudProvider, cloudProviderType, cloudProviderDescription} = props;
  return h(View, {isRendered: cloudUse || localUse || anvilUse}, [
    h(Text, {style: styles.label}, ['Cloud Use Statements']),
    h(View, {style: styles.section}, [
      h(Text, {style: styles.text, isRendered: anvilUse}, ['All data storage and analysis for this project will be performed on the AnVIL']),
      h(Text, {style: styles.text, isRendered: cloudUse}, ['Requested permission to use cloud computing to carry out research']),
      h(Text, {style: styles.text, isRendered: localUse}, ['Requested permission to use local computing to carry out research'])
    ]),
    h(View, {style: styles.flexboxContainer, isRendered: cloudUse}, [
      h(SmallLabelTextComponent, {text: cloudProvider, label: 'Cloud Provider', style: {marginRight: 30}}),
      h(SmallLabelTextComponent, {text: cloudProviderType, label : 'Cloud Provider Type'}),
    ]),
    h(SmallLabelTextComponent, {text: cloudProviderDescription, label: 'Cloud Provider Description', isRendered: cloudUse}),
  ]);
};

const SmallLabelTextComponent = (props) => {
  const {label, text, style = {}} = props;
  return h(View, {style}, [
    h(Text, {style: styles.smLabel}, [label]),
    h(Text, {style: styles.twoColumnText}, [text || 'N/A'])
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
    textList = [h(Text, {style: styles.listItem}, ['N/A'])];
  }
  const label = h(Text, {style: styles.label}, [props.label]);
  const result = h(View, {style: styles.section}, [label, ...textList]);
  return result;
};

const StandardLabelTextComponent = (props) => {
  const {text, label} = props;
  return h(View, {style: styles.section}, [
    h(Text, {style: styles.label}, [label]),
    h(Text, {style: styles.text}, [text || 'N/A'])
  ]);
};

const ApprovalSection = (props => {
  const {irb, collaborator} = props;
  return h(View, {style: styles.section}, [
    h(Text, {style: styles.label}, ['Approvals']),
    h(Text, {style: styles.text}, [`IRB Approval: ${isEmpty(irb) ? 'Yes' : 'No'}`]),
    h(Text, {style: styles.text}, [`Letter of Collaboration Given: ${isEmpty(collaborator) ? 'Yes' : 'No'}`])
  ]);
});

export default function ApplicationDownloadLink(props) {
  const [institution, setInstitution] = useState('- -');
  const {darInfo, researcherProfile} = props;
  const {cloudUse, localUse, anvilUse, cloudProvider, cloudProviderType, cloudProviderDescription} = darInfo;
  const datasets = props.datasets.map((dataset) => {
    if(!isNil(dataset.properties)) {
      const namePropertyObj = dataset.properties.find(
        (property) => property.propertyName === 'Dataset Name'
      );
      //using {description: value} so it can be listed via LabelListComponent
      return { description: namePropertyObj.propertyValue };
    } else {
      return { description: dataset.name};
    }
  });
  const translatedSRPs = DataUseTranslation.translateDarInfo(darInfo);

  useEffect(() => {
    if (!isNil(researcherProfile) && !isNil(researcherProfile.institution)) {
      setInstitution(researcherProfile.institution.name);
    }
  }, [researcherProfile]);


  const getCollaborators = (darInfo, key) => {
    const collaborators = darInfo[key];
    if (!isEmpty(collaborators)) {
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

  // Use PDFViewer during development to see changes to the document immediately
  // return h(PDFViewer, {width: 1800, height: 800}, [
  const document = h(Document, {}, [
    h(Page, {style: styles.page}, [ //Researcher Info Page
      h(View, {}, [
        h(Text, {style: styles.header}, [`${darInfo.darCode} Application`]),
        h(Text, {style: styles.subHeader}, ['Applicant Information']),
        h(View, {style: styles.flexboxContainer}, [
          h(SmallLabelTextComponent, {
            label: 'Researcher',
            text: researcherProfile.displayName,
            style: {marginRight: 30}
          }),
          h(SmallLabelTextComponent, {label: 'Institution', text: `${institution}`}),
        ]),
        h(View, {style: styles.flexboxContainer}, [
          h(SmallLabelTextComponent, {
            label: 'NIH eRA Commons ID',
            text: `${researcherProfile.eraCommonsId}`,
            style: {marginRight: 30}
          }),
        ]),
        h(View, {style: styles.flexboxContainer}, [
          h(SmallLabelTextComponent, {
            label: 'Signing Official',
            text: darInfo.signingOfficial,
            style: {marginRight: 30}
          }),
          h(SmallLabelTextComponent, {label: 'IT Director', text: darInfo.itDirector})
        ]),
        h(SmallLabelTextComponent, {
          label: 'Lab Staff Collaborators',
          text: labCollaborators,
          style: {marginBottom: 20}
        }),
        h(SmallLabelTextComponent, {
          label: 'Internal Collaborators',
          text: internalCollaborators,
          style: {marginBottom: 20}
        }),
        h(SmallLabelTextComponent, {
          label: 'External Collaborators',
          text: externalCollaborators,
          style: {marginBottom: 20}
        }),
        h(CloudUseSection, {cloudUse, localUse, anvilUse, cloudProvider, cloudProviderType, cloudProviderDescription})
      ]),
      h(View, {}, [
        h(Text, {style: styles.subHeader}, ['Data Access Request']),
        h(StandardLabelTextComponent, {label: 'Project Title', text: darInfo.projectTitle}),
        h(LabelListComponent, {label: 'Datasets Requested', list: datasets}),
        h(LabelListComponent, {label: 'Primary Structured Research Purposes', list: translatedSRPs.primary}),
        h(LabelListComponent, {label: 'Secondary Structured Research Purposes', list: translatedSRPs.secondary}),
        h(ApprovalSection, {irb: darInfo.irbDocumentLocation, collaborator: darInfo.collaborationLetterLocation}),
        h(StandardLabelTextComponent, {label: 'Research Use Statement', text: darInfo.rus}),
        h(StandardLabelTextComponent, {label: 'Non-Technical Research Use Statement', text: darInfo.nonTechRus})
      ])
    ])
  ]);

  return h(PDFDownloadLink, {fileName: `${darInfo.darCode}_Application_PDF`, document}, [
    span({style: {fontSize: Theme.font.size.subheader}}, [
      i({className: 'glyphicon glyphicon-download-alt', style: iconStyle}),
      'Full Application'
    ])
  ]);
}
