import _ from 'lodash';
import { Component, Fragment } from 'react';
import { a, b, button, div, h, h4, i, label, li, span, ul } from 'react-hyperscript-helpers';
import { Alert } from '../components/Alert';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { DataAccessRequest } from '../components/DataAccessRequest';
import { PageHeading } from '../components/PageHeading';
import { DAR, Files } from '../libs/ajax';
import { Models } from '../libs/models';


class AccessPreview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      hasUseRestriction: false,
      hasLibraryCard: false,
      consentName: '',
      isQ1Expanded: true,
      isQ2Expanded: false,
      consent: {
        translatedUseRestriction: ''
      },
      darInfo: Models.dar
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

    DAR.getDarFields(referenceId, 'translated_restriction').then(
      data => {
        this.setState(prev => {
          prev.rp = data.translated_restriction;
        });
      }
    );

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
        this.setState(prev => {
          prev.darInfo = darInfo;
          return prev;
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
              div({ className: 'col-lg-8 col-md-8 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
                div({ className: 'panel-heading cm-boxhead access-color' }, [
                  h4({}, ['Application Summary'])
                ]),

                div({ id: 'panel_applicationSummary', className: 'panel-body row' }, [
                  div({ className: 'col-lg-4 col-md-5 col-sm-5 col-xs-12' }, [

                    div({ isRendered: this.state.darInfo.havePI, className: 'row no-margin' }, [
                      label({ className: 'control-label access-color' }, ['PI: ']),
                      span({ id: 'lbl_principalInvestigator', className: 'response-label', style: { 'paddingLeft': '5px' } },
                        [this.state.darInfo.pi])
                    ]),
                    div({ className: 'row no-margin' }, [
                      label({ className: 'control-label access-color' }, ['Researcher: ']),
                      span({ id: 'lbl_researcher', className: 'response-label', style: { 'paddingLeft': '5px' } }, [this.state.darInfo.profileName])
                    ]),
                    div({ className: 'row no-margin' }, [
                      label({ className: 'control-label no-padding' }, ['Status: ']),
                      span({ id: 'lbl_researcherStatus', className: 'response-label', style: { 'paddingLeft': '5px' } }, [this.state.darInfo.status])
                    ]),
                    div({ isRendered: this.state.darInfo.hasAdminComment, className: 'row no-margin' }, [
                      span({}, [
                        label({ className: 'control-label no-padding' }, ['Comments: ']),
                        span({ id: 'lbl_adminComment', className: 'response-label', style: { 'paddingLeft': '5px' } },
                          [this.state.darInfo.adminComment])
                      ])
                    ]),
                    div({ className: 'row no-margin' }, [
                      label({ className: 'control-label no-padding' }, ['NIH Library Card: ']),
                      div({ className: 'library-flag ' + (this.state.hasLibraryCard ? 'flag-enabled' : 'flag-disabled') }, [
                        div({ className: 'library-icon' }),
                        span({ className: 'library-label' }, 'Library Card')
                      ])
                    ]),
                    div({ className: 'row no-margin' }, [
                      label({ className: 'control-label access-color' }, ['Institution: ']),
                      span({ id: 'lbl_institution', className: 'response-label', style: { 'paddingLeft': '5px' } }, [this.state.darInfo.institution])
                    ]),
                    div({ className: 'row no-margin' }, [
                      label({ className: 'control-label access-color' }, ['Department: ']),
                      span({ id: 'lbl_department', className: 'response-label', style: { 'paddingLeft': '5px' } }, [this.state.darInfo.department])
                    ]),
                    div({ className: 'row no-margin' }, [
                      label({ className: 'control-label access-color' }, ['City: ']),
                      span({ id: 'lbl_state', className: 'response-label', style: { 'paddingLeft': '5px' } }, [this.state.darInfo.city])
                    ]),
                    div({ className: 'row no-margin' }, [
                      label({ className: 'control-label access-color' }, ['Country: ']),
                      span({ id: 'lbl_country', className: 'response-label', style: { 'paddingLeft': '5px' } }, [this.state.darInfo.country])
                    ]),
                    button({
                      id: 'btn_downloadFullApplication',
                      className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 btn-secondary btn-download-pdf hover-color', onClick: this.downloadDAR
                    }, ['Download Full Application'])
                  ]),

                  div({ className: 'col-lg-8 col-md-7 col-sm-7 col-xs-12' }, [

                    div({ className: 'row dar-summary' }, [
                      div({ className: 'control-label access-color' }, ['Research Purpose']),
                      div({ id: 'lbl_rus', className: 'response-label' }, [this.state.darInfo.rus])
                    ]),
                    div({ isRendered: this.state.darInfo.hasPurposeStatements, className: 'row dar-summary' }, [
                      div({ className: 'control-label access-color' }, ['Purpose Statement']),
                      div({ className: 'response-label' }, [
                        ul({}, [
                          this.state.darInfo.purposeStatements.map((purpose, rIndex) => {
                            return h(Fragment, { key: rIndex }, [
                              li({ id: 'lbl_purposeStatement_' + rIndex, className: purpose.manualReview ? 'cancel-color' : '' }, [
                                b({}, [purpose.title]), purpose.description
                              ])
                            ]);
                          })
                        ]),
                        div({
                          isRendered: this.state.darInfo.purposeManualReview && !this.state.darInfo.researchTypeManualReview,
                          className: 'summary-alert'
                        }, [
                          Alert({
                            id: 'purposeStatementManualReview', type: 'danger',
                            title: 'This research involves studying a sensitive population and requires manual review.'
                          })
                        ])
                      ])
                    ]),

                    div({ className: 'row dar-summary' }, [
                      div({ className: 'control-label access-color' }, ['Type of Research']),
                      div({ className: 'response-label' }, [
                        ul({}, [
                          this.state.darInfo.researchType.map((type, rIndex) => {
                            return h(Fragment, { key: rIndex }, [
                              li({ id: 'lbl_researchType_' + rIndex, className: type.manualReview ? 'cancel-color' : '' }, [
                                b({}, [type.title]), type.description
                              ])
                            ]);
                          })
                        ])
                      ])
                    ]),
                    div({ isRendered: this.state.darInfo.researchTypeManualReview, className: 'summary-alert' }, [
                      Alert({ id: 'researchTypeManualReview', type: 'danger', title: 'This research requires manual review.' })
                    ]),

                    div({ isRendered: this.state.darInfo.hasDiseases, className: 'row dar-summary' }, [
                      div({ className: 'control-label access-color' }, ['Disease area(s)']),
                      div({ className: 'response-label' }, [
                        ul({}, [
                          this.state.darInfo.diseases.map((disease, rIndex) => {
                            return h(Fragment, { key: rIndex }, [
                              li({ id: 'lbl_disease_' + rIndex }, [
                                disease
                              ])
                            ]);
                          })
                        ])
                      ])
                    ])
                  ])
                ])
              ]),

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
                div({
                  id: 'panel_structuredPurpose', className: 'panel-body cm-boxbody translated-restriction',
                  dangerouslySetInnerHTML: { __html: this.state.rp }
                }, [])
              ])
            ])
          ])
        ])
      ])
    );
  }
}

export default AccessPreview;
