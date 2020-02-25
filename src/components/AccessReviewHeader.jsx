import React from 'react';
import { div, a } from "react-hyperscript-helpers";
import { Theme } from '../theme'

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
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.dense,
  fontWeight: Theme.font.weight.semibold,
}

class AccessReviewHeader extends React.PureComponent {

  back = () => {
    const { currentUser, history } = this.props;
    const page = currentUser.isChairPerson
      ? "/chair_console"
      : currentUser.isMember
        ? "/member_console"
        : "/";
    history.push(page);
  };

  render() {
    return div(
      {
        style: {
          justifyContent: "space-between",
          alignItems: "center",
          display: "flex",
          fontFamily: 'Montserrat',
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
                marginRight: "12px"
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
}
export default AccessReviewHeader;
