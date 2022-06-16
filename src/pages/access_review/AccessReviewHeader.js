import React from 'react';
import { div, img, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import lockIcon from '../../images/lock-icon.png';
import { isNil } from 'lodash/fp';

const TITLE = {
  fontWeight: Theme.font.weight.semibold,
  fontSize: Theme.font.size.title,
  lineHeight: Theme.font.leading.title,
  marginBottom: '5px',
};

const SUBHEADER = {
  fontSize: Theme.font.size.subheader,
  lineHeight: Theme.font.leading.dense
};

export const AccessReviewHeader = hh(class AccessReviewHeader extends React.PureComponent {

  render() {
    const message = this.props.message;

    return div(
      {
        style: {
          justifyContent: 'space-between',
          display: 'flex',
          fontFamily: 'Arial',
          color: Theme.palette.primary,
        }
      },
      [
        div(
          {
            style: {
              alignItems: 'center',
              display: 'flex'
            }
          },
          [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: {
                width: '60px',
                height: '60px',
                marginRight: '16px'
              }
            }),
            div({ id: 'header-text' }, [
              div({ style: TITLE }, 'Data Access Request (DAR) Review'),
              div({ style: SUBHEADER },
                'Review the Application Summary and Data Use Limitations to determine if the researcher should be granted access to the data.'
              ),
              div({ isRendered: !isNil(message), style: SUBHEADER }, message )
            ])
          ]
        )
      ]);
  }
});
