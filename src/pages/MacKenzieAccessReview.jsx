import React from "react";
import { div, h2, h3, p, a } from "react-hyperscript-helpers";
import { Storage } from "../libs/storage";
const BORDER = "1px solid rgba(0,0,0,0.5)";
const PADDING = "12px";
const MARGIN = "6px";
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
        id: "container"
      },
      [
        div(
          {
            id: "header",
            style: {
              justifyContent: "space-between",
              alignItems: "center",
              border: BORDER,
              padding: PADDING,
              margin: MARGIN,
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
                  h2("Data Access Review"),
                  p(
                    "Review the Application Summary and Data Use Limitations to determine if the researcher should be granted access to the data."
                  ),
                  p("DAC Chairs can optionally vote as a member.")
                ])
              ]
            ),
            div(
              { className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" },
              [
                a(
                  {
                    id: "btn_back",
                    onClick: this.back,
                    className: "btn-primary btn-back"
                  },
                  "DAC Console"
                )
              ]
            )
          ]
        ),
        div({ id: "body", style: { display: "flex" } }, [
          div(
            {
              id: "voter-roles",
              style: {
                border: BORDER,
                padding: PADDING,
                margin: MARGIN,
                width: "30%"
              }
            },
            [h3("Vote as X")]
          ),
          div(
            {
              id: "application",
              style: {
                border: BORDER,
                padding: PADDING,
                margin: MARGIN,
                width: "70%"
              }
            },
            [
              h3("Application header"),
              div(
                {
                  id: "app-summary",
                  style: {
                    border: BORDER,
                    padding: PADDING,
                    margin: MARGIN
                  }
                },
                [
                  "Application summary",
                  div({ style: { display: "flex" } }, [
                    div(
                      {
                        id: "structured-rp",
                        style: {
                          border: BORDER,
                          padding: PADDING,
                          margin: MARGIN,
                          width: "50%"
                        }
                      },
                      [h3("Structured Research Purpose"), p(LOREM_IPSUM)]
                    ),
                    div(
                      {
                        id: "dusl",
                        style: {
                          border: BORDER,
                          padding: PADDING,
                          margin: MARGIN,
                          width: "50%"
                        }
                      },
                      [h3("Data Use Structured Limitations"), p(LOREM_IPSUM)]
                    )
                  ])
                ]
              ),
              div(
                {
                  id: "rp",
                  style: {
                    border: BORDER,
                    padding: PADDING,
                    margin: MARGIN,
                    width: "100%"
                  }
                },
                [h3("Research Purpose"), p(LOREM_IPSUM)]
              ),
              div(
                {
                  id: "applicant",
                  style: {
                    border: BORDER,
                    padding: PADDING,
                    margin: MARGIN,
                    width: "100%"
                  }
                },
                [h3("Applicant Information"), p(LOREM_IPSUM)]
              )
            ]
          )
        ])
      ]
    );
  }
}
export default MacKenzieAccessReview;