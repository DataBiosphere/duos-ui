import { CheckCircle, Cancel, Autorenew, RemoveCircle } from '@material-ui/icons';
import { h, div } from 'react-hyperscript-helpers';

const iconFontStyle = {
  fontFamily: 'M',
  fontSize: '1.6rem',
  fontWeight: 600,
  flex: 1,
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '2.5%',
  margin: '2.5%',
};

//Possible icons should be Yes, No, Mixed, Under Review, and Legacy (for older collections)
export default function VoteResultIcon({ result, propKey }) {
  const iconSize = 50;
  const margin = '2.5%';
  const modifiedTextStyle = Object.assign({}, iconFontStyle, {
    fontSize: '2.2rem',
  });
  const templates = {
    true: {
      output: [
        h(CheckCircle, {
          className: `vote-result-yes-icon-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1, color: '#1FA371' },
        })
      ]
    },
    false: {
      output: [
        h(Cancel, {
          className: `vote-result-no-icon-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1, color: '#DA0003' },
        })
      ]
    },
    underReview: {
      output: [
        h(Autorenew, {
          className: `vote-result-under-review-icon-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1, color: '#A3ADBF' },
        })
      ]
    },
    mixed: {
      output: [
        h(RemoveCircle, {
          className: `vote-result-mixed-icon-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1, color: '#A3ADBF' },
          'data-tip':
            'Mixed outcome stems from varying election results within this Data Use categorization.',
        })
      ]
    }
  };
  const { output, colorStyle } = templates[result];
  return div(
    {
      style: Object.assign({ borderRadius: '4%' }, colorStyle, iconFontStyle),
      key: `vote-result-box-${propKey}`,
      className: `vote-result-box-${propKey}`
    },
    output
  );
}
