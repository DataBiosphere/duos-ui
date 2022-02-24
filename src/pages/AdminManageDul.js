import _ from 'lodash';
import { Component, Fragment } from 'react';
import { a, button, div, h, hr, input, label, span } from 'react-hyperscript-helpers';
import Select from 'react-select';
import ReactTooltip from 'react-tooltip';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { PageHeading } from '../components/PageHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';
import { Consent, DAC, Election } from '../libs/ajax';
import * as Utils from '../libs/utils';
import manageDULIcon from '../images/icon_manage_dul.png';

const limit = 10;

class AdminManageDul extends Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedElection: {},
      dacList: [],
      selectedDac: {},
      dacMenuOpen: false,
      currentPage: 1,
      showModal: false,
      value: '',
      limit: limit,
      electionsList: {
        dul: []
      },
      showDialogArchive: false,
      showDialogCancel: false,
      showDialogCreate: false,
      showDialogDelete: false,
      archiveCheck: true,
      alertMessage: undefined,
      alertTitle: undefined,
      disableOkBtn: false,
      disableCancelBtn: false
    };
  }

  getDACs = async () => {
    const dacs = await DAC.list();
    this.setState(prev => {
      prev.dacList = dacs;
      return prev;
    });
  };

  dacOptions = () => {
    return this.state.dacList.map(function(item) {
      return {
        key: item.dacId,
        value: item.dacId,
        label: item.name,
        item: item
      };
    });
  };

  onDacChange = (option) => {
    this.setState(prev => {
      if (_.isNil(option)) {
        prev.selectedDac = {};
      } else {
        prev.selectedDac = option.item;
      }
      return prev;
    });
  };

  onDacMenuOpen = () => {
    this.setState(prev => {
      prev.dacMenuOpen = true;
      return prev;
    });
  };

  onDacMenuClose = () => {
    this.setState(prev => {
      prev.dacMenuOpen = false;
      return prev;
    });
  };

  getConsentManage = async () => {
    const duls = await Consent.findConsentManage();
    this.setState(prev => {
      prev.currentPage = 1;
      prev.electionsList.dul = duls;
      prev.disableOkBtn = false;
      prev.disableCancelBtn = false;
      prev.showDialogArchiveOpen = false;
      prev.showDialogArchiveClosed = false;
      prev.showDialogCancel = false;
      return prev;
    }, async () => {
      ReactTooltip.rebuild();
    });
  };

  componentDidMount = async () => {
    await this.getDACs();
    await this.getConsentManage();
    const updatedDulList = _.map(this.state.electionsList.dul, dul => {
      if (dul.dacId !== null) {
        dul.dac = _.findLast(this.state.dacList, (d) => { return d.dacId === dul.dacId; });
      }
      return dul;
    });
    this.setState(prev => {
      prev.electionsList.dul = updatedDulList;
      return prev;
    });
  };

  removeDul = (consentId) => {
    let updatedDul = this.state.electionsList.dul.filter(election => election.consentId !== consentId);
    this.setState(prev => {
      prev.currentPage = 1;
      prev.electionsList.dul = updatedDul;
      prev.disableOkBtn = false;
      prev.disableCancelBtn = false;
      prev.showDialogDelete = false;
      return prev;
    });
  };

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

  open = (electionId, page) => {
    this.props.history.push(`${ page }/${ electionId }`);
  };

  openDialogArchive = (election) => () => {
    if (election.electionStatus === 'Open') {
      this.setState({ showDialogArchiveOpen: true, payload: election });
    } else {
      this.setState({ showDialogArchiveClosed: true, payload: election });
    }

  };
  openDialogCancel = (election) => () => {
    this.setState({
      createWarning: (election.status === 'Open'),
      showDialogCancel: true,
      payload: election
    });
  };

  openDialogCreate = (election) => () => {
    this.setState({
      createWarning: (election.status === 'Closed' && !election.archived),
      showDialogCreate: true,
      selectedElection: election
    });
  };

  openDialogDelete = (election) => () => {
    this.setState({
      showDialogDelete: true,
      deleteId: election.consentId
    });
  };

  dialogHandlerArchive = (answer) => async () => {
    this.setState({ disableOkBtn: answer, disableCancelBtn: answer });
    if (answer) {
      let electionUpdate = {};
      let election = this.state.payload;
      electionUpdate.status = election.electionStatus === 'Open' ? 'Canceled' : election.electionStatus;
      electionUpdate.referenceId = election.consentId;
      electionUpdate.electionId = election.electionId;
      electionUpdate.archived = true;
      await Election.updateElection(electionUpdate.electionId, electionUpdate);
      this.getConsentManage();
    } else {
      this.setState({ showDialogArchiveOpen: false, showDialogArchiveClosed: false });
    }
  };

  dialogHandlerCancel = (answer) => async () => {
    this.setState({ disableOkBtn: answer, disableCancelBtn: answer, archiveCheck: true });
    if (answer) {
      let election = this.state.payload;
      let electionUpdated = {
        status: 'Canceled',
        referenceId: election.consentId,
        electionId: election.electionId,
        archived: this.state.archiveCheck
      };
      await Election.updateElection(election.electionId, electionUpdated);
      this.getConsentManage();
    } else {
      this.setState({ showDialogCancel: false });
    }
  };

  dialogHandlerCreate = (answer) => async () => {
    this.setState({ disableOkBtn: answer, disableCancelBtn: answer });
    if (answer) {
      const dac = this.state.selectedDac;
      const election = this.state.selectedElection;
      const consentId = election.consentId;
      let electionPromise = null;
      if (_.isNil(election.dacId) && !_.isEmpty(dac)) {
        electionPromise = Election.createElectionForDac(consentId, dac.dacId);
      } else {
        electionPromise = Election.createElection(consentId);
      }
      electionPromise.then(
        () => {
          this.setState({
            showDialogCreate: false,
            alertTitle: undefined,
            alertMessage: undefined,
            selectedDac: {},
            selectedElection: {}
          });
          this.getConsentManage();
        }).catch(errorResponse => {
        if (errorResponse.status === 500) {
          this.setState({
            alertTitle: 'Email Service Error!',
            alertMessage: 'The election was created but the participants couldn\'t be notified by Email.',
            disableCancelBtn: false
          });
        } else {
          errorResponse.json().then(error =>
            this.setState({
              alertTitle: 'Election cannot be created!',
              alertMessage: error.message,
              disableCancelBtn: false
            })
          );
        }
      });
    } else {
      this.setState({
        showDialogCreate: false,
        alertTitle: undefined,
        alertMessage: undefined
      });
    }

  };

  dialogHandlerDelete = (answer) => () => {
    this.setState({ disableOkBtn: answer, disableCancelBtn: answer });
    if (answer) {
      let consentId = this.state.deleteId;
      Consent.deleteConsent(consentId).then(data => {
        if (data.ok) {
          this.removeDul(consentId);
        }
      });
    } else {
      this.setState({ showDialogDelete: false });
    }
  };

  handleArchiveCheckbox = (e) => {
    this.setState({ archiveCheck: e.target.checked });
  };

  handleSearchDul = (query) => {
    this.setState({ searchDulText: query });
  };

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  findDacNameForDacId = (dacId) => {
    if (_.isNil(dacId)) {
      return '---';
    }
    const foundDac = _.findLast(this.state.dacList, (d) => { return d.dacId === dacId; });
    if (_.isNil(foundDac)) {
      return '---';
    }
    return foundDac.name;
  };

  render() {

    const { currentPage, limit, searchDulText } = this.state;

    return (
      div({ className: 'container container-wide' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding' }, [
            PageHeading({
              id: 'manageDul',
              imgSrc: manageDULIcon,
              iconSize: 'medium',
              color: 'dul',
              title: 'Manage Data Use Limitations',
              description: 'Select and manage Data Use Limitations for DAC review'
            })
          ]),
          div({ className: 'col-lg-5 col-md-5 col-sm-12 col-xs-12 search-wrapper no-padding' }, [
            h(SearchBox, { id: 'manageDul', searchHandler: this.handleSearchDul, pageHandler: this.handlePageChange, color: 'dul' })
          ])
        ]),
        div({ className: 'jumbotron table-box' }, [
          div({ className: 'grid-9-row pushed-2' }, [
            div({ className: 'col-2 cell-header dul-color' }, ['Consent id']),
            div({ className: 'col-2 cell-header dul-color' }, ['Consent Group Name']),
            div({ className: 'col-1 cell-header dul-color' }, ['Election N°']),
            div({ className: 'col-1 cell-header dul-color' }, ['Date']),
            div({ className: 'col-1 cell-header dul-color' }, ['DAC']),
            div({ className: 'col-1 cell-header f-center dul-color' }, ['Status']),
            div({ className: 'col-1 cell-header f-center dul-color' }, ['Action'])
          ]),

          hr({ className: 'table-head-separator' }),

          this.state.electionsList.dul.filter(this.searchTable(searchDulText))
            .slice((currentPage - 1) * limit, currentPage * limit)
            .map((election) => {
              return (
                h(Fragment, { key: election.consentId }, [
                  div({
                    id: election.consentId, className: 'grid-9-row pushed-2 tableRow ' + (election.updateStatus === true ? ' list-highlighted' : '')
                  },
                  [
                    div({
                      id: election.consentId + '_consentId',
                      name: 'consentId',
                      className: 'col-2 cell-body text ' + (election.archived === true ? 'flagged' : ''),
                      title: election.consentName
                    },
                    [
                      span({
                        id: election.consentId + '_flagConsentId',
                        name: 'flag_consentId',
                        isRendered: election.updateStatus,
                        className: 'glyphicon glyphicon-exclamation-sign list-highlighted-item dul-color',
                        'data-tip': 'Consent has been updated',
                        'data-for': 'tip_flag'
                      }, []),
                      a({
                        id: election.consentId + '_linkConsentName',
                        name: 'link_consentName',
                        onClick: () => this.open(election.consentId, 'dul_preview')
                      }, [election.consentName])
                    ]),
                    div({
                      id: election.consentId + '_groupName',
                      name: 'groupName',
                      className: 'col-2 cell-body text ' + ((!election.groupName || false) ? 'empty' : ''),
                      title: election.groupName
                    }, [election.groupName]),
                    div({
                      id: election.consentId + '_version',
                      name: 'version',
                      className: 'col-1 cell-body text ' + ((!election.version || false) ? 'empty' : '')
                    }, [election.version]),
                    div({
                      id: election.consentId + '_createDate',
                      name: 'createDate',
                      className: 'col-1 cell-body text'
                    }, [Utils.formatDate(election.createDate)]),
                    div({
                      id: election.consentId + '_dacName',
                      name: 'dacName',
                      className: 'col-1 cell-body text'
                    }, [this.findDacNameForDacId(election.dacId)]),
                    div({ className: 'col-1 cell-body text f-center bold' }, [
                      span({ isRendered: election.electionStatus === 'un-reviewed' }, [
                        a({
                          id: election.consentId + '_linkUnreviewed', name: 'link_unreviewed',
                          onClick: () => this.open(election.consentId, 'dul_preview')
                        }, ['Un-reviewed'])
                      ]),
                      span({ isRendered: election.electionStatus === 'Open' }, [
                        a({
                          id: election.consentId + '_linkOpen', name: 'link_open',
                          onClick: () => this.open(election.consentId, 'dul_collect')
                        }, ['Open'])
                      ]),
                      span({ isRendered: election.electionStatus === 'Canceled' }, [
                        a({
                          id: election.consentId + '_linkCanceled', name: 'link_canceled',
                          onClick: () => this.open(election.consentId, 'dul_preview')
                        }, ['Canceled'])
                      ]),
                      span({ isRendered: election.electionStatus === 'Closed' }, [
                        a({
                          id: election.consentId + '_linkReviewed', name: 'link_reviewed',
                          onClick: () => this.open(election.electionId, 'dul_results_record')
                        }, [election.vote])
                      ])
                    ]),
                    div({
                      isRendered: election.electionStatus !== 'Open',
                      className: 'col-1 cell-body f-center',
                      disabled: !election.editable
                    },
                    [
                      button({
                        id: election.consentId + '_btnCreate',
                        name: 'btn_create',
                        consentid: election.consentId,
                        onClick: this.openDialogCreate(election),
                        className: 'cell-button hover-color'
                      }, ['Create'])
                    ]),
                    div({
                      isRendered: election.electionStatus === 'Open',
                      className: 'col-1 cell-body f-center'
                    },
                    [
                      button({
                        id: election.consentId + '_btnCancel',
                        name: 'btn_cancel',
                        consentid: election.consentId,
                        onClick: this.openDialogCancel(election),
                        className: 'cell-button cancel-color'
                      }, ['Cancel'])
                    ]),
                    div({ className: 'icon-actions' }, [
                      div({
                        className: 'display-inline-block',
                        disabled: (election.electionStatus === 'un-reviewed' || election.archived === true)
                      }, [
                        button({
                          id: election.consentId + '_btnArchiveElection',
                          name: 'btn_archiveElection',
                          onClick: this.openDialogArchive(election)
                        }, [
                          span({
                            className: 'glyphicon caret-margin glyphicon-inbox ' + (election.archived === true ? 'activated' : ''),
                            'data-tip': 'Archive election',
                            'data-for': 'tip_archive'
                          })
                        ])
                      ]),
                      div({
                        className: 'display-inline-block',
                        disabled: (election.electionStatus !== 'un-reviewed' || election.electionStatus === 'Canceled')
                      }, [
                        button({
                          id: election.consentId + '_btnDeleteDul',
                          name: 'btn_deleteDul',
                          onClick: this.openDialogDelete(election)
                        }, [
                          span({
                            className: 'glyphicon caret-margin glyphicon-trash',
                            'data-tip': 'Delete record',
                            'data-for': 'tip_delete'
                          })
                        ])
                      ])
                    ])
                  ]),
                  hr({ className: 'table-body-separator' })
                ])
              );
            }),
          PaginatorBar({
            total: this.state.electionsList.dul.filter(this.searchTable(searchDulText)).length,
            limit: this.state.limit,
            pageCount: this.pageCount,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange
          })
        ]),

        ConfirmationDialog({
          isRendered: this.state.showDialogArchiveOpen,
          showModal: this.state.showDialogArchiveOpen,
          disableOkBtn: this.state.disableOkBtn,
          disableNoBtn: this.state.disableCancelBtn,
          title: 'Archive election?',
          color: 'dul',
          payload: this.state.payload,
          action: { label: 'Yes', handler: this.dialogHandlerArchive }
        }, [
          div({ className: 'dialog-description' }, [
            span({}, ['Are you sure you want to archive this election? ']),
            span({ className: 'no-padding display-inline' },
              ['The current election will be stopped without logging a result and this case will no longer be available for DAC Review.'])
          ])
        ]),

        ConfirmationDialog({
          isRendered: this.state.showDialogArchiveClosed,
          showModal: this.state.showDialogArchiveClosed,
          disableOkBtn: this.state.disableOkBtn,
          disableNoBtn: this.state.disableCancelBtn,
          title: 'Archive election?',
          color: 'dul',
          payload: this.state.payload,
          action: { label: 'Yes', handler: this.dialogHandlerArchive }
        }, [
          div({ className: 'dialog-description' }, [
            span({}, ['Are you sure you want to archive this election? ']),
            span({ className: 'no-padding display-inline' }, ['This election result will no longer be valid.'])
          ])
        ]),

        ConfirmationDialog({
          isRendered: this.state.showDialogCancel,
          showModal: this.state.showDialogCancel,
          disableOkBtn: this.state.disableOkBtn,
          disableNoBtn: this.state.disableCancelBtn,
          title: 'Cancel election?',
          color: 'cancel',
          payload: this.state.payload,
          action: { label: 'Yes', handler: this.dialogHandlerCancel }
        }, [
          div({ className: 'dialog-description' }, [
            span({}, ['Are you sure you want to cancel the current election process? ']),
            span({ className: 'no-padding display-inline' }, ['The current election will be stopped without logging a result.'])
          ]),
          div({ className: 'form-group' }, [
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding' }, [
              div({ className: 'checkbox' }, [
                input({
                  id: 'chk_archiveCancelElection',
                  type: 'checkbox',
                  className: 'checkbox-inline',
                  defaultChecked: this.state.archiveCheck,
                  onChange: this.handleArchiveCheckbox
                }),
                label({
                  id: 'lbl_archiveCancelElection',
                  htmlFor: 'chk_archiveCancelElection',
                  className: 'regular-checkbox normal'
                }, ['Archive election'])
              ])
            ])
          ])
        ]),

        ConfirmationDialog({
          style: (this.state.dacMenuOpen) ? { content: {height: '400px' }} : {},
          isRendered: this.state.showDialogCreate,
          showModal: this.state.showDialogCreate,
          title: 'Create election?',
          color: 'dul',
          disableOkBtn: this.state.disableOkBtn ||
            (!_.isEmpty(this.state.dacList) &&
              _.isNil(this.state.selectedElection.dacId) &&
              _.isEmpty(this.state.selectedDac)),
          disableNoBtn: this.state.disableCancelBtn,
          action: { label: 'Yes', handler: this.dialogHandlerCreate },
          alertMessage: this.state.alertMessage,
          alertTitle: this.state.alertTitle
        }, [
          div({ className: 'dialog-description' }, [
            span({}, ['Are you sure you want the DAC to vote on this case? ']),
            div({ isRendered: (_.isNil(this.state.selectedElection.dacId) &&
                !_.isEmpty(this.state.dacList)) }, [
              'This election requires a DAC assignment:',
              h(Select, {
                classNamePrefix: 'select',
                isDisabled: false,
                isClearable: true,
                isMulti: false,
                isSearchable: true,
                maxMenuHeight: 210,
                name: 'dac',
                onChange: (option) => this.onDacChange(option),
                onMenuOpen: () => this.onDacMenuOpen(),
                onMenuClose: () => this.onDacMenuClose(),
                options: this.dacOptions(),
                placeholder: 'Select a Data Access Committee...'
              })
            ]),
            span({
              isRendered: this.state.createWarning,
              className: 'no-padding display-inline'
            }, ['The previous election will be archived and it\'s result will no longer be valid.'])
          ])
        ]),

        ConfirmationDialog({
          isRendered: this.state.showDialogDelete,
          showModal: this.state.showDialogDelete,
          disableOkBtn: this.state.disableOkBtn,
          disableNoBtn: this.state.disableCancelBtn,
          title: 'Delete Consent?',
          color: 'cancel',
          action: { label: 'Yes', handler: this.dialogHandlerDelete }
        }, [
          div({ className: 'dialog-description' }, [
            span({}, ['Are you sure you want to delete this Consent?'])
          ])
        ]),
        h(ReactTooltip, {
          id: 'tip_archive',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
        h(ReactTooltip, {
          id: 'tip_delete',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
        h(ReactTooltip, {
          id: 'tip_flag',
          place: 'right',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        })
      ])
    );
  }
}

export default AdminManageDul;
