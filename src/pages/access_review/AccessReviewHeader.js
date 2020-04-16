import React from 'react';
import { div, button, img, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import { Storage } from '../../libs/storage';
import { Navigation } from '../../libs/utils';

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

const BUTTON = {
  ...SMALL,
  fontWeight: Theme.font.weight.semibold,
  color: Theme.palette.secondary,
};

export const AccessReviewHeader = hh(class AccessReviewHeader extends React.PureComponent {

  openAccessReview = (referenceId, voteId, rpVoteId) => {
    if (rpVoteId !== null) {
      this.props.history.push(`/access_review/${referenceId}/${voteId}/${rpVoteId}`);
    } else {
      this.props.history.push(`/access_review/${referenceId}/${voteId}`);
    }
  };

  render() {
    const currentUser = Storage.getCurrentUser();
    const { history } = this.props;
    const { darId, voteId, rpVoteId } = this.props.match.params;
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
              div({ style: SMALL }, "DAC Chairs can optionally vote as a member.")
            ])
          ]
        ),
        div([div(
          [
            button(
              {
                id: "btn_back",
                onClick: () => Navigation.back(currentUser, history),
                className: "button-outlined",
                style: BUTTON,
              },
              "DAC Console"
            )
          ]
        ),
        div(
          [
            button(
              {
                onClick: () => this.openAccessReview(darId, voteId, rpVoteId),
                className: "button-outlined",
                style: BUTTON,
              },
              "Original DAR"
            )
          ]
        )])
      ]
    );
  }
});
