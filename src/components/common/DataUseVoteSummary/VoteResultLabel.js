import {div, h, span} from 'react-hyperscript-helpers';
import {useEffect} from "react";
import ReactTooltip from "react-tooltip";

const labelContainerStyle = {
  flex: 1,
  display: 'flex',
  padding: '12%',
  backgroundColor: '#F3F5F8',
  textAlign: 'center',
  alignItems: 'center',
};

const labelFontStyle = {
  fontFamily: 'Montserrat',
  fontSize: '1.4rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};


export default function VoteResultLabel({ propKey, label, additionalLabelStyle = {} }) {
  return div(
    {
      style: Object.assign({}, labelContainerStyle, additionalLabelStyle),
      className: `vote-result-label-text-${propKey}`,
      key: `vote-result-label-${propKey}`,
      'data-tip': label
    },
    [
      span({style: labelFontStyle}, [label])
    ]
  );
}
