import {useState} from "react";
import {a, div, h, span} from "react-hyperscript-helpers";
import {DataUseTranslation} from "../../libs/dataUseTranslation";
import ld from "lodash";
import DataUsePill from "./DataUsePill";
import DataUseBox from "./DataUseBox";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    padding: '15px 25px',
    margin: '10px 0 20px 0',
    display: 'contents'
  },
  slabTitle: {
    color: '#000000',
    backgroundColor: '#F1EDE8',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    width: 'fit-content',
    padding: '1rem',
    borderRadius: '4px 4px 0 0',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  },
  link: {
    color: '#0948B7',
    fontWeight: '500',
    marginLeft: '7rem'
  },
  collapsedData: {
    color: '#333F52',
    backgroundColor: '#F1EDE8',
    borderRadius: '0 4px 4px 4px',
    padding: '15px 25px'
  },
  expandedData: {
    backgroundColor: '#F9F8F6',
    borderRadius: '8px',
    padding: '15px 25px'
  },
  researchPurposeSummary: {
    fontSize: '1.4rem',
    fontWeight: '500',
    lineHeight: '20px',
    margin: '1.5rem'
  }
};

const slabTitle = () => {
  return div({className: 'slab_title', style: styles.slabTitle}, [
    "Structured Research Purpose"
  ]);
};

const dataUsePills = (translatedDataUse) => {
  const primaryDataUses = translatedDataUse.primary;
  const formattedDataUses = ld.map(primaryDataUses, (dataUse, i) => {
    return DataUsePill({
      dataUse,
      key: i
    });
  });

  return div({className: "primary_data_use_pill"}, [formattedDataUses]);
};

const researchPurposeSummary = (darInfo) => {
  return div({style: styles.researchPurposeSummary}, [darInfo.nonTechRus]);
};

export default function ResearchProposalVoteSlab(props) {
  const [expanded, setExpanded] = useState(false);
  const { darInfo } = props;
  const translatedDataUse = DataUseTranslation.translateDarInfo(darInfo);

  const collapseExpandLink = () => {
    const linkMessage = expanded ?
      'Hide Research Purpose and Vote' :
      'Expand to view Research Purpose and Vote';

    return a({
      id: 'link_srp_collapse_expand',
      style: styles.link,
      onClick: () => setExpanded(!expanded),
    }, [linkMessage]);
  };

  return div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12', style: styles.baseStyle}, [
    slabTitle(),
    div({className: 'srp_collapsed', style: styles.collapsedData}, [
      span({style: {fontWeight: 'bold'}}, ["Primary:"]),
      dataUsePills(translatedDataUse),
      collapseExpandLink(),
    ]),
    div({className: 'srp_expanded', style: styles.expandedData, isRendered: expanded}, [
      div({className: 'research_purpose'}, [
        span({style: {fontSize: '1.8rem', fontWeight: 'bold'}}, ["Research Purpose"]),
        researchPurposeSummary(darInfo),
        h(DataUseBox, {translatedDataUse}),
      ]),
      "VOTE AND RATIONALE COMPONENTS"
    ])
  ]);

}