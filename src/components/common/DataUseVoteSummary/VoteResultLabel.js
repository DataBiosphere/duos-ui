import { div } from 'react-hyperscript-helpers';

const labelFontStyle = {
  fontFamily: 'Montserrat',
  fontSize: '1.4rem',
  fontWeight: 600,
  flex: 1,
  justifyContent: 'center',
  display: 'flex',
  padding: '12%',
  backgroundColor: '#F3F5F8',
  textAlign: 'center',
  alignItems: 'center',
};

export default function VoteResultLabel({ propKey, label, additionalLabelStyle = {} }) {
  return div(
    {
      style: Object.assign({}, labelFontStyle, additionalLabelStyle),
      className: `vote-result-label-text-${propKey}`,
      key: `vote-result-label-${propKey}`,
    },
    [label]
  );
}
