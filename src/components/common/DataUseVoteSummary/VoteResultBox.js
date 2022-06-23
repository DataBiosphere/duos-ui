import {div, h} from 'react-hyperscript-helpers';
import VoteResultIcon from './VoteResultIcon';
import {ScrollButton} from '../../ScrollButton';
import {convertLabelToKey} from '../../../libs/utils';

const labelContainerStyle = {
  display: 'flex',
  padding: '4px 10px',
  backgroundColor: '#F3F5F8',
  textAlign: 'center',
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: 170
};

const labelFontStyle = {
  fontFamily: 'Montserrat',
  fontSize: '1.4rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
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
      h(ScrollButton, {
        to: `#${propKey}`,
        additionalStyle: labelFontStyle
      }, [
        label
      ]),
      h(VoteResultIcon, { propKey, votes })
    ]
  );
}