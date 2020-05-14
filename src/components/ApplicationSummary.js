import { Component, Fragment } from 'react';
import { div, hh, span, h, h4, label, button, ul, li, b, a } from 'react-hyperscript-helpers';
import { Alert } from './Alert';
import { StructuredDarRp } from './StructuredDarRp';
import {Theme} from '../libs/theme';
import * as Utils from '../libs/utils';
import * as ld from 'lodash';

export const ApplicationSummary = hh(class ApplicationSummary extends Component {
  render() {
    const { hasUseRestriction, mrDAR, darInfo, downloadDAR, researcherProfile } = this.props;
    const libraryCards = ld.get(researcherProfile, 'libraryCards', []);
    return div({className: 'col-lg-8 col-md-8 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
      div({ className: 'panel-heading cm-boxhead access-color' }, [
        h4({}, ['Application Summary'])
      ]),

      div({ id: 'panel_applicationSummary', className: 'panel-body row' }, [
        div({ className: 'col-lg-4 col-md-5 col-sm-5 col-xs-12' }, [

          div({ isRendered: darInfo.havePI, className: 'row no-margin' }, [
            label({ className: 'control-label access-color' }, ['PI: ']),
            span({ id: 'lbl_principalInvestigator', className: 'response-label', style: { 'paddingLeft': '5px' } },
              [darInfo.pi])
          ]),
          div({ className: 'row no-margin' }, [
            label({ className: 'control-label access-color' }, ['Researcher: ']),
            span({ id: 'lbl_researcher', className: 'response-label', style: { 'paddingLeft': '5px' } }, [darInfo.profileName])
          ]),
          div({ className: 'row no-margin' }, [
            label({ className: 'control-label no-padding' }, ['Status: ']),
            span({ id: 'lbl_researcherStatus', className: 'response-label', style: { 'paddingLeft': '5px' } }, [darInfo.status])
          ]),
          div({ isRendered: darInfo.hasAdminComment, className: 'row no-margin' }, [
            span({}, [
              label({ className: 'control-label no-padding' }, ['Comments: ']),
              span({ id: 'lbl_adminComment', className: 'response-label', style: { 'paddingLeft': '5px' } },
                [darInfo.adminComment])
            ])
          ]),
          div({ className: 'row no-margin' }, [
            label({ className: 'control-label no-padding' }, ['NIH Library Card: ']),
            div({ className: 'library-flag ' + (ld.isEmpty(libraryCards) ? 'flag-disabled' : 'flag-enabled') }, [
              div({ className: 'library-icon' }),
              span({ className: 'library-label' }, 'Library Card')
            ])
          ]),
          div({ className: 'row no-margin' }, [
            label({ className: 'control-label access-color' }, ['Institution: ']),
            span({ id: 'lbl_institution', className: 'response-label', style: { 'paddingLeft': '5px' } }, [darInfo.institution])
          ]),
          div({ className: 'row no-margin' }, [
            label({ className: 'control-label access-color' }, ['Department: ']),
            span({ id: 'lbl_department', className: 'response-label', style: { 'paddingLeft': '5px' } }, [darInfo.department])
          ]),
          div({ className: 'row no-margin' }, [
            label({ className: 'control-label access-color' }, ['City: ']),
            span({ id: 'lbl_state', className: 'response-label', style: { 'paddingLeft': '5px' } }, [darInfo.city])
          ]),
          div({ className: 'row no-margin' }, [
            label({ className: 'control-label access-color' }, ['Country: ']),
            span({ id: 'lbl_country', className: 'response-label', style: { 'paddingLeft': '5px' } }, [darInfo.country])
          ]),
          button({
            id: 'btn_downloadFullApplication',
            className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 btn-secondary btn-download-pdf hover-color', onClick: downloadDAR
          }, ['Download Full Application'])
        ]),

        div({ className: 'col-lg-8 col-md-7 col-sm-7 col-xs-12' }, [

          div({ className: 'row dar-summary' }, [
            div({ className: 'control-label access-color' }, ['Research Purpose']),
            div({ id: 'lbl_rus', className: 'response-label' }, [darInfo.rus])
          ]),
          div({ isRendered: darInfo.hasPurposeStatements, className: 'row dar-summary' }, [
            div({ className: 'control-label access-color' }, ['Purpose Statement']),
            div({ className: 'response-label' }, [
              ul({}, [
                darInfo.purposeStatements.map((purpose, rIndex) => {
                  return h(Fragment, { key: rIndex }, [
                    li({ id: 'lbl_purposeStatement_' + rIndex, className: purpose.manualReview ? 'cancel-color' : '' }, [
                      b({}, [purpose.title]), purpose.description
                    ])
                  ]);
                })
              ]),
              div({
                isRendered: darInfo.purposeManualReview && !darInfo.researchTypeManualReview,
                className: 'summary-alert'
              }, [
                Alert({
                  id: 'purposeStatementManualReview', type: 'danger',
                  title: 'This research involves studying a sensitive population and requires manual review.'
                })
              ])
            ])
          ]),

          div({ isRendered: hasUseRestriction, className: 'row dar-summary' }, [
            div({ className: 'control-label access-color' }, ['Structured Research Purpose']),
            div({ className: 'response-label translated-restriction'}, [
              StructuredDarRp({
                darInfo: darInfo,
                headerStyle: { display: 'none' },
                textStyle: Theme.legacy
              })
            ]),
            a({
              isRendered: !ld.isNil(mrDAR),
              onClick: () => Utils.download('machine-readable-DAR.json', mrDAR),
              filename: 'machine-readable-DAR.json',
              value: mrDAR, className: 'italic hover-color'
            }, ['Download DAR machine-readable format'])
          ]),

          div({ className: 'row dar-summary' }, [
            div({ className: 'control-label access-color' }, ['Type of Research']),
            div({ className: 'response-label' }, [
              ul({}, [
                darInfo.researchType.map((type, rIndex) => {
                  return h(Fragment, { key: rIndex }, [
                    li({ id: 'lbl_researchType_' + rIndex, className: type.manualReview ? 'cancel-color' : '' }, [
                      b({}, [type.title]), type.description
                    ])
                  ]);
                })
              ])
            ])
          ]),
          div({ isRendered: darInfo.researchTypeManualReview, className: 'summary-alert' }, [
            Alert({ id: 'researchTypeManualReview', type: 'danger', title: 'This research requires manual review.' })
          ]),

          div({ isRendered: darInfo.hasDiseases, className: 'row dar-summary' }, [
            div({ className: 'control-label access-color' }, ['Disease area(s)']),
            div({ className: 'response-label' }, [
              ul({}, [
                darInfo.diseases.map((disease, rIndex) => {
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
    ]);
  }
});