import React from 'react';
import { div, a, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';
import { Storage } from "../libs/storage";

const TITLE = {
  fontWeight: Theme.font.weight.semibold,
  fontSize: Theme.font.size.title,
  lineHeight: Theme.font.leading.title,
  marginBottom: '5px',
}

const SMALL = {
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.dense,
}

const BUTTON = {
  ...SMALL,
  fontWeight: Theme.font.weight.semibold,
}

export const AccessReviewHeader = hh(class AccessReviewHeader extends React.PureComponent {

  back = () => {
    const currentUser = Storage.getCurrentUser();
    const page = currentUser.isChairPerson
      ? "/chair_console"
      : currentUser.isMember
        ? "/member_console"
        : "/";
    this.props.history.push(page);
  };

  render() {
    return div(
      {
        style: {
          justifyContent: "space-between",
          alignItems: "center",
          display: "flex",
          fontFamily: 'Montserrat',
          color: Theme.palette.primary,
        }
      },
      [
        div(
          {
            style: {
              alignItems: "center",
              display: "flex"
            }
          },
          [
            div({
              id: "lock-icon",
              style: {
                width: "50px",
                height: "50px",
                backgroundColor: "#eeeeee",
                marginRight: "16px"
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
        div(
          [
            a(
              {
                id: "btn_back",
                onClick: this.back,
                className: "button-outlined secondary",
                style: BUTTON,
              },
              "DAC Console"
            )
          ]
        )
      ]
    );
  }
});
