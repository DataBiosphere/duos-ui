import { Component, Fragment } from 'react';
import { a, button, div, h, hr, span } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import { AddDacModal } from '../components/modals/AddDacModal';
import { DacMembersModal } from '../components/modals/DacMembersModal';
import { PageHeading } from '../components/PageHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';
import { DAC } from '../libs/ajax';
import { sleep } from '../libs/utils';


const limit = 10;
const actionButtonStyle = { width: '40%', marginRight: '1rem' };

class AdminManageDac extends Component {

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      showDacModal: false,
      showDatasetsModal: false,
      showMembersModal: false,
      value: '',
      limit: limit,
      dacList: [],
      searchDUL: '',
      alertMessage: undefined,
      alertTitle: undefined,
      selectedDac: {}
    };

    this.addDac = this.addDac.bind(this);
    this.closeAddDacModal = this.closeAddDacModal.bind(this);
    this.okAddDacModal = this.okAddDacModal.bind(this);

    this.viewMembers = this.viewMembers.bind(this);
    this.closeViewMembersModal = this.closeViewMembersModal.bind(this);
  }

  async componentDidMount() {
    const dacs = await DAC.list();
    this.setState(prev => {
      prev.currentPage = 1;
      prev.dacList = dacs;
      return prev;
    }, () => {
      ReactTooltip.rebuild();
    });
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

  editDac(selectedDac) {
    this.setState(prev => {
      prev.showDacModal = true;
      prev.isEditMode = true;
      prev.selectedDac = selectedDac;
      return prev;
    });
  };

  addDac() {
    this.setState({
      showDacModal: true,
      isEditMode: false
    });
  }

  async okAddDacModal() {
    // Necessary due to the delay in adding/removing N users in addition to updating the DAC information.
    await sleep(500);
    const dacs = await DAC.list();
    this.setState(prev => {
      prev.showDacModal = false;
      prev.currentPage = 1;
      prev.dacList = dacs;
      return prev;
    });
  }

  async closeAddDacModal() {
    const dacs = await DAC.list();
    this.setState(prev => {
      prev.showDacModal = false;
      prev.currentPage = 1;
      prev.dacList = dacs;
      return prev;
    });
  }

  viewMembers(selectedDac) {
    this.setState(prev => {
      prev.showMembersModal = true;
      prev.selectedDac = selectedDac;
      return prev;
    });
  }

  closeViewMembersModal() {
    this.setState(prev => {
      prev.showMembersModal = false;
      prev.selectedDac = {};
      return prev;
    });
  }

  viewDatasets = (selectedDac) => {
    this.setState(prev => {
      prev.showDatasetsModal = true;
      prev.selectedDac = selectedDac;
      return prev;
    });
  };

  closeViewDatasetsModal = () => {
    this.setState(prev => {
      prev.showDatasetsModal = false;
      prev.selectedDac = {};
      return prev;
    });
  };

  handleSearchDac = (query) => {
    this.setState({ searchDacText: query });
  };

  searchTable = (query) => (row) => {
    if (query) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  render() {
    const { currentPage, limit, searchDacText } = this.state;
    return (
      div({ className: 'container container-wide' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 no-padding' }, [
            PageHeading({
              id: 'manageDac',
              imgSrc: '/images/icon_manage_dac.png',
              iconSize: 'large',
              color: 'common',
              title: 'Manage Data Access Committee',
              description: 'Create and manage Data Access Commitee'
            })
          ]),
          div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 search-wrapper no-padding' }, [
            div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6' }, [
              h(SearchBox, { id: 'manageDac', searchHandler: this.handleSearchDac, pageHandler: this.handlePageChange, color: 'common' })
            ]),

            a({
              id: 'btn_addDAC',
              className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6 btn-primary btn-add common-background',
              onClick: this.addDac
            }, [
              div({ className: 'all-icons add-dac_white' }),
              span({}, ['Add Data Access Committee'])
            ])
          ])
        ]),
        div({ className: 'jumbotron table-box' }, [
          div({ className: 'grid-9-row' }, [
            div({ className: 'col-2 cell-header common-color' }, ['DAC Name']),
            div({ className: 'col-3 cell-header common-color' }, ['DAC Description']),
            div({ className: 'col-2 cell-header common-color' }, ['DAC Datasets']),
            div({ className: 'col-2 cell-header f-center common-color' }, ['Actions'])
          ]),

          hr({ className: 'table-head-separator' }),

          this.state.dacList.filter(this.searchTable(searchDacText))
            .slice((currentPage - 1) * limit, currentPage * this.state.limit)
            .map((dac, eIndex) => {
              return (h(Fragment, { key: dac.dacId }, [
                  div({
                    id: dac.dacId,
                    className: 'grid-9-row tableRow'
                  }, [
                    div({
                      id: dac.dacId + '_dacName',
                      name: 'name',
                      className: 'col-2 cell-body text bold',
                      title: dac.name
                    }, [dac.name]),
                    div({
                      id: dac.dacId + '_dacDescription',
                      name: 'dacDescription',
                      className: 'col-3 cell-body text',
                      title: dac.description
                    }, [dac.description]),
                    div({
                      className: 'col-2 cell-body'
                    }, [
                      button({
                        id: dac.dacId + '_dacDatasets',
                        name: 'dacDatasets',
                        className: 'cell-button hover-color',
                        style: actionButtonStyle,
                        onClick: () => this.viewDatasets(dac)
                      }, ['View'])
                    ]),
                    div({
                      className: 'col-2 cell-body f-center'
                    }, [
                      button({
                        id: dac.dacId + '_btnViewDAC',
                        name: 'btn_viewDac',
                        className: 'cell-button hover-color',
                        style: actionButtonStyle,
                        onClick: () => this.viewMembers(dac)
                      }, ['View']),
                      button({
                        id: dac.dacId + '_btnEditDAC',
                        name: 'btn_editDac',
                        className: 'cell-button hover-color',
                        style: actionButtonStyle,
                        onClick: () => this.editDac(dac)
                      }, ['Edit'])
                    ])
                  ]),
                  hr({ className: 'table-body-separator' })
                ])
              );
            }),
          PaginatorBar({
            total: this.state.dacList.filter(this.searchTable(searchDacText)).length,
            limit: this.state.limit,
            pageCount: this.pageCount,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange
          }),
          DacMembersModal({
            isRendered: this.state.showMembersModal,
            showModal: this.state.showMembersModal,
            onOKRequest: this.closeViewMembersModal,
            onCloseRequest: this.closeViewMembersModal,
            dac: this.state.selectedDac
          }),
          AddDacModal({
            isRendered: this.state.showDacModal,
            showModal: this.state.showDacModal,
            isEditMode: this.state.isEditMode,
            onOKRequest: this.okAddDacModal,
            onCloseRequest: this.closeAddDacModal,
            dac: this.state.selectedDac
          })
        ])
      ])
    );
  }
}

export default AdminManageDac;
