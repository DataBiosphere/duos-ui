import {div, h, span} from 'react-hyperscript-helpers';
import VoteResultIcon from './VoteResultIcon';

const labelContainerStyle = {
  display: 'flex',
  padding: '4px 10px',
  backgroundColor: '#F3F5F8',
  textAlign: 'center',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '10%'
};

const labelFontStyle = {
  fontFamily: 'Montserrat',
  fontSize: '1.4rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

//helper function to generate keys for rendered elements
const convertLabelToKey = (label) => {
  return label.split(' ').join('-');
};

export default function VoteResultBox({ label, votes, additionalLabelStyle = {} }) {
  const propKey = convertLabelToKey(label);
  return div(
    {
      style: Object.assign({}, labelContainerStyle, additionalLabelStyle),
      className: `vote-result-box-text-${propKey}`,
      key: `vote-result-box-${propKey}`,
      'data-tip': label,
      'data-for': 'vote-result'
    },
    [
      span({style: labelFontStyle}, [label]),
      h(VoteResultIcon, { propKey, votes })
    ]
  );
}