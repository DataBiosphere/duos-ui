import React from 'react';
import { div } from "react-hyperscript-helpers";
import ResearchPurpose from '../components/ResearchPurpose';

const LOREM_IPSUM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

class Application extends React.PureComponent {

  render() {
    return div({ style: { fontFamily: 'Montserrat' } }, [
      div("Application header"),
      div(
        {
          id: "app-summary",
          className: 'text-section',
        },
        [
          div("Application summary"),
          div({ style: { display: "flex" } }, [
            div(
              {
                id: "structured-rp",
                style: {
                  width: "50%"
                }
              },
              [div("Structured Research Purpose"), div(LOREM_IPSUM)]
            ),
            div(
              {
                id: "dusl",
                style: {
                  width: "50%"
                }
              },
              [div("Data Use Structured Limitations"), div(LOREM_IPSUM)]
            )
          ])
        ]
      ),
      div(
        {
          id: "rp",
          className: 'text-section',
        },
        [<ResearchPurpose />]
      ),
      div(
        {
          id: "applicant",
        },
        [div("Applicant Information"), div(LOREM_IPSUM)]
      )
    ]);
  }
}
export default Application;