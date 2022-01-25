import React from 'react';
import { div, hh, h } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import { download } from '../../libs/utils';
import { ApplicationSection } from './ApplicationSection';
import { StructuredDarRp } from '../../components/StructuredDarRp';
import { ApplicantInfo } from './ApplicantInfo';
import { DownloadLink } from '../../components/DownloadLink';
import { DataUseTranslation } from '../../libs/dataUseTranslation';
import {isNil, isEmpty} from "lodash/fp";
import {findPropertyValue} from "../../libs/utils";
import {UserProperties} from "../../libs/utils";

const ROOT = {
  fontFamily: 'Arial',
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

export const AppSummary = hh(class AppSummary extends React.Component {

  constructor() {
    super();
    this.state = {
      generateRestrictions: this.generateRestrictions.bind(this),
      translatedRestrictions: [],
      institution: {},
    };
  }

  getInstitutionFromProfile = (profile) => {
    if(!isEmpty(profile)) {
      this.setState((prev) => {
        prev.institution = profile.institution || {};
        return prev;
      });
    }
  };


  generateRestrictions = async(dataUse) => {
    const translatedRestrictions = await DataUseTranslation.translateDataUseRestrictions(dataUse);
    const resolvedPromises = (await Promise.all(translatedRestrictions)).filter((value) => !isEmpty(value));
    this.setState(prev => {
      prev.translatedRestrictions = resolvedPromises;
      return prev;
    });
  };

  async componentDidMount() {
    await this.generateRestrictions(this.props.consent.dataUse);
    this.getInstitutionFromProfile(this.props.researcherProfile);
  }

  render() {
    const { darInfo, accessElection, consent, researcherProfile } = this.props;
    const isThePi = findPropertyValue(UserProperties.IS_THE_PI, researcherProfile);
    const piName = isThePi === true ?
      researcherProfile.displayName
      : findPropertyValue(UserProperties.PI_NAME, researcherProfile);
    const department = findPropertyValue(UserProperties.DEPARTMENT, researcherProfile);
    const city = findPropertyValue(UserProperties.CITY, researcherProfile);
    const country = findPropertyValue(UserProperties.COUNTRY, researcherProfile);
    const mrDAR = !isNil(accessElection) ? JSON.stringify(accessElection.useRestriction, null, 2) : null;
    const mrDUL = JSON.stringify(consent.useRestriction, null, 2);
    const translatedRestrictionsList = this.state.translatedRestrictions.map((restrictionObj, index) => {
      return div({key: index}, restrictionObj.description);
    });
    const StructuredLimitations = div({ style: ROOT}, [
      div({style: HEADER}, 'Structured Data Use Terms'),
      div({style: TEXT}, [translatedRestrictionsList]),
      div({style: {marginTop: '0.8rem'}}, [
        h(DownloadLink,{
          label: 'DUL machine-readable format',
          onDownload: () => download('machine-readable-DUL.json', mrDUL)
        })
      ])
    ]);

    return div({ id: 'app-summary' },
      [
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
              div({isRendered: !isNil(mrDAR)},[
                DownloadLink({ label: 'DAR machine-readable format', onDownload: () => download('machine-readable-DAR.json', mrDAR) })
              ])
            ]
          ),
          div(
            {
              id: 'dusl',
              style: {
                width: '50%',
                margin: '24px 24px 0',
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
            style: { margin: '20px 0px' },
          },
          [ApplicationSection({ header: 'Research Purpose', content: darInfo.rus, headerColor: Theme.palette.primary, })]
        ),
        div(
          {
            id: 'applicant',
            style: { margin: '20px 0px' }
          },
          [ApplicantInfo({
            researcherProfile: researcherProfile,
            institution: this.state.institution,
            content: {
              principalInvestigator: piName,
              researcher: researcherProfile.displayName,
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
