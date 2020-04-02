import React from 'react';
import { div, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';
import { Files } from '../libs/ajax';
import { download } from '../libs/utils';
import { ApplicationSection } from './ApplicationSection';
import { StructuredRp } from './StructuredRp';
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

export const AppSummary = hh(class AppSummary extends React.PureComponent {
  /**
   * downloads the data use letter for this dataset
   */
  downloadDUL = () => {
    const { consentId, dulName } = this.props.consent;
    Files.getDulFile(consentId, dulName);
  };

  render() {
    const { darInfo, election, consent } = this.props;
    const { pi, profileName, institution, department, city, country } = darInfo;
    const mrDAR = JSON.stringify(election.useRestriction, null, 2);
    const mrDUL = JSON.stringify(consent.useRestriction, null, 2);

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
            [StructuredRp({
              content: darInfo.dataUse,
              labels: ["DAR machine-readable format"],
              functions: [() => download('machine-readable-DAR.json', mrDAR)]
            })]
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
            [StructuredLimitations({
              content: darInfo.translatedDataUse,
              labels: ["DUL machine-readable format", "Data Use Letter"],
              functions: [() => download('machine-readable-DUL.json', mrDUL), this.downloadDUL]
            })]
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
