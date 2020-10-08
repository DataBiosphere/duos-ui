import React from 'react';
import { div, hh, span } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import { Files } from '../../libs/ajax';
import { download } from '../../libs/utils';
import { ApplicationSection } from './ApplicationSection';
import { StructuredDarRp } from '../../components/StructuredDarRp';
import { ApplicantInfo } from './ApplicantInfo';
import { DownloadLink } from '../../components/DownloadLink';
import { DataUseTranslation } from '../../libs/dataUseTranslation';

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

const ROOT = {
  fontFamily: 'Montserrat',
  color: Theme.palette.primary,
  whiteSpace: 'pre-line'
};

const HEADER = {
  marginBottom: '5px',
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
  fontWeight: Theme.font.weight.semibold,
  color: Theme.palette.highlighted,
};

const TEXT = {
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.regular,
  fontWeight: Theme.font.weight.regular,
  display: 'inline-block'
};

const BOLD = {
  ...TEXT,
  fontWeight: Theme.font.weight.semibold,
};

export const AppSummary = hh(class AppSummary extends React.Component {

  constructor(props) {
    super();
    this.state = {
      generateRestrictions: this.generateRestrictions.bind(this),
      translatedRestrictions: []
    };
  }

  generateRestrictions = async(dataUse) => {
    const translatedRestrictions = await DataUseTranslation.translateDataUseRestrictions(dataUse);
    this.setState(prev => {
      prev.translatedRestrictions = translatedRestrictions;
      return prev;
    });
  }

  async componentDidMount() {
    await this.generateRestrictions(this.props.consent.dataUse);
  }

  /**
   * downloads the data use letter for this dataset
   */
  downloadDUL = () => {
    const { consentId, dulName } = this.props.consent;
    Files.getDulFile(consentId, dulName);
  };

  render() {
    const { darInfo, accessElection, consent, researcherProfile } = this.props;
    const { pi, profileName, institution, department, city, country } = darInfo;
    const mrDAR = JSON.stringify(accessElection.useRestriction, null, 2);
    const mrDUL = JSON.stringify(consent.useRestriction, null, 2);
    const translatedRestrictionsList = this.state.translatedRestrictions.map((restrictionObj) => {
      return span({style: TEXT}, restrictionObj.description);
    });
    const StructuredLimitations = div({ style: ROOT}, [
      div({style: HEADER}, 'Data Use Structured Limitations'),
      div({style: TEXT}, [translatedRestrictionsList]),
      div(DownloadLink({
        label: 'DUL machine-readable format',
        onDownload: () => download('machine-readable-DUL.json', mrDUL)
      })),
      div(DownloadLink({
        label: 'Data Use Letter',
        onDownload: this.downloadDUL
      }))
    ]);

    return div({ id: 'app-summary' },
      [
        div({ style: SUBHEADER }, 'Application summary'),
        div({ style: { display: 'flex' } }, [
          div(
            {
              id: 'structured-rp',
              style: {
                width: '50%',
                padding: '24px 48px 24px 0px'
              }
            },
            [
              StructuredDarRp({darInfo: darInfo}),
              div({},[
                DownloadLink({ label: 'DAR machine-readable format', onDownload: () => download('machine-readable-DAR.json', mrDAR) })
              ])
            ]
          ),
          div(
            {
              id: 'dusl',
              style: {
                width: '50%',
                padding: '24px',
                backgroundColor: Theme.palette.background.highlighted,
                borderRadius: '9px',
              }
            },
            [StructuredLimitations]
          )
        ]),
        div(
          {
            id: 'rp',
            style: { margin: '32px 0px' },
          },
          [ApplicationSection({ header: 'Research Purpose', content: darInfo.rus, headerColor: Theme.palette.primary, })]
        ),
        div(
          {
            id: 'applicant',
          },
          [ApplicantInfo({
            researcherProfile: researcherProfile,
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
