import { CheckCircleOutlined, CancelOutlined, AutorenewOutlined, CompareArrowsOutlined } from '@material-ui/icons';
import { blue, green, red, yellow } from '@material-ui/core/colors';
import { h, div } from 'react-hyperscript-helpers';

const iconFontStyle = {
  fontFamily: 'Arial',
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
        h(CheckCircleOutlined, {
          className: `vote-result-yes-icon-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1 },
        }),
        div(
          {
            className: `vote-result-yes-text-${propKey}`,
            style: modifiedTextStyle,
          },
          ['Yes']
        ),
      ],
      colorStyle: {
        backgroundColor: green[500],
        flex: 1,
      },
    },
    false: {
      output: [
        h(CancelOutlined, {
          className: `vote-result-no-icon-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1 },
        }),
        div(
          {
            className: `vote-result-no-text-${propKey}`,
            style: modifiedTextStyle,
          },
          ['No']
        ),
      ],
      colorStyle: {
        backgroundColor: red[500],
        flex: 1,
      },
    },
    underReview: {
      output: [
        h(AutorenewOutlined, {
          className: `vote-result-under-review-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1 },
        }),
        div(
          {
            className: `vote-result-under-review-${propKey}`,
            style: Object.assign({}, modifiedTextStyle, { fontSize: '1.5rem' }),
          },
          ['Under Review']
        ),
      ],
      colorStyle: {
        backgroundColor: blue[500],
        flex: 1,
      },
    },
    mixed: {
      output: [
        h(CompareArrowsOutlined, {
          className: `vote-result-mixed-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1 },
        }),
        div({ className: `vote-mixed-${propKey}`, style: modifiedTextStyle }, [
          'Mixed',
        ]),
      ],
      colorStyle: {
        backgroundColor: yellow[500],
        color: 'white',
      },
    },
    legacy: {
      output: [
        div(
          {
            className: `vote-legacy-${propKey}`,
            style: Object.assign({}, modifiedTextStyle, {
              color: 'black',
              justifyContent: 'center',
            }),
            'data-tip':
              'RP Vote cannot be determined from legacy DARs in this collection',
            'data-for': 'tip_legacy_result',
          },
          ['N/A (Legacy)']
        ),
      ],
      colorStyle: {},
    },
  };
  const { output, colorStyle } = templates[result];
  return div(
    {
      style: Object.assign({ borderRadius: '4%' }, colorStyle, iconFontStyle),
      key: `vote-result-box-${propKey}`,
    },
    output
  );
}
