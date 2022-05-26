import _ from 'lodash';
import { Component } from 'react';
import {button, div, h3, hh, hr, iframe, span} from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { StatsBox } from '../components/StatsBox';
import { PendingCases, StatFiles, Summary } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { USER_ROLES } from '../libs/utils';
import { Config } from '../libs/config';
import statisticsIcon from '../images/icon_statistics.png';
import dulIcon from '../images/icon_dul.png';
import accessIcon from '../images/icon_access.png';

const authDownloadRoles = [USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.member];

export const SummaryVotes = hh(class SummaryVotes extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      chartData: this.initialState(),
      powerBiUrl: ''
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  componentDidMount() {
    this.getSummaryInfo();
    this.getPowerBiDashboard();
  }

  isAuthedToDownload() {
    const userRoleNames = _.map(Storage.getCurrentUserRoles(), 'name');
    return _.intersection(authDownloadRoles, userRoleNames).length > 0;
  }

  initialState() {
    return {
      accessTotal: [
        ['Results', 'Votes'],
        ['Reviewed cases', 0],
        ['Pending cases', 0]
      ],
      accessReviewed: [
        ['Results', 'Votes'],
        ['Yes', 0],
        ['No', 0]
      ],
      dulTotal: [
        ['Results', 'Votes'],
        ['Reviewed cases', 0],
        ['Pending cases', 0]
      ],
      dulReviewed: [
        ['Results', 'Votes'],
        ['Yes', 0],
        ['No', 0]
      ],
      RPTotal: [
        ['Results', 'Votes'],
        ['Reviewed cases', 0],
        ['Pending cases', 0]
      ],
      RPReviewed: [
        ['Results', 'Votes'],
        ['Yes', 0],
        ['No', 0]
      ],
      VaultReviewed: [
        ['Results', 'Votes'],
        ['Yes', 0],
        ['No', 0]
      ],
      Agreement: [
        ['Results', 'Votes'],
        ['Agreement', 0],
        ['Disagreement', 0]
      ]
    };
  }

  getSummaryInfo() {
    PendingCases.findSummary({}, {}).then(summaryData => {
      this.setState(prev => {
        prev.chartData = summaryData;
        return prev;
      });
    });
  }

  getPowerBiDashboard() {
    Config.getPowerBiUrl().then(url => {
      this.setState({powerBiUrl: url});
    });
  }

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  render() {

    return (
      div({ className: 'container' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding' }, [
            PageHeading({
              id: 'summaryVotes',
              imgSrc: statisticsIcon,
              iconSize: 'large',
              color: 'common',
              title: 'Votes Statistics',
              description: 'Summary statistics on the Data Access Committee and votes system'
            }),
          ]),
        ]),
        hr({ className: 'section-separator' }),

        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-10 col-md-9 col-sm-8 col-xs-12 no-padding' }, [
            PageSubHeading({
              id: 'summaryVotesDul',
              imgSrc: dulIcon,
              color: 'dul',
              title: 'Data Use Limitations Statistics',
              description: 'Summary of votes on whether the consent limitations were accurately converted into a structured format'
            }),
          ]),

          button({
            id: 'btn_downloadStatsDul',
            className: 'col-lg-2 col-md-3 col-sm-4 col-xs-12 search-wrapper btn-primary dul-background',
            onClick: () => Summary.getFile('TranslateDUL'),
            isRendered: this.isAuthedToDownload()
          }, [
            span({}, ['Download stats']),
            span({ className: 'glyphicon glyphicon-download caret-margin', 'aria-hidden': 'true' }),
          ]),
        ]),

        div({ className: 'row fsi-row-lg-level fsi-row-md-level' }, [
          StatsBox({
            id: 'allCasesDul',
            subtitle: 'All Cases',
            data: this.state.chartData.dulTotal,
            options: 'dul',
            className: 'result_chart'
          }),

          StatsBox({
            id: 'reviewedCasesDul',
            subtitle: 'Reviewed cases results',
            data: this.state.chartData.dulReviewed,
            options: 'dul',
            className: 'result_chart'
          })
        ]),

        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-10 col-md-9 col-sm-8 col-xs-12 no-padding' }, [
            PageSubHeading({
              id: 'summaryVotesAccess',
              imgSrc: accessIcon,
              color: 'access',
              title: 'Data Access Statistics',
              description: 'Summary of votes on whether the researcher should be allowed to access a research study'
            }),
          ]),

          button({
            id: 'btn_downloadStatsAccess',
            className: 'col-lg-2 col-md-3 col-sm-4 col-xs-12 search-wrapper btn-primary access-background',
            onClick: () => Summary.getFile('DataAccess'),
            isRendered: this.isAuthedToDownload()
          }, [
            span({}, ['Download stats']),
            span({ className: 'glyphicon glyphicon-download caret-margin', 'aria-hidden': 'true' }),
          ]),
        ]),

        h3({ className: 'stats-box-title access-color' }, ['1. Should data access be granted to this applicant ?']),

        div({ className: 'row fsi-row-lg-level fsi-row-md-level' }, [
          StatsBox({
            id: 'allCasesAccess',
            subtitle: 'All Cases',
            data: this.state.chartData.accessTotal,
            options: 'access',
            className: 'result_chart',
            clickHandler: this.isAuthedToDownload() ? () => this.getDarReport('reviewed', 'ReviewedDataAccessRequests.tsv') : undefined,
            buttonLabel: this.isAuthedToDownload() ? 'Download all cases' : undefined
          }),
          StatsBox({
            id: 'reviewedCasesAccess',
            subtitle: 'Reviewed cases results',
            data: this.state.chartData.accessReviewed,
            options: 'access',
            className: 'result_chart',
            clickHandler: () => this.getDarReport('approved', 'ApprovedDataAccessRequests.tsv'),
            buttonLabel: 'Download approved cases'
          })
        ]),

        hr({ className: 'box-separator' }),

        h3({ className: 'stats-box-title access-color' }, ['2. Was the research purpose accurately converted to a structured format ?']),

        div({ className: 'row fsi-row-lg-level fsi-row-md-level' }, [
          StatsBox({
            id: 'allCasesRP',
            subtitle: 'All Cases',
            data: this.state.chartData.RPTotal,
            options: 'access',
            className: 'result_chart'
          }),
          StatsBox({
            id: 'reviewedCasesRP',
            subtitle: 'Reviewed cases results',
            data: this.state.chartData.RPReviewed,
            options: 'access',
            className: 'result_chart'
          }),
        ]),

        hr({ className: 'box-separator' }),

        h3({ className: 'stats-box-title access-color' }, ['Evaluation of automated matching in comparison with the Data Access Committee decision']),

        div({ className: 'row fsi-row-lg-level fsi-row-md-level' }, [
          StatsBox({
            id: 'automatedCases',
            subtitle: 'Cases reviewed by automated matching',
            data: this.state.chartData.VaultReviewed,
            options: 'access',
            className: 'result_chart'
          }),
          StatsBox({
            id: 'agreement',
            subtitle: 'Agreement between automated matching and Data Access Committee',
            data: this.state.chartData.Agreement,
            options: 'access',
            className: 'result_chart'
          }),
        ]),
        div({}, [
          div({ style: { overflow: 'hidden', paddingTop: '75%', position: 'relative' }}, [
            iframe({
              src: this.state.powerBiUrl,
              allowFullScreen: true,
              loading: 'lazy',
              style: { border: '0', height: '100%', left: '0', position: 'absolute', top: '0', width: '100%' }
            })
          ])
        ])
      ])
    );
  }

  getDarReport(fileType, fileName) {
    StatFiles.getDARsReport(fileType, fileName);
  }

});
