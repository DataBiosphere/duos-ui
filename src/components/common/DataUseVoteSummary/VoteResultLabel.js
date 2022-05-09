import {div, h, span} from 'react-hyperscript-helpers';
import VoteResultIcon from "./VoteResultIcon";

const labelContainerStyle = {
  display: 'flex',
  padding: '4px 10px',
  backgroundColor: '#F3F5F8',
  textAlign: 'center',
  alignItems: 'center',
  justifyContent: 'space-between'
};

const labelFontStyle = {
  fontFamily: 'Montserrat',
  fontSize: '1.4rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

export default function VoteResultLabel({ propKey, label, finalVotes, additionalLabelStyle = {} }) {
  return div(
    {
      style: Object.assign({}, labelContainerStyle, additionalLabelStyle),
      className: `vote-result-label-text-${propKey}`,
      key: `vote-result-label-${propKey}`,
      'data-tip': label
    },
    [
      span({style: labelFontStyle}, [label]),
      h(VoteResultIcon, { propKey, finalVotes })
    ]
  );
}
