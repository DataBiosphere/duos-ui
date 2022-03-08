import {useState} from "react";
import {a, div, h, span} from "react-hyperscript-helpers";
import {DataUseTranslation} from "../../libs/dataUseTranslation";
import ld, {isEmpty, isNil} from "lodash";
import DataUsePill from "./DataUsePill";
import DataUseAlertBox from "./DataUseAlertBox";
import {Transition} from "@headlessui/react";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    padding: '15px 25px',
    margin: '10px 0 20px 0'
  },
  slabTitle: {
    color: '#000000',
    backgroundColor: '#F1EDE8',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    width: 'fit-content',
    padding: '1.2rem',
    borderRadius: '4px 4px 0 0',
  },
  dataUseCategoryLabel: {
    fontWeight: 'bold',
    textTransform: 'capitalize'
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
    borderBottom: '4px #646464 solid',
    padding: '15px 25px'
  },
  expandedData: {
    backgroundColor: '#F9F8F6',
    borderRadius: '8px',
    padding: '15px 25px'
  },
  researchPurposeTitle: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    marginTop: '1rem',
    display: 'inline-block'
  },
  researchPurposeSummary: {
    fontSize: '1.4rem',
    fontWeight: '500',
    lineHeight: '20px',
    margin: '1.5rem'
  },
  skeletonLoader: {
    height: '60px',
  }
};

const SlabTitle = () => {
  return div({className: 'slab-title', style: styles.slabTitle}, [
    "Structured Research Purpose"
  ]);
};

const DataUseSummary = ({translatedDataUse}) => {
  return ld.flatMap(ld.keys(translatedDataUse), key => {
    const dataUses = translatedDataUse[key];
    const label = span({style: styles.dataUseCategoryLabel, isRendered: !isEmpty(dataUses)}, [key + ':']);
    return div({className: key + '-data-uses'}, [
      label,
      dataUsePills(dataUses)
    ]);
  });
};

const dataUsePills = (dataUses) => {
  return ld.map(dataUses, (dataUse, i) => {
    return DataUsePill({
      dataUse,
      key: i
    });
  });
};

const SkeletonLoader = () => {
  return div({className: 'text-placeholder', style: styles.skeletonLoader});
};

const CollapseExpandLink = ({expanded, setExpanded}) => {
  const linkMessage = expanded ?
    'Hide Research Purpose and Vote' :
    'Expand to view Research Purpose and Vote';

  return a({
    id: 'link_srp_collapse_expand',
    style: styles.link,
    onClick: () => setExpanded(!expanded),
  }, [linkMessage]);
};

const ResearchPurposeSummary = ({darInfo}) => {
  return div({style: styles.researchPurposeSummary}, [darInfo.rus]);
};

export default function ResearchProposalVoteSlab(props) {
  const [expanded, setExpanded] = useState(false);
  const {darInfo, isLoading} = props;
  const translatedDataUse = !isNil(darInfo) ? DataUseTranslation.translateDarInfo(darInfo) : {};


  return div({className: 'srp-slab', style: styles.baseStyle}, [
    h(SlabTitle, {}),
    div({className: 'srp-collapsed', style: styles.collapsedData}, [
      isLoading ? h(SkeletonLoader, {}) : h(DataUseSummary, {translatedDataUse}),
      h(CollapseExpandLink, {
        expanded,
        setExpanded,
        isRendered: !isLoading
      })
    ]),

    h(Transition, {
      show: expanded,
      enter: "transition-opacity ease-linear duration-150",
      enterFrom: "opacity-0",
      enterTo: "opacity-100",
      leave: "transition-opacity ease-linear duration-150",
      leaveFrom: "opacity-100",
      leaveTo: "opacity-0",
    },
    [
      div({className: 'srp-expanded', style: styles.expandedData}, [
        div({className: 'research-purpose'}, [
          span({style: styles.researchPurposeTitle}, ["Research Purpose"]),
          h(ResearchPurposeSummary, {darInfo}),
          h(DataUseAlertBox, {translatedDataUse}),
        ]),
      ]),
    ])
  ]);
}
