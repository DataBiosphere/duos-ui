import { Component } from 'react';
import { div, hr } from 'react-hyperscript-helpers';
import { AdminConsoleBox } from '../components/AdminConsoleBox';
import { PageHeading } from '../components/PageHeading';
import { AddUserModal } from '../components/modals/AddUserModal';
import { ElectionTimeoutModal } from '../components/modals/ElectionTimeoutModal';
import { Election, ElectionTimeout, PendingCases } from '../libs/ajax';
import { Storage } from '../libs/storage';

class AdminConsole extends Component {

  constructor(props) {
    super(props);

    let currentUser = Storage.getCurrentUser();

    this.state = {
      currentUser: currentUser,
      showModal: false,
      showAddUserModal: false,
      showElectionTimeoutModal: false,
      dulUnreviewedCases: 0,
      darUnreviewedCases: 0,
      timeOut: {},
      isDataSetElection: {}
    };
    this.electionTimeout = this.electionTimeout.bind(this);
  }

  componentDidMount() {
    let currentUser = Storage.getCurrentUser();
    this.setState({
      currentUser: currentUser
    }, () => {
      this.init();
    });
  }

  async init() {

    PendingCases.findConsentUnReviewed().then(
      duls => {
        this.setState({
          dulUnreviewedCases: duls.dulUnReviewedCases,
        });
      }
    );

    PendingCases.findDARUnReviewed().then(
      dars => {
        this.setState({
          darUnreviewedCases: dars.darUnReviewedCases,
        });
      }
    );
  }

  addUser = () => {
    this.setState(prev => {
      prev.showAddUserModal = true;
      return prev;
    });
  };

  async electionTimeout() {
    const timeOut = await ElectionTimeout.findApprovalExpirationTime();
    const isDataSetElection = await Election.isDataSetElectionOpen();

    this.setState(prev => {
      prev.showElectionTimeoutModal = true;
      prev.timeOut = timeOut;
      prev.isDataSetElection = isDataSetElection;
      return prev;
    });
  }

  okModal = (name) => {

    switch (name) {
      case 'addUser':
        this.setState({showAddUserModal: false});
        this.props.history.push(`admin_manage_users`);
        break;
      case 'electionTimeout': this.setState({ showElectionTimeoutModal: false }); break;
      default: break;
    }
  };

  closeModal = (name) => {
    switch (name) {
      case 'addUser': this.setState({ showAddUserModal: false }); break;
      case 'electionTimeout': this.setState({ showElectionTimeoutModal: false }); break;
      default: break;
    }
  };

  afterModalOpen = (name) => {
    switch (name) {
      case 'addUser': this.setState(prev => { prev.showAddUserModal = false; return prev; }); break;
      case 'electionTimeout': this.setState(prev => { prev.showElectionTimeoutModal = false; return prev; }); break;
      default: break;
    }
  };

  render() {

    const { currentUser, dulUnreviewedCases, darUnreviewedCases } = this.state;

    const consoleBoxPlaceholder = div({
      style: { margin: "10px", padding: "0px", display: "inline-block" },
      className: "col-lg-6 col-md-6 col-sm-12 col-xs-12" }, []);

    return (

      div({}, [

        div({ className: "container" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
            PageHeading({ id: "adminConsole", color: "common", title: "Welcome to your Admin Console, " + currentUser.displayName + "!", description: "What would you like to do today?" }),
            hr({ className: "section-separator" })
          ]),

          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [

            div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_manageDUL',
                  url: '/admin_manage_dul',
                  color: 'dul',
                  title: 'Manage Data Use Limitations',
                  description: 'Select and manage Data Use Limitations Record for review',
                  iconName: 'manage-dul',
                  iconSize: 'default',
                  unreviewedCases: dulUnreviewedCases
                }),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_manageInstitutions',
                  url: '/admin_manage_institutions',
                  color: 'common',
                  title: 'Manage Institutions',
                  description: 'Add and manage Institutions',
                  iconName: 'manage-user',
                  iconSize: 'default',
                }),
              ])
            ]),

            div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_manageUsers',
                  url: '/admin_manage_users',
                  color: 'common',
                  title: 'Manage Users',
                  description: 'Select and manage Users and their roles',
                  iconName: 'manage-user',
                  iconSize: 'default',
                }),
              ]),

              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_addUser',
                  clickHandler: this.addUser,
                  color: 'common',
                  title: 'Add User',
                  description: 'Catalog a new User in the system',
                  iconName: 'add-user',
                  iconSize: 'default',
                }),
                AddUserModal({
                  isRendered: this.state.showAddUserModal,
                  showModal: this.state.showAddUserModal,
                  onOKRequest: this.okModal,
                  onCloseRequest: this.closeModal,
                  onAfterOpen: this.afterModalOpen
                }),
              ]),
            ]),

            div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_manageDAR',
                  url: '/admin_manage_access',
                  color: 'access',
                  title: 'Manage Data Access Request',
                  description: 'Select and manage Data Access Request for review',
                  iconName: 'manage-access',
                  iconSize: 'default',
                  unreviewedCases: darUnreviewedCases
                }),
              ]),
              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_manageDAR',
                  url: '/admin_manage_lc',
                  color: 'access',
                  title: 'Manage Library Cards',
                  description: 'Select and manage Library Cards',
                  iconName: 'manage-access',
                  iconSize: 'default'
                }),
              ])
            ]),

            div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_manageDAC',
                  url: '/manage_dac',
                  color: 'common',
                  title: 'Manage Data Access Committee',
                  description: 'Create and manage Data Access Committees',
                  iconName: 'manage-dac',
                  iconSize: 'large',
                })
              ]),
              consoleBoxPlaceholder
            ]),

            div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_electionTimeout',
                  clickHandler: this.electionTimeout,
                  color: 'common',
                  title: 'Set Data Owner election Timeout',
                  description: 'Manage Data Owner election expiration time',
                  iconName: 'manage-timeout',
                  iconSize: 'large',
                  unreviewedCases: 0
                }),
                ElectionTimeoutModal({
                  timeOut: this.state.timeOut,
                  isDataSetElection: this.state.isDataSetElection,
                  showModal: this.state.showElectionTimeoutModal,
                  onOKRequest: this.okModal,
                  onCloseRequest: this.closeModal,
                  onAfterOpen: this.afterModalOpen
                })
              ]),
              consoleBoxPlaceholder
            ])
          ])
        ])
      ])
    );
  }
}

export default AdminConsole;
