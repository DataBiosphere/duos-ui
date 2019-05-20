import { Component, Fragment } from 'react';
import { div, hr, h, span, a, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { AddDacModal } from '../components/modals/AddDacModal';
import { DacMembersModal } from '../components/modals/DacMembersModal';
import { DacDatasetsModal } from '../components/modals/DacDatasetsModal';
import { PaginatorBar } from "../components/PaginatorBar";
import { SearchBox } from '../components/SearchBox';

const limit = 10;

class AdminManageDac extends Component { 

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      showModal: false,
      showMembersModal: false,
      showDatasetsModal: false,
      value: '',
      limit: limit,
      dacsList: {
        dac: []
      },
      searchDUL: '',
      alertMessage: undefined,
      alertTitle: undefined,
    };

    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);

    this.addDac = this.addDac.bind(this);
    this.closeAddDacModal = this.closeAddDacModal.bind(this);
    this.okAddDacModal = this.okAddDacModal.bind(this);
    this.afterAddDacModalOpen = this.afterAddDacModalOpen.bind(this);

    this.viewMembers = this.viewMembers.bind(this);
    this.closeViewMembersModal = this.closeViewMembersModal.bind(this);
    this.okViewMembersModal = this.okViewMembersModal.bind(this);
    this.afterViewMembersModalOpen = this.afterViewMembersModalOpen.bind(this);

    this.viewDatasets = this.viewDatasets.bind(this);
    this.closeViewDatasetsModal = this.closeViewDatasetsModal.bind(this);
    this.okViewDatasetsModal = this.okViewDatasetsModal.bind(this);
    this.afterViewDatasetsModalOpen = this.afterViewDatasetsModalOpen.bind(this);
  }

  handlePageChange = page => {
    this.setState(prev => {
      prev.currentPage = page;
      return prev;
    });
  };

  handleSizeChange = size => {
    this.setState(prev => {
      prev.limit = size;
      prev.currentPage = 1;
      return prev;
    });
  };

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  async editDac() {
    this.setState({
      showModal: true,
      isEditMode: true
    });
  };

  addDac() {
    this.setState({
      showModal: true,
      isEditMode: false
    });
  }

  viewMembers() {
    this.setState({
      showMembersModal: true,
    });
  }

  viewDatasets() {
    this.setState({
      showDatasetsModal: true,
    });
  }

  closeAddDacModal() {
    this.setState(prev => {
      prev.showModal = false;
      return prev;
    });
  }

  closeViewMembersModal() {
    this.setState(prev => {
      prev.showMembersModal = false;
      return prev;
    });
  }

  closeViewDatasetsModal() {
    this.setState(prev => {
      prev.showDatasetsModal = false;
      return prev;
    });
  }

  async okAddDacModal() {
    this.setState(prev => {
      prev.showModal = false;
      return prev;
    });
  }

  async okViewMembersModal() {
    this.setState(prev => {
      prev.showMembersModal = false;
      return prev;
    });
  }

  async okViewDatasetsModal() {
    this.setState(prev => {
      prev.showDatasetsModal = false;
      return prev;
    });
  }

  afterAddDacModalOpen() {
  }

  afterViewMembersModalOpen() {
  }

  afterViewDatasetsModalOpen() {
  }
  
  handleSearchDac = (query) => {
    this.setState({ searchDacText: query });
  };

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  render() {

    const { currentPage, limit, searchDacText } = this.state;

    return (
      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({
              id: "manageDac",
              imgSrc: "/images/icon_manage_dac.png",
              iconSize: "large",
              color: "common",
              title: "Manage Data Access Committee",
              description: "Create and manage Data Access Commitee"
            }),
          ]),
          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 search-wrapper no-padding" }, [
            div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
              h(SearchBox, { id: 'manageDac', searchHandler: this.handleSearchDac, pageHandler: this.handlePageChange, color: 'common' })
            ]),

            a({
              id: 'btn_addDAC',
              className: "col-lg-6 col-md-6 col-sm-6 col-xs-6 btn-primary btn-add common-background",
              onClick: this.addDac
            }, [
                div({ className: "all-icons add-dac_white" }),
                span({}, ["Add Data Access Committee"]),
              ])
          ])
        ]),
        div({ className: "jumbotron table-box" }, [
          div({ className: "grid-9-row" }, [
            div({ className: "col-2 cell-header common-color" }, ["DAC Name"]),
            div({ className: "col-3 cell-header common-color" }, ["DAC Description"]),
            div({ className: "col-1 cell-header common-color" }, ["DAC Chair"]),
            div({ className: "col-1 cell-header common-color" }, ["DAC Roster"]),
            div({ className: "col-1 cell-header common-color" }, ["DAC Datasets"]),
            div({ className: "col-1 cell-header f-center common-color" }, ["Actions"]),
          ]),

          hr({ className: "table-head-separator" }),
          // this.state.dacsList.dac.filter(this.searchTable(searchDacText)).slice((currentPage - 1) * limit, currentPage * limit).map((dac, eIndex) => {

          //   return (
          h(Fragment, {
            // key: dac.dacId
          }, [
              div({
                // id: dac.dacId,
                className: "grid-9-row tableRow"
              }, [
                  div({
                    // id: dac.dacId + "_dacName",
                    name: "dacName",
                    className: "col-2 cell-body text bold",
                    // title: dac.dacName
                  }, ["Some Name"]),
                  // }, [dac.dacName]),
                  div({
                    // id: dac.dacId + "_dacDescription",
                    name: "dacDescription",
                    className: "col-3 cell-body text",
                    // title: dac.dacDescription,
                  }, ["Some Description"]),
                  // }, [dac.dacDescription]),
                  div({
                    // id: dac.dacId + "_dacChair",
                    name: "dacChair",
                    className: "col-1 cell-body text"
                  }, ["John Doe"]),
                  // }, [dac.dacChair]),
                  div({
                    // id: dac.dacId + "_dacRoster",
                    name: "dacRoster",
                    className: "col-1 cell-body text"
                  }, [
                      a({
                        // id: dac.dacId + "_linkDacRoster",
                        name: "link_dacRoster",
                        // href: property.propertyValue,
                        onClick: this.viewMembers,
                        className: "enabled hover-color"
                      }, ["DAC Members"])
                    ]),
                  div({
                    // id: dac.dacId + "_dacDatasets",
                    name: "dacDatasets",
                    className: "col-1 cell-body text"
                  }, [
                      a({
                        // id: dac.dacId + "_linkDacDatasets",
                        name: "link_dacDatasets",
                        // href: property.propertyValue,
                        onClick: this.viewDatasets,
                        className: "enabled hover-color"
                      }, ["Linked Datasets"])
                    ]),
                  div({
                    className: "col-1 cell-body f-center",
                  }, [
                      button({
                        // id: dac.dacId + "_btnEditDAC",
                        name: "btn_editDac",
                        className: "cell-button hover-color",
                        // onClick: () => this.editDac(dac)
                        onClick: () => this.editDac()
                      }, ["Edit"])
                    ])
                ]),
                hr({ className: "table-body-separator" }),

                PaginatorBar({
                  total: this.state.dacsList.dac.filter(this.searchTable(searchDacText)).length,
                  limit: this.state.limit,
                  pageCount: this.pageCount,
                  currentPage: this.state.currentPage,
                  onPageChange: this.handlePageChange,
                  changeHandler: this.handleSizeChange,
                }),

                AddDacModal({
                  isRendered: this.state.showModal,
                  showModal: this.state.showModal,
                  isEditMode: this.state.isEditMode,
                  onOKRequest: this.okAddDacModal,
                  onCloseRequest: this.closeAddDacModal,
                  onAfterOpen: this.afterAddDacModalOpen,
                }),

                DacMembersModal({
                  isRendered: this.state.showMembersModal,
                  showModal: this.state.showMembersModal,
                  onOKRequest: this.okViewMembersModal,
                  onCloseRequest: this.closeViewMembersModal,
                  onAfterOpen: this.afterViewMembersModalOpen,
                }),

                DacDatasetsModal({
                  isRendered: this.state.showDatasetsModal,
                  showModal: this.state.showDatasetsModal,
                  onOKRequest: this.okViewDatasetModal,
                  onCloseRequest: this.closeViewDatasetsModal,
                  onAfterOpen: this.afterViewDatasetsModalOpen,
                })
            ])
          //   )
          // })
        ])
      ])
    );
  }
}

export default AdminManageDac;
