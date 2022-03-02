import {useState} from "react";
import {a, div} from "react-hyperscript-helpers";
import {StructuredDarRp} from "../StructuredDarRp";

const styles = {
  srpHeader: {
    color: '#000000',
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    fontWeight: 'bold'
  },
  srpText: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: '1.4rem'
  },
  collapsedTab: {
    backgroundColor: '#F1EDE8',
    borderRadius: '5px 5px 0px 0px',
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
  return div({}, [
    "Structured Research Purpose"
  ]);
};

export default function ResearchProposalVoteSlab(props) {
  const [expanded, setExpanded] = useState(false);
  const { darInfo } = props;

  const linkToExpand = () => {
    const linkMessage = expanded ?
      'Hide Research Purpose and Vote' :
      'Expand to view Research Purpose and Vote';

    return a({
      id: 'link_srp_collapse_expand',
      onClick: () => setExpanded(!expanded),
    }, [linkMessage]);
  };

  return div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 jumbotron box-vote-stats'}, [
    div({className: 'srp_collapsed', style: styles.collapsedTab}, [
      researchPurposeTab(),
      StructuredDarRp({
        darInfo,
        headerStyle: styles.srpHeader,
        textStyle: styles.srpText
      }),
      linkToExpand(),
    ]),
    div({className: 'srp_expanded', isRendered: expanded}, [
      "filler text"
    ])
  ]);

}