import React from 'react';
import { div, img, h, hh, a, span } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import lockIcon from '../../images/lock-icon.png';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { isNil } from 'lodash/fp';
import {Navigation} from '../../libs/utils';
import {Storage} from '../../libs/storage';

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
        ),
        div({ style: {marginRight: '10px', anchor: 'right' }}, [
          a({onClick: () => {Navigation.back(Storage.getCurrentUser(), this.props.history);}, style: {fontSize: '22px'}}, [
            h(ArrowBackIcon, {style: {marginRight: '8px', marginBottom: '-4px', fontSize: '22px'}}),
            span('Return to Console')
          ])
        ])
      ]);
  }
});
