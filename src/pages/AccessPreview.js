import _ from 'lodash';
import { Component } from 'react';
import { a, button, div, h4, i } from 'react-hyperscript-helpers';
import { ApplicationSummary } from '../components/ApplicationSummary';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { DataAccessRequest } from '../components/DataAccessRequest';
import { PageHeading } from '../components/PageHeading';
import { StructuredDarRp } from '../components/StructuredDarRp';
import { DAR, Files, Researcher } from '../libs/ajax';
import { Models } from '../libs/models';
import { Theme } from '../libs/theme';
import * as ld from 'lodash';


class AccessPreview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      hasUseRestriction: false,
      consentName: '',
      isQ1Expanded: true,
      isQ2Expanded: false,
      consent: {
        translatedUseRestriction: ''
      },
      darInfo: Models.dar,
      researcherProfile: null
    };
  }

  componentDidMount() {
    this.darReviewInfo();
  }

  back = () => {
    this.props.history.goBack();
  };

  async darReviewInfo() {

    let referenceId = this.props.match.params.referenceId;

    this.setState(prev => {
      prev.dar_id = this.props.match.params.referenceId;
    });

    DAR.getDarConsent(referenceId).then(
      consent => {
        this.setState(prev => {
          prev.consent = consent;
          prev.consentName = consent.name;
        });
      }
    );

    DAR.hasUseRestriction(referenceId).then(
      useRestriction => {
        if (useRestriction.hasUseRestriction === true) {
          this.setState(prev => {
            prev.hasUseRestriction = true;
          });
        }
      }
    );

    DAR.describeDar(referenceId).then(
      darInfo => {
        Researcher.getResearcherProfile(darInfo.researcherId).then(
          researcherProfile => {
            this.setState(prev => {
              prev.darInfo = darInfo;
              prev.researcherProfile = researcherProfile;
              return prev;
            });
          });
      }
    );

  };

  downloadDAR = () => {
    Files.getDARFile(this.props.match.params.referenceId);
  };

  toggleQ1 = (e) => {
    this.setState(prev => {
      prev.isQ1Expanded = !prev.isQ1Expanded;
      return prev;
    });
  };

  toggleQ2 = (e) => {
    this.setState(prev => {
      prev.isQ2Expanded = !prev.isQ2Expanded;
      return prev;
    });
  };

  render() {

    const { translatedUseRestriction } = this.state.consent;

    return (

      div({ className: 'container container-wide' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding' }, [
            PageHeading({
              id: 'previewAccess', imgSrc: '/images/icon_access.png', iconSize: 'medium',
              color: 'access', title: 'Data Access Congruence Preview'
            }),
            DataAccessRequest({
              isRendered: !_.isEmpty(this.state.darInfo.datasets),
              dar: this.state.darInfo,
              consentName: this.state.consentName
            })
          ]),
          div({ className: 'col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding' }, [
            a({ id: 'btn_back', onClick: () => this.back(), className: 'btn-primary btn-back' }, [
              i({ className: 'glyphicon glyphicon-chevron-left' }), 'Back'
            ])
          ])
        ]),

        div({ className: 'row no-margin' }, [
          CollapsiblePanel({
            id: 'accessCollectVotes',
            onClick: this.toggleQ1,
            color: 'access',
            title: this.state.hasUseRestriction ? 'Q1. Should data access be granted to this applicant?'
              : 'Should data access be granted to this applicant?',
            expanded: this.state.isQ1Expanded
          }, [

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [

              ApplicationSummary({
                isRendered: !ld.isNil(this.state.darInfo) && !ld.isNil(this.state.researcherProfile),
                darInfo: this.state.darInfo,
                downloadDAR: this.downloadDAR,
                researcherProfile: this.state.researcherProfile }),

              div({ className: 'col-lg-4 col-md-4 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
                div({ className: 'panel-heading cm-boxhead dul-color' }, [
                  h4({}, ['Data Use Limitations'])
                ]),
                div({ id: 'panel_dul', className: 'panel-body cm-boxbody' }, [
                  div({ className: 'row dar-summary' }, [
                    div({ className: 'control-label dul-color' }, ['Structured Limitations']),
                    div({ className: 'response-label translated-restriction', dangerouslySetInnerHTML: { __html: translatedUseRestriction } }, [])
                  ])
                ])
              ])
            ])
          ])
        ]),

        div({ className: 'row no-margin' }, [
          CollapsiblePanel({
            isRendered: this.state.hasUseRestriction,
            id: 'rpCollectVotes',
            onClick: this.toggleQ1,
            color: 'access',
            title: 'Q2. Was the research purpose accurately converted to a structured format?',
            expanded: this.state.isQ2Expanded
          }, [

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
              div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
                div({ className: 'panel-heading cm-boxhead access-color' }, [
                  h4({}, ['Research Purpose'])
                ]),
                div({ id: 'panel_researchPurpose', className: 'panel-body cm-boxbody' }, [
                  div({ style: { 'marginBottom': '10px' } }, [this.state.darInfo.rus]),
                  button({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color', onClick: this.downloadDAR },
                    ['Download Full Application'])
                ])
              ]),

              div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
                div({ className: 'panel-heading cm-boxhead access-color' }, [
                  h4({}, ['Structured Research Purpose'])
                ]),
                div({ style: {paddingLeft: '2rem'}}, [
                  StructuredDarRp({
                    darInfo: this.state.darInfo,
                    headerStyle: { display: 'none' },
                    textStyle: Theme.legacy
                  })
                ]),
              ])
            ])
          ])
        ])
      ])
    );
  }
}

export default AccessPreview;
