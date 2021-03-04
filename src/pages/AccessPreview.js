import _ from 'lodash';
import { Component } from 'react';
import { a, button, div, h4, i, h } from 'react-hyperscript-helpers';
import { ApplicationSummary } from '../components/ApplicationSummary';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import DataAccessRequestHeader from '../components/DataAccessRequestHeader';
import { PageHeading } from '../components/PageHeading';
import { StructuredDarRp } from '../components/StructuredDarRp';
import { DAR, Files, Researcher } from '../libs/ajax';
import { Models } from '../libs/models';
import { Theme } from '../libs/theme';
import * as ld from 'lodash';
import TranslatedDULComponent from '../components/TranslatedDULComponent';
import accessIcon from '../images/icon_access.png';

class AccessPreview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      consentName: '',
      isQ1Expanded: true,
      isQ2Expanded: false,
      dataUse: {},
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
          prev.dataUse = consent.dataUse;
          prev.consentName = consent.name;
        });
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
    return (
      div({ className: 'container container-wide' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding' }, [
            PageHeading({
              id: 'previewAccess', imgSrc: accessIcon, iconSize: 'medium',
              color: 'access', title: 'Data Access Congruence Preview'
            }),
            h(DataAccessRequestHeader, {
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
            title: 'Q1. Should data access be granted to this applicant?',
            expanded: this.state.isQ1Expanded
          }, [

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [

              ApplicationSummary({
                isRendered: !ld.isNil(this.state.darInfo) && !ld.isNil(this.state.researcherProfile),
                mrDAR: null,
                darInfo: this.state.darInfo,
                downloadDAR: this.downloadDAR,
                researcherProfile: this.state.researcherProfile }),

              div({
                className: 'col-lg-4 col-md-4 col-sm-12 col-xs-12 panel panel-primary cm-boxes',
                isRendered: !ld.isEmpty(this.state.dataUse)
              }, [
                h(TranslatedDULComponent,{restrictions: this.state.dataUse})
              ])
            ])
          ])
        ]),

        div({ className: 'row no-margin' }, [
          CollapsiblePanel({
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
