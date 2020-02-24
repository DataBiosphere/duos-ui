import React from "react";
import { div, a } from "react-hyperscript-helpers";
import { Storage } from "../libs/storage";
const BORDER = "1px solid rgba(0,0,0,0.5)";
const LOREM_IPSUM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
class MacKenzieAccessReview extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = this.initialState();
  }
  initialState() {
    return {
      currentUser: Storage.getCurrentUser()
    };
  }
  back = () => {
    const { currentUser } = this.state;
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
        id: "container", className: 'container-wide centered normal-text primary'
      },
      [
        div(
          {
            id: "header",
            className: 'section',
            style: {
              justifyContent: "space-between",
              alignItems: "center",
              display: "flex"
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
                    border: BORDER,
                    marginRight: "12px"
                  }
                }),
                div({ id: "header-text" }, [
                  div({ className: 'title-text' }, "Data Access Review"),
                  div(
                    "Review the Application Summary and Data Use Limitations to determine if the researcher should be granted access to the data."
                  ),
                  div("DAC Chairs can optionally vote as a member.")
                ])
              ]
            ),
            div(
              [
                a(
                  {
                    id: "btn_back",
                    onClick: this.back,
                    className: "button-outlined secondary"
                  },
                  "DAC Console"
                )
              ]
            )
          ]
        ),
        div({ id: "body", className: 'normal-text', style: { display: "flex" } }, [
          div(
            {
              id: "voter-roles",
              className: 'section',
              style: {
                border: BORDER,
                width: "30%"
              }
            },
            [div({ className: 'subheader-text' }, "Vote as X")]
          ),
          div(
            {
              id: "application",
              className: 'section',
              style: {
                width: "70%"
              }
            },
            [
              div({ className: 'header-text' }, "Application header"),
              div(
                {
                  id: "app-summary",
                  className: 'text-section',
                },
                [
                  div({ className: 'subheader-text' }, "Application summary"),
                  div({ style: { display: "flex" } }, [
                    div(
                      {
                        id: "structured-rp",
                        style: {
                          padding: "24px 48px 24px 0px",
                          width: "50%"
                        }
                      },
                      [div({ className: 'header-text' }, "Structured Research Purpose"), div(LOREM_IPSUM)]
                    ),
                    div(
                      {
                        id: "dusl",
                        className: 'highlight-box',
                        style: {
                          width: "50%"
                        }
                      },
                      [div({ className: 'header-text highlighted' }, "Data Use Structured Limitations"), div(LOREM_IPSUM)]
                    )
                  ])
                ]
              ),
              div(
                {
                  id: "rp",
                  className: 'text-section'
                },
                [div({ className: 'header-text' }, "Research Purpose"), div(LOREM_IPSUM)]
              ),
              div(
                {
                  id: "applicant",
                },
                [div({ className: 'header-text' }, "Applicant Information"), div(LOREM_IPSUM)]
              )
            ]
          )
        ])
      ]
    );
  }
}
export default MacKenzieAccessReview;