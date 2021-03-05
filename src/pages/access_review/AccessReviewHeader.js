import React from 'react';
import { div, img, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import * as fp from 'lodash/fp';

const TITLE = {
  fontWeight: Theme.font.weight.semibold,
  fontSize: Theme.font.size.title,
  lineHeight: Theme.font.leading.title,
  marginBottom: '5px',
};

const SMALL = {
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.dense,
};

export const AccessReviewHeader = hh(class AccessReviewHeader extends React.PureComponent {
  constructor(props) {
    super(props);
    if (!fp.isNil(props.dacChairMessage)) {
      this.state = { dacChairMessage: props.dacChairMessage };
    } else {
      this.state = { dacChairMessage: "" };
    }
  }

  render() {
    return div(
      {
        style: {
          justifyContent: 'space-between',
          alignItems: 'center',
          display: 'flex',
          fontFamily: 'Montserrat',
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
              src: '/images/lock-icon.png',
              style: {
                width: '60px',
                height: '60px',
                marginRight: '16px'
              }
            }),
            div({ id: "header-text" }, [
              div({ style: TITLE }, "Data Access Review"),
              div({ style: SMALL },
                "Review the Application Summary and Data Use Limitations to determine if the researcher should be granted access to the data."
              ),
              div({ style: SMALL }, this.state.dacChairMessage )
            ])
          ]
        )
      ]
    );
  }
});
