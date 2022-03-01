import {useState} from "react";
import {div} from "react-hyperscript-helpers";
import {StructuredDarRp} from "../StructuredDarRp";
import {Styles} from "../../libs/theme";

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
  }
};


export default function ResearchProposalVoteCard(props) {
  const [expanded, setExpanded] = useState(false);
  const { darInfo } = props;

  return div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 jumbotron box-vote-stats'}, [
    StructuredDarRp({
      darInfo,
      headerStyle: styles.headerStyle,
      textStyle: styles.textStyle
    })
  ]);

}