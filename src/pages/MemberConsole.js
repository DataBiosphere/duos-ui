import _ from 'lodash';
import { isNil } from 'lodash/fp';
import { Component, Fragment } from 'react';
import { button, div, h, img, span } from 'react-hyperscript-helpers';
import { SearchBox } from '../components/SearchBox';
import { DAR, PendingCases, User} from '../libs/ajax';
import { Storage } from '../libs/storage';
import {applyTextHover, getDatasets, NavigationUtils, removeTextHover} from '../libs/utils';
import { Styles } from "../libs/theme";
import {DataUseTranslation} from '../libs/dataUseTranslation';
import PaginationBar from "../components/PaginationBar";
import lockIcon from '../images/lock-icon.png';
import DarModal from "../components/modals/DarModal";

class MemberConsole extends Component {

  constructor(props) {
    super(props);

    let currentUser = Storage.getCurrentUser();

    this.state = {
      currentUser: currentUser,
      showModal: false,
      accessLimit: 5,
      currentAccessPage: 1,
      electionsList: {
        dul: [],
        access: [],
        rp: []
      },
      totalDulPendingVotes: 0,
      totalAccessPendingVotes: 0,
      totalResearchPurposePendingVotes: 0,
    };
  }

  handleAccessPageChange = page => {
    this.setState(prev => {
      prev.currentAccessPage = page;
      return prev;
    });
  };

  handleAccessSizeChange = size => {
    this.setState(prev => {
      prev.accessLimit = size;
      prev.currentAccessPage = 1;
      return prev;
    });
  };

  handleOpenModal = () =>{
    this.setState({ showModal: true });
  };

  handleCloseModal= () => {
    this.setState({ showModal: false });
  };

  componentDidMount() {
    this.getMembersInfo();
  }

  async getMembersInfo() {
    let currentUser = Storage.getCurrentUser();

    const duls = await PendingCases.findConsentPendingCasesByUser(currentUser.dacUserId);
    const dars = await PendingCases.findDataRequestPendingCases();

    this.setState(prev => {
      prev.currentUser = currentUser;
      prev.totalDulPendingVotes = duls.totalDulPendingVotes;
      prev.electionsList.dul = duls.dul;
      prev.totalAccessPendingVotes = dars.totalAccessPendingVotes;
      // Filter vote-able elections. See https://broadinstitute.atlassian.net/browse/DUOS-789
      // for more work related to ensuring closed elections aren't displayed here.
      prev.electionsList.access = _.filter(dars.access, (e) => { return e.electionStatus !== 'Closed'; });
      return prev;
    });

  }

  openAccessReview = (referenceId) => async () => {
    const pathStart = NavigationUtils.accessReviewPath();
    this.props.history.push(`${pathStart}/${referenceId}`);
  };

  handleSearchDul = (query) => {
    this.setState({ searchDulText: query });
  };

  handleSearchDar = (query) => {
    this.setState({ searchDarText: query });
  };

  searchTable = (query) => (row) => {
    if (query !== undefined) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  render() {

    const { searchDarText, showModal, darDetails, researcher } = this.state;
    const pageCount = Math.ceil((this.state.electionsList.access.filter(this.searchTable(searchDarText)).length).toFixed(1) / (this.state.accessLimit));
    const closeSummaryModal = () => this.setState({ showModal: false });
    const openSummaryModal = async (dar) => {
      let darDetails;
      await DAR.describeDar(dar.referenceId).then((resp) => { darDetails = resp; });
      let researcherPromise;
      let datasets;
      if (!isNil(darDetails)) {
        darDetails.researchType = DataUseTranslation.generateResearchTypes(darDetails);
        await User.getById(darDetails.researcherId).then((resp) => { researcherPromise = resp; });
        await getDatasets(darDetails).then((resp) => { datasets = resp; });
      }
      this.setState({showModal: true, darDetails: darDetails, datasets: datasets, researcher: researcherPromise });
    };

    return (

      div({style: Styles.PAGE}, [
        div({ style: {display: "flex", justifyContent: "space-between"}}, [
          div({className: "left-header-section", style: Styles.LEFT_HEADER_SECTION}, [
            div({style: Styles.ICON_CONTAINER}, [
              img({
                id: 'lock-icon',
                src: lockIcon,
                style: Styles.HEADER_IMG
              })
            ]),
            div({style: Styles.HEADER_CONTAINER}, [
              div({style: Styles.TITLE}, ['Data Access Request Review']),
              div({style: Styles.SMALL}, ['Should data access be granted to this applicant?'])
            ])
          ]),
          div({className: "right-header-section", style: Styles.RIGHT_HEADER_SECTION}, [
            h(SearchBox, { searchHandler: this.handleSearchDar, pageHandler: this.handleAccessPageChange })
          ])
        ]),
        div({ style: Styles.TABLE.CONTAINER }, [
          div({style: Styles.TABLE.HEADER_ROW}, [
            div({style: Styles.TABLE.DATA_ID_CELL }, ["DAR ID"]),
            div({style: Styles.TABLE.TITLE_CELL }, ["Title"]),
            div({style: Styles.TABLE.DAC_CELL }, ["DAC"]),
            div({style: Styles.TABLE.ELECTION_STATUS_CELL }, ["Status"]),
            div({style: Styles.TABLE.DAC_CELL }, ["Logged"]),
            div({style: Styles.TABLE.ELECTION_STATUS_CELL }, [
              "Review/Vote",
              div({ isRendered: this.state.totalAccessPendingVotes > 0, className: 'pcases-small-tag' }, [this.state.totalAccessPendingVotes])
            ])
          ]),
          this.state.electionsList.access
            .filter(this.searchTable(searchDarText))
            .slice((this.state.currentAccessPage - 1) * this.state.accessLimit, this.state.currentAccessPage * this.state.accessLimit).map((pendingCase, rIndex) => {
              const borderStyle = rIndex > 0 ? {borderTop: "1px solid rgba(109,110,112,0.2)"} : {};
              const dacName = !isNil(pendingCase.dac) ? pendingCase.dac.name : "--";
              return h(Fragment, { key: rIndex }, [
                div({style: Object.assign({}, borderStyle, Styles.TABLE.RECORD_ROW), paddingtop: '1rem' }, [
                  div({
                    style: Object.assign({}, Styles.TABLE.DATA_ID_CELL,  Styles.TABLE.DATA_REQUEST_TEXT),
                    onClick: () => openSummaryModal(pendingCase),
                    onMouseEnter: applyTextHover,
                    onMouseLeave: (e) => removeTextHover(e, Styles.TABLE.DATA_REQUEST_TEXT.color)
                  },  [pendingCase.frontEndId]),
                  div({ style: Object.assign({}, Styles.TABLE.RECORD_TEXT, Styles.TABLE.TITLE_CELL) }, [pendingCase.projectTitle]),
                  div({ style: Object.assign({}, Styles.TABLE.RECORD_TEXT, Styles.TABLE.DAC_CELL) }, [dacName]),
                  div({ style: Object.assign({}, Styles.TABLE.RECORD_TEXT, Styles.TABLE.ELECTION_STATUS_CELL) }, [
                    span({ isRendered: pendingCase.isReminderSent === true }, ['URGENT!']),
                    span({ isRendered: (pendingCase.status === 'pending') && (pendingCase.isReminderSent !== true) }, ['Pending']),
                    span({ isRendered: (pendingCase.status === 'editable') && (pendingCase.isReminderSent !== true) }, ['Editable'])
                  ]),
                  div({ style: Object.assign({}, Styles.TABLE.RECORD_TEXT, Styles.TABLE.DAC_CELL)}, [pendingCase.logged]),
                  div({  style: Object.assign({}, Styles.TABLE.RECORD_TEXT, Styles.TABLE.ELECTION_STATUS_CELL, {paddingtop: "0.5rem"}) }, [
                    button({
                      onClick: this.openAccessReview(pendingCase.referenceId),
                      id: pendingCase.frontEndId + '_btnVoteAccess', name: 'btn_voteAccess',
                      className: 'cell-button hover-color'
                    }, [
                      span({ isRendered: pendingCase.alreadyVoted === false }, ['Vote']),
                      span({ isRendered: pendingCase.alreadyVoted === true }, ['Edit'])
                    ])
                  ])
                ])
              ]);
            }),
          h(DarModal, {isRendered: !isNil(darDetails), showModal, closeModal: closeSummaryModal, darDetails, datasets: this.state.datasets, researcher }),
          h(PaginationBar, {pageCount, currentPage: this.state.currentAccessPage, tableSize: this.state.accessLimit, goToPage: this.handleAccessPageChange, changeTableSize: this.handleAccessSizeChange}),
        ])
      ])
    );
  }
}

export default MemberConsole;
