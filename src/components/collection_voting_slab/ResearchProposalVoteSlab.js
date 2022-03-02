import {useEffect, useState} from "react";
import {a, div, span} from "react-hyperscript-helpers";
import {DataUseTranslation} from "../../libs/dataUseTranslation";
import ld from "lodash";
import DataUsePill from "./DataUsePill";

const styles = {
  baseStyle: {
    padding: '15px 25px',
    margin: '10px 0 20px 0',
    fontFamily: 'Montserrat',
    display: 'contents'
  },
  slabTitle: {
    backgroundColor: '#F1EDE8',
    color: '#000000',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    height: '32px',
    width: '274px',
    borderRadius: '4px 4px 0 0',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  },
  collapsedData: {
    backgroundColor: '#F1EDE8',
    color: '#333F52',
    borderRadius: '0 4px 4px 4px',
    padding: '15px 25px',
    //TODO: reassess shadow code once not overridden by other stylings
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0,
    shadowRadius: 4.65,
    elevation: 8,
  },
  expandedData: {
    background: '#F9F8F6',
  }
};

const slabTitle = () => {
  return div({style: styles.slabTitle}, [
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

export default function ResearchProposalVoteSlab(props) {
  const [expanded, setExpanded] = useState(false);
  const [dataUse, setDataUse] = useState([]);
  const { darInfo } = props;
  const translatedDataUse = DataUseTranslation.translateDarInfo(darInfo);

  useEffect(() => {
    setDataUse(translatedDataUse);
  }, []);

  const linkToExpand = () => {
    const linkMessage = expanded ?
      'Hide Research Purpose and Vote' :
      'Expand to view Research Purpose and Vote';

    return a({
      id: 'link_srp_collapse_expand',
      onClick: () => setExpanded(!expanded),
    }, [linkMessage]);
  };

  return div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12', style: styles.baseStyle}, [
    slabTitle(),
    div({className: 'srp_collapsed', style: styles.collapsedData}, [
      span({style: {fontWeight: 'bold'}}, ["Primary:"]),
      dataUsePills(translatedDataUse),
      linkToExpand(),
    ]),
    div({className: 'srp_expanded', style: styles.expandedData, isRendered: expanded}, [
      darInfo.nonTechRus,
      "VOTE and RATIONALE"
    ])
  ]);

}