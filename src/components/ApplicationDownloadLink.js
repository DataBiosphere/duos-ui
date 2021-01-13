import { Page, Document, StyleSheet, View, PDFViewer, Text } from '@react-pdf/renderer';
import { useState, useEffect } from 'react';
import {h} from 'react-hyperscript-helpers';
import { getDatasets } from '../pages/DataAccessRequestApplication';
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

const LabelTextComponent = (props) => {
  const {label, text} = props;
  return h(View, {}, [
    h(Text, {style: styles.smLabel}, [label]),
    h(Text, {style: styles.text}, [text || "N/A"])
  ]);
};

const LabelListComponent = (props) => {
  const {list} = props;
  const textList = list.map((item) => {
    const {description, manualReview} = item;
    const manualReviewStatement = manualReview ? ' Requires manual review.' : '';
    return h(Text, {style: styles.listItem}, [description + manualReviewStatement]);
  });
  const label = h(Text, {style: styles.label, isRendered: !isEmpty(list)}, [props.label]);
  const result = h(View, {}, [label, ...textList]);
  return result;
};

const StandardLabelTextComponent = (props) => {
  const {statement, label} = props;
  return h(View, {style: styles.section}, [
    h(Text, {style: styles.label}, [label]),
    h(Text, {style: styles.text}, [statement || "N/A"])
  ]);
};

export default function ApplicationDownloadLink(props) {
  const {darInfo, researcherProfile} = props;
  const [translatedSRPs, setTranslatedSRPs] = useState(DataUseTranslation.translateDarInfo(darInfo));
  const [isLoading, setIsLoading] = useState(true);
  const [datasets, setDatasets] = useState();

  useEffect(() => {
    const init = async() => {
      setTranslatedSRPs(DataUseTranslation.translateDarInfo(props.darInfo));
      try{
        const datasets = await getDatasets(props.darInfo);
        setDatasets(datasets);
        setIsLoading(false);
      } catch(error) {
        setIsLoading(false);
      }
    };
    init();
  }, [props.darInfo]);

  return h(PDFViewer, {width: 1800, height: 800, isRendered: !isLoading}, [
    h(Document, {style: styles.page}, [
      h(Page, {}, [ //Researcher Info Page
        h(View, {style: styles.page}, [
          h(Text, {style: styles.header}, [`${darInfo.darCode} Application`]),
          h(Text, {style: styles.subHeader}, ["Applicant Information"]),
          h(View, {style: styles.flexboxContainer}, [
            h(LabelTextComponent, {label: "NIH eRA Commons ID", text: researcherProfile.nihUsername}),
            h(LabelTextComponent, {label: "LinkedIn Profile", text: researcherProfile.linkedIn})
          ]),
          h(View, {style: styles.flexboxContainer}, [
            h(LabelTextComponent, {label: "ORC ID", text: researcherProfile.orcid}),
            h(LabelTextComponent, {label: "ResearcherGate ID", text: researcherProfile.orcid}),
          ]),
          h(View, {style: styles.flexboxContainer}, [
            h(LabelTextComponent, {label: "Researcher", text: researcherProfile.profileName}),
            h(LabelTextComponent, {label: "Principal Investigator", text: `${researcherProfile.isThePI ? researcherProfile.profileName : researcherProfile.piName}`})
          ]),
          h(View, {style: styles.flexboxContainer}, [
            h(LabelTextComponent, {label: "Institution", text: researcherProfile.institution}),
            h(LabelTextComponent, {label: "Department", text: researcherProfile.department})
          ]),
          h(View, {style: styles.flexboxContainer}, [
            h(LabelTextComponent, {label: "Location", text: `${researcherProfile.city}, ${researcherProfile.state}`}),
            h(LabelTextComponent, {label: 'Country', text: researcherProfile.country})
          ]),
          h(View, {style: styles.flexboxContainer}, [
            h(LabelTextComponent, {label: "Researcher Email", text: researcherProfile.academicEmail})
          ])
        ])
      ]),
      h(Page, {}, [ //Data Use Request Page
        h(View, {style: styles.page}, [
          h(Text, {style: styles.subHeader}, ['Data Access Request']),
          h(StandardLabelTextComponent, {label: 'Project Title', text: darInfo.projectTitle}),
          h(LabelListComponent, {label: 'Datasets', list: datasets}),
          h(View, {style: styles.section}, [
            h(LabelListComponent, {label: "Primary Structured Research Purposes", list: translatedSRPs.primary}),
            h(LabelListComponent, {label: "Secondary Strucured Research Purposes", list: translatedSRPs.secondary})
          ]),
          h(View, {style: styles.section}, [
            h(StandardLabelTextComponent, {label: "Research Use Statement", text: darInfo.rus}),
          ]),
          h(View, {stye: styles.section}, [
            h(StandardLabelTextComponent, {label: "Non-Technical Research Use Statement", text: darInfo.nonTechRus})
          ])
        ])
      ])
    ])
  ]);
};
