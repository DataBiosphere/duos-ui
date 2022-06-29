import { Component } from 'react';
import { div, hr } from 'react-hyperscript-helpers';
import { AdminConsoleBox } from '../components/AdminConsoleBox';
import { PageHeading } from '../components/PageHeading';
import { AddUserModal } from '../components/modals/AddUserModal';
import { PendingCases } from '../libs/ajax';
import { Storage } from '../libs/storage';

class AdminConsole extends Component {

  constructor(props) {
    super(props);

    let currentUser = Storage.getCurrentUser();

    this.state = {
      currentUser: currentUser,
      showModal: false,
      showAddUserModal: false,
      dulUnreviewedCases: 0,
      darUnreviewedCases: 0,
      timeOut: {},
      isDataSetElection: {},
      env: props.env
    };
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

  okModal = (name) => {

    switch (name) {
      case 'addUser':
        this.setState({showAddUserModal: false});
        this.props.history.push('admin_manage_users');
        break;
      default: break;
    }
  };

  closeModal = (name) => {
    switch (name) {
      case 'addUser': this.setState({ showAddUserModal: false }); break;
      default: break;
    }
  };

  afterModalOpen = (name) => {
    switch (name) {
      case 'addUser': this.setState(prev => { prev.showAddUserModal = false; return prev; }); break;
      default: break;
    }
  };

  render() {

    const { currentUser, dulUnreviewedCases, darUnreviewedCases } = this.state;

    return (

      div({}, [

        div({ className: 'container' }, [
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
            PageHeading({ id: 'adminConsole', color: 'common', title: 'Welcome to your Admin Console, ' + currentUser.displayName + '!', description: 'What would you like to do today?' }),
            hr({ className: 'section-separator' })
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
              div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box' }, [
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
              div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box' }, [
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

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
              div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box' }, [
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

              div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box' }, [
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

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
              // TODO: `admin_manage_access` will be fully deprecated with MDV
              div({
                isRendered: (this.props.env === 'prod'),
                className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box' }, [
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
              div({
                isRendered: (this.props.env !== 'prod'),
                className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box' }, [
                AdminConsoleBox({
                  id: 'btn_manageDarCollections',
                  url: '/admin_manage_dar_collections',
                  color: 'access',
                  title: 'Manage DAR Collection',
                  description: 'Select and access DAR Collections for review',
                  iconName: 'manage-access',
                  iconSize: 'large',
                })
              ]),

              div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box' }, [
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

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
              div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box' }, [
                AdminConsoleBox({
                  id: 'btn_manageDAC',
                  url: '/manage_dac',
                  color: 'common',
                  title: 'Manage Data Access Committee',
                  description: 'Create and manage Data Access Committees',
                  iconName: 'manage-dac',
                  iconSize: 'large',
                })
              ])
            ]),
          ])
        ])
      ])
    );
  }
}

export default AdminConsole;
