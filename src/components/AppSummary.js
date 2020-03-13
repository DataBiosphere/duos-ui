import React from 'react';
import { div, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';
import { ApplicationSection } from './ApplicationSection';
import { StructuredLimitations } from './StructuredLimitations';
import { ApplicantInfo } from './ApplicantInfo';

const SUBHEADER = {
  margin: '32px 0px',
  color: Theme.palette.primary,
  opacity: '70%',
  textTransform: 'uppercase',
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.dense,
  fontWeight: Theme.font.weight.semibold,
  fontFamily: 'Montserrat',
};

const LOREM_IPSUM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export const AppSummary = hh(class AppSummary extends React.PureComponent {
  render() {
    const { darInfo, election, consentElection } = this.props;
    const { pi, profileName, institution, department, city, country } = darInfo;
    return div({ id: 'app-summary' },
      [
        div({ style: SUBHEADER }, "Application summary"),
        div({ style: { display: "flex" } }, [
          div(
            {
              id: "structured-rp",
              style: {
                width: "50%",
                padding: '24px 48px 24px 0px'
              }
            },
            [ApplicationSection({ header: 'Structured Research Purpose', content: LOREM_IPSUM, headerColor: Theme.palette.primary })]
          ),
          div(
            {
              id: "dusl",
              style: {
                width: "50%",
                padding: '24px',
                backgroundColor: Theme.palette.background.highlighted,
                borderRadius: '9px',
              }
            },
            [StructuredLimitations({ darInfo, consentElection })]
          )
        ]),
        div(
          {
            id: "rp",
            style: { margin: '32px 0px' },
          },
          [ApplicationSection({ header: 'Research Purpose', content: darInfo.rus, headerColor: Theme.palette.primary, })]
        ),
        div(
          {
            id: "applicant",
          },
          [ApplicantInfo({
            content: {
              principalInvestigator: pi,
              researcher: profileName,
              institution,
              department,
              city,
              country
            },
          })]
        )
      ]
    );
  }
});
