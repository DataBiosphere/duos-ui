import {useEffect, useState} from "react";
import {a, div} from "react-hyperscript-helpers";
import {DataUseTranslation} from "../../libs/dataUseTranslation";
import ld from "lodash";
import DataUsePill from "./DataUsePill";

const styles = {
  baseStyle: {
    backgroundColor: '#F1EDE8',
    padding: '15px 25px',
    margin: '10px 0 20px 0',
    fontFamily: 'Montserrat',
  },
  researchPurposeTab: {
    fontWeight: 'bold'
  },
  collapsedData: {
    //TODO: reassess shadow code once not overridden by other stylings
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0,
    shadowRadius: 4.65,
    elevation: 8,
  }
};

const researchPurposeTab = () => {
  return div({style: styles.researchPurposeTab}, [
    "Structured Research Purpose"
  ]);
};

const dataUsePills = (translatedDataUse) => {
  return ld.map(ld.keys(translatedDataUse), key => {
    const restrictions = translatedDataUse[key];
    if (!ld.isEmpty(restrictions)) {
      const listRestrictions = ld.map(restrictions, (restriction, i) => {
        return DataUsePill({
          dataUseRestriction: restriction,
          key: i
        });
      });
      return div({key: key}, [listRestrictions]);
    }
  });
};

export default function ResearchProposalVoteSlab(props) {
  const [expanded, setExpanded] = useState(false);
  const { darInfo } = props;
  const translatedDataUse = DataUseTranslation.translateDarInfo(darInfo);

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
    researchPurposeTab(),
    div({className: 'srp_collapsed', style: styles.collapsedData}, [
      dataUsePills(translatedDataUse),
      linkToExpand(),
    ]),
    div({className: 'srp_expanded', isRendered: expanded}, [
      darInfo.nonTechRus
    ])
  ]);

}