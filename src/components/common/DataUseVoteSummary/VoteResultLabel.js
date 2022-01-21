import { div } from 'react-hyperscript-helpers';

const labelFontStyle = {
  fontFamily: 'Arial',
  fontSize: 20,
  fontWeight: 600,
  flex: 1,
  justifyContent: 'center',
  display: 'flex',
  padding: '12%',
  backgroundColor: 'rgb(243, 245, 248)',
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
