import {useState} from "react";
import {a, div} from "react-hyperscript-helpers";
import {StructuredDarRp} from "../StructuredDarRp";

const styles = {
  headerStyle: {
    color: '#000000',
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    fontWeight: 'bold'
  },
  textStyle: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: '1.4rem'
  },
  tabStyle: {
    color: '#F1EDE8'
  }
};


export default function ResearchProposalVoteCard(props) {
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
    div([
      StructuredDarRp({
        darInfo,
        headerStyle: styles.headerStyle,
        textStyle: styles.textStyle
      }),
      linkToExpand(),
    ]),
    div({isRendered: expanded }, [
      "filler text"
    ])
  ]);

}