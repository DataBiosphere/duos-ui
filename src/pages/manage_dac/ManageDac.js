import {Component, Fragment} from 'react';
import {a, button, div, h, hr, span} from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import {AddDacModal} from './AddDacModal';
import {DacDatasetsModal} from '../../components/modals/DacDatasetsModal';
import {DacMembersModal} from './DacMembersModal';
import {PageHeading} from '../../components/PageHeading';
import {PaginatorBar} from '../../components/PaginatorBar';
import {SearchBox} from '../../components/SearchBox';
import {DAC} from '../../libs/ajax';
import {Storage} from '../../libs/storage';
import {contains, filter, reverse, sortBy, map, isNil, isEmpty} from 'lodash/fp';
import manageDACIcon from '../../images/icon_manage_dac.png';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import TableIconButton from '../../components/TableIconButton';
import {Delete} from '@material-ui/icons';
import {Notifications} from '../../libs/utils';
import {Styles} from '../../libs/theme';

const limit = 10;
const CHAIR = 'Chairperson';
const ADMIN = 'Admin';
const actionButtonStyle = { width: '40%', marginRight: '1rem' };

class ManageDac extends Component {

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      descendingOrder: false,
      showDacModal: false,
      showDatasetsModal: false,
      showMembersModal: false,
      showConfirmationModal: false,
      value: '',
      limit: limit,
      dacs: [],
      searchDUL: '',
      alertMessage: undefined,
      alertTitle: undefined,
      selectedDac: {},
      selectedDatasets: [],
      dacIDs: []
    };
  }

  componentDidMount() {
    this.getAllData();
  }

  getAllData = async () => {
    await Promise.all([
      this.getUserRole(),
      this.fetchDacList()
    ]);
  };

  fetchDacList = async () => {
    this._asyncRequest = DAC.list().then(
      dacs => {
        this._asyncRequest = null;
        let sorted = sortBy('name')(dacs);
        if (this.state.descendingOrder) {
          sorted = reverse(sorted);
        }
        if (this.state.userRole === CHAIR) {
          sorted = sorted.filter((dac) => this.state.dacIDs.includes(dac.dacId));
        }
        this.setState(prev => {
          prev.currentPage = 1;
          prev.dacs = sorted;
          return prev;
        }, () => {
          ReactTooltip.rebuild();
        });
      }
    );
  };

  getUserRole = async () => {
    const currentUser = Storage.getCurrentUser();
    const roles = currentUser.roles.map(r => r.name);
    const role = contains(ADMIN)(roles) ? ADMIN : CHAIR;
    let dacIDs = filter({name: CHAIR})(currentUser.roles);
    dacIDs = map('dacId')(dacIDs);
    if (role === CHAIR) {
      this.setState({dacIDs: dacIDs});
    }
    this.setState({userRole: role});
  };

  componentWillUnmount() {
    if (this._asyncRequest) {
      this._asyncRequest.cancel();
    }
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

  editDac = (selectedDac) => {
    this.setState(prev => {
      prev.showDacModal = true;
      prev.isEditMode = true;
      prev.selectedDac = selectedDac;
      return prev;
    });
  };

  deleteDac = async (selectedDac) => {
    this.setState(prev => {
      prev.showConfirmationModal = true;
      prev.isEditMode = false;
      prev.selectedDac = selectedDac;
      return prev;
    });
  };

  closeConfirmation = () => {
    this.setState({ showConfirmationModal: false });
  };

  handleDeleteDac = async () => {
    let status;
    await DAC.delete(this.state.selectedDac.dacId).then((resp) => {
      status = resp.status;
    });
    if (status === 200) {
      Notifications.showSuccess({text: 'DAC successfully deleted.'});
      this.setState(prev => {
        prev.showConfirmationModal = false;
        prev.currentPage = 1;
        return prev;
      });
      await this.fetchDacList();
    } else {
      Notifications.showError({text: 'DAC could not be deleted.'});
    }
  };

  addDac = () => {
    this.setState({
      showDacModal: true,
      isEditMode: false
    });
  };

  okAddDacModal = async () => {
    await this.fetchDacList();
    this.setState(prev => {
      prev.showDacModal = false;
      prev.currentPage = 1;
      return prev;
    });
  };

  closeAddDacModal = async () => {
    await this.fetchDacList();
    this.setState(prev => {
      prev.showDacModal = false;
      prev.currentPage = 1;
      return prev;
    });
  };

  viewMembers = (selectedDac) => {
    this.setState(prev => {
      prev.showMembersModal = true;
      prev.selectedDac = selectedDac;
      return prev;
    });
  };

  closeViewMembersModal = () => {
    this.setState(prev => {
      prev.showMembersModal = false;
      prev.selectedDac = {};
      return prev;
    });
  };

  viewDatasets = async (selectedDac) => {
    const datasets = await DAC.datasets(selectedDac.dacId);
    const activeDatasets = filter({ active: true })(datasets);
    this.setState(prev => {
      prev.showDatasetsModal = true;
      prev.selectedDac = selectedDac;
      prev.selectedDatasets = activeDatasets;
      return prev;
    });
  };

  closeViewDatasetsModal = () => {
    this.setState(prev => {
      prev.showDatasetsModal = false;
      prev.selectedDac = {};
      prev.selectedDatasets = [];
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

  sort = (sortField, descendingOrder = false) => () => {
    let sorted = sortBy(sortField)(this.state.dacs);
    if (descendingOrder) {
      sorted = reverse(sorted);
    }
    this.setState(prev => {
      prev.dacs = sorted;
      prev.descendingOrder = !prev.descendingOrder;
      return prev;
    });
  };

  render() {
    const {currentPage, limit, searchDacText, userRole} = this.state;
    return (
      div({className: 'container container-wide'}, [
        div({className: 'row no-margin'}, [
          div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 no-padding'}, [
            PageHeading({
              id: 'manageDac',
              imgSrc: manageDACIcon,
              iconSize: 'large',
              color: 'common',
              title: 'Manage Data Access Committee',
              description: 'Create and manage Data Access Commitee'
            })
          ]),
          div({
            isRendered: (userRole === ADMIN),
            className: 'col-md-6 col-xs-12 search-wrapper no-padding'}, [
            div({className: 'col-xs-6'}, [
              h(SearchBox, {
                id: 'manageDac',
                searchHandler: this.handleSearchDac,
                pageHandler: this.handlePageChange,
                color: 'common'
              })
            ]),
            a({
              id: 'btn_addDAC',
              className: 'col-xs-6 btn-primary btn-add common-background',
              onClick: this.addDac
            }, [
              div({className: 'all-icons add-dac_white'}),
              span({}, ['Add Data Access Committee'])
            ])
          ]),
          div({
            isRendered: (userRole === CHAIR),
            className: 'search-wrapper no-padding'}, [
            div({className: 'col-xs-6'}, [
              h(SearchBox, {
                id: 'manageDac',
                searchHandler: this.handleSearchDac,
                pageHandler: this.handlePageChange,
                color: 'common'
              })
            ])
          ])
        ]),
        div({className: 'jumbotron table-box'}, [
          div({className: 'grid-9-row'}, [
            div({
              className: 'col-2 cell-header cell-sort common-color',
              onClick: this.sort('name', !this.state.descendingOrder)
            }, [
              'DAC Name',
              span({className: 'glyphicon sort-icon glyphicon-sort'})]),
            div({className: 'col-3 cell-header common-color'}, ['DAC Description']),
            div({className: 'col-2 cell-header common-color'}, ['DAC Datasets']),
            div({className: 'col-2 cell-header f-center common-color'}, ['Actions'])
          ]),

          hr({className: 'table-head-separator'}),

          this.state.dacs.filter(this.searchTable(searchDacText))
            .slice((currentPage - 1) * limit, currentPage * this.state.limit)
            .map(dac => {
              const disabled = !isNil(dac.datasets) && !isEmpty(dac.datasets);
              return (h(Fragment, {key: dac.dacId}, [
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
                    className: 'col-2 cell-body f-center',
                    style: {display: 'flex'}
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
                    }, ['Edit']),
                    h(TableIconButton, {
                      key: 'delete-dac-icon',
                      dataTip: disabled ? 'All datasets assigned to this DAC must be reassigned before this can be deleted' : 'Delete DAC',
                      isRendered: userRole === ADMIN,
                      disabled: disabled,
                      onClick: () => this.deleteDac(dac),
                      icon: Delete,
                      style: Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON),
                      hoverStyle: Object.assign({}, Styles.TABLE.TABLE_BUTTON_ICON_HOVER)
                    })
                  ])
                ]),
                hr({className: 'table-body-separator'})
              ])
              );
            }),
          PaginatorBar({
            total: this.state.dacs.filter(this.searchTable(searchDacText)).length,
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
          DacDatasetsModal({
            isRendered: this.state.showDatasetsModal,
            showModal: this.state.showDatasetsModal,
            onOKRequest: this.closeViewDatasetsModal,
            onCloseRequest: this.closeViewDatasetsModal,
            dac: this.state.selectedDac,
            datasets: this.state.selectedDatasets
          }),
          AddDacModal({
            isRendered: this.state.showDacModal,
            showModal: this.state.showDacModal,
            isEditMode: this.state.isEditMode,
            onOKRequest: this.okAddDacModal,
            onCloseRequest: this.closeAddDacModal,
            dac: this.state.selectedDac,
            userRole: userRole
          }),
          h(ConfirmationModal, {
            showConfirmation: this.state.showConfirmationModal,
            closeConfirmation: this.closeConfirmation,
            title: 'Delete DAC?',
            message: 'Are you sure you want to delete this Data Access Committee?',
            header: this.state.selectedDac.name,
            onConfirm: () => this.handleDeleteDac(),
          }),
          h(ReactTooltip, {
            place: 'left',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          })
        ])
      ])
    );
  }
}

export default ManageDac;
