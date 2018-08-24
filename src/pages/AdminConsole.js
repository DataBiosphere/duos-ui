import { Component } from 'react';
import { div, hr } from 'react-hyperscript-helpers';
import { AdminConsoleBox } from '../components/AdminConsoleBox';
import { PageHeading } from '../components/PageHeading';
import { AddDulModal } from '../components/modals/AddDulModal';
import { AddUserModal } from '../components/modals/AddUserModal';
import { AddDatasetModal } from '../components/modals/AddDatasetModal';
import { ElectionTimeoutModal } from '../components/modals/ElectionTimeoutModal';
import { AddOntologiesModal } from '../components/modals/AddOntologiesModal';

class AdminConsole extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      showAddDulModal: false,
      showAddUserModal: false
    };


    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);

    this.addDul = this.addDul.bind(this);
    this.closeAddDulModal = this.closeAddDulModal.bind(this);
    this.okAddDulModal = this.okAddDulModal.bind(this);
    this.afterAddDulModalOpen = this.afterAddDulModalOpen.bind(this);

    this.addUser = this.addUser.bind(this);
    this.closeAddUserModal = this.closeAddUserModal.bind(this);
    this.okAddUserModal = this.okAddUserModal.bind(this);
    this.afterAddUserModalOpen = this.afterAddUserModalOpen.bind(this);

  }

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  addDul() {
    this.setState(prev => {
      prev.showAddDulModal = true;
      return prev;
    });
  }

  addUser() {
    this.setState(prev => {
      prev.showAddUserModal = true;
      return prev;
    });
  }

  closeAddDulModal() {
    // this state change close AddDul modal
    this.setState(prev => {
      prev.showAddDulModal = false;
      return prev;
    });
  }

  okAddDulModal() {
    // this state change close AddDul modal
    this.setState(prev => {
      prev.showAddDulModal = false;
      return prev;
    });
  }

  afterAddDulModalOpen() {
    // not sure when to use this
    console.log('afterAddDulModalOpen', this.state, this.props);
  }

  closeAddUserModal() {
    // this state change close AddDul modal
    this.setState(prev => {
      prev.showAddUserModal = false;
      return prev;
    });
  }

  okAddUserModal() {
    // this state change close AddDul modal
    this.setState(prev => {
      prev.showAddUserModal = false;
      return prev;
    });
  }

  afterAddUserModalOpen() {
    // not sure when to use this
    console.log('afterAddUserModalOpen', this.state, this.props);
  }

  render() {

    let currentUser = {
      displayName: 'Nadya Lopez Zalba'
    }

    return (

      div({}, [

        div({ className: "container" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
            PageHeading({ imgSrc: "", iconSize: "none", color: "common", title: "Welcome " + currentUser.displayName + "!", description: "What would you like to do today?" }),
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
                  unreviewedCases: 9
                }),
              ]),

              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [

                AdminConsoleBox({
                  id: 'btn_addDUL',
                  clickHandler: this.addDul,
                  color: 'dul-color',
                  title: 'Add Data Use Limitations',
                  description: 'Catalog a Data Use Limitation Record in the system',
                  iconName: 'add-dul',
                  iconSize: 'default',
                }),
                AddDulModal({
                  showModal: this.state.showAddDulModal,
                  onOKRequest: this.okAddDulModal,
                  onCloseRequest: this.closeAddDulModal,
                  onAfterOpen: this.afterAddDulModalOpen
                }),

              ]),
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
                  unreviewedCases: 8
                }),
              ]),

              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_addUser',
                  clickHandler: this.addUser,
                  color: 'dul-color',
                  title: 'Add User',
                  description: 'Catalog a new User in the system',
                  iconName: 'add-user',
                  iconSize: 'default',
                }),
                AddUserModal({
                  showModal: this.state.showAddUserModal,
                  onOKRequest: this.okAddUserModal,
                  onCloseRequest: this.closeAddUserModal,
                  onAfterOpen: this.afterAddUserModalOpen
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
                  unreviewedCases: 0
                }),
              ]),

              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                // AddDatasetModal({
                //   linkType: "console-tag",
                //   id: 'btn_addDataset',
                //   modalBtnStyle: "admin-box-wrapper",
                //   iconName: 'add-dataset',
                //   iconSize: 'large',
                //   title: "Add Datasets",
                //   description: 'Store Datasets associated with Data Use Limitations',
                // }),
              ]),
            ]),

            div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                // ElectionTimeoutModal({
                //   linkType: "console-tag",
                //   id: 'btn_setDataOwnerElectionTimeout',
                //   modalBtnStyle: "admin-box-wrapper",
                //   title: 'Set Data Owner election Timeout',
                //   description: 'Manage Data Owner election expiration time',
                //   iconName: 'manage-timeout',
                //   iconSize: 'default'
                // }),
              ]),

              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_invalidRequest',
                  url: '/invalid_restrictions',
                  color: 'common',
                  title: 'Invalid Request Restrictions',
                  description: 'Show Invalid Restrictions for Data Use Limitations and Data Access Requests',
                  iconName: 'invalid-restrictions',
                  iconSize: 'large',
                  unreviewedCases: 0
                }),
              ]),
            ]),

            div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_manageOntologies',
                  url: '/manage_ontologies',
                  color: 'common',
                  title: 'Manage Ontologies',
                  description: 'Select and manage Ontologies for index',
                  iconName: 'manage-ontologies',
                  iconSize: 'large',
                  unreviewedCases: 0
                }),
              ]),

              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                // AddOntologiesModal({
                //   linkType: "console-tag",
                //   id: 'btn_addOntologies',
                //   modalBtnStyle: "admin-box-wrapper",
                //   title: 'Add Ontologies',
                //   description: 'Store Ontologies for index',
                //   iconName: 'add-ontologies',
                //   iconSize: 'large'
                // }),
              ]),
            ]),
          ]),
        ]),
      ])
    );
  }
}

export default AdminConsole;