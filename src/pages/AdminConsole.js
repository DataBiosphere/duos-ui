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
      showAddUserModal: false,
      showAddDatasetModal: false,
      showAddOntologiesModal: false,
      showEditDulModal: false,
      showEditUserModal: false,
      showElectionTimeoutModal: false
    };

    this.okModal = this.okModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.afterModalOpen = this.afterModalOpen.bind(this);

    this.addDul = this.addDul.bind(this);
    this.addUser = this.addUser.bind(this);
    this.addDataset = this.addDataset.bind(this);
    this.addOntologies = this.addOntologies.bind(this);

    this.editDul = this.editDul.bind(this);
    this.editUser = this.editUser.bind(this);
    this.electionTimeout = this.electionTimeout.bind(this);

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

  addDataset() {
    this.setState(prev => {
      prev.showAddDatasetModal = true;
      return prev;
    });
  }

  addOntologies() {
    this.setState(prev => {
      prev.showAddOntologiesModal = true;
      return prev;
    });
  }

  editDul() {
    this.setState(prev => {
      prev.showEditDulModal = true;
      return prev;
    });
  }

  editUser() {
    this.setState(prev => {
      prev.showEditUserModal = true;
      return prev;
    });
  }

  electionTimeout() {
    this.setState(prev => {
      prev.showElectionTimeoutModal = true;
      return prev;
    });
  }

  okModal(name) {
    console.log('okModal ------------------> ' + name);

    switch (name) {
      case 'addDul':
        this.setState(prev => { prev.showAddDulModal = false; return prev; });
        break;
      case 'addUser':
        this.setState(prev => { prev.showAddUserModal = false; return prev; });
        break;
      case 'addDataset':
        this.setState(prev => { prev.showAddDatasetModal = false; return prev; });
        break;
      case 'addOntologies':
        this.setState(prev => { prev.showAddOntologiesModal = false; return prev; });
        break;
      case 'editDul':
        this.setState(prev => { prev.showEditDulModal = false; return prev; });
        break;
      case 'editUser':
        this.setState(prev => { prev.showEditUserModal = false; return prev; });
        break;
      case 'electionTimeout':
        this.setState(prev => { prev.showElectionTimeoutModal = false; return prev; });
        break;
      default:
        break;
    }
  }

  closeModal(name) {
    console.log('closeModel ------------------> ' + name);

    switch (name) {
      case 'addDul':
        this.setState(prev => { prev.showAddDulModal = false; return prev; });
        break;
      case 'addUser':
        this.setState(prev => { prev.showAddUserModal = false; return prev; });
        break;
      case 'addDataset':
        this.setState(prev => { prev.showAddDatasetModal = false; return prev; });
        break;
      case 'addOntologies':
        this.setState(prev => { prev.showAddOntologiesModal = false; return prev; });
        break;
      case 'editDul':
        this.setState(prev => { prev.showEditDulModal = false; return prev; });
        break;
      case 'editUser':
        this.setState(prev => { prev.showEditUserModal = false; return prev; });
        break;
      case 'electionTimeout':
        this.setState(prev => { prev.showElectionTimeoutModal = false; return prev; });
        break;
      default:
        break;
    }
  }

  afterModalOpen(name) {
    console.log('afterModalOpen ------------------> ' + name);

    switch (name) {
      case 'addDul':
        this.setState(prev => { prev.showAddDulModal = false; return prev; });
        break;
      case 'addUser':
        this.setState(prev => { prev.showAddUserModal = false; return prev; });
        break;
      case 'addDataset':
        this.setState(prev => { prev.showAddDatasetModal = false; return prev; });
        break;
      case 'addOntologies':
        this.setState(prev => { prev.showAddOntologiesModal = false; return prev; });
        break;
      case 'editDul':
        this.setState(prev => { prev.showEditDulModal = false; return prev; });
        break;
      case 'editUser':
        this.setState(prev => { prev.showEditUserModal = false; return prev; });
        break;
      case 'electionTimeout':
        this.setState(prev => { prev.showElectionTimeoutModal = false; return prev; });
        break;
      default:
        break;
    }
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
                  color: 'dul',
                  title: 'Add Data Use Limitations',
                  description: 'Catalog a Data Use Limitation Record in the system',
                  iconName: 'add-dul',
                  iconSize: 'default',
                }),
                AddDulModal({
                  showModal: this.state.showAddDulModal,
                  onOKRequest: this.okModal,
                  onCloseRequest: this.closeModal,
                  onAfterOpen: this.afterModalOpen
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
                  color: 'common',
                  title: 'Add User',
                  description: 'Catalog a new User in the system',
                  iconName: 'add-user',
                  iconSize: 'default',
                }),
                AddUserModal({
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
                  unreviewedCases: 0
                }),
              ]),

              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_addDataset',
                  clickHandler: this.addDataset,
                  color: 'dataset',
                  title: 'Add Datasets',
                  description: 'Store Datasets associated with Data Use Limitations',
                  iconName: 'add-dataset',
                  iconSize: 'large',
                  unreviewedCases: 0
                }),
                AddDatasetModal({
                  showModal: this.state.showAddDatasetModal,
                  onOKRequest: this.okModal,
                  onCloseRequest: this.closeModal,
                  onAfterOpen: this.afterModalOpen
                }),
              ]),
            ]),

            div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
              div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                AdminConsoleBox({
                  id: 'btn_invalidRequest',
                  clickHandler: this.electionTimeout,
                  color: 'common',
                  title: 'Set Data Owner election Timeout',
                  description: 'Manage Data Owner election expiration time',
                  iconName: 'manage-timeout',
                  iconSize: 'large',
                  unreviewedCases: 0
                }),
                ElectionTimeoutModal({
                  showModal: this.state.showElectionTimeoutModal,
                  onOKRequest: this.okModal,
                  onCloseRequest: this.closeModal,
                  onAfterOpen: this.afterModalOpen
                }),
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
                AdminConsoleBox({
                  id: 'btn_manageOntologies',
                  clickHandler: this.addOntologies,
                  color: 'common',
                  title: 'Add Ontologies',
                  description: 'Select and manage Ontologies for index',
                  iconName: 'add-ontologies',
                  iconSize: 'large',
                  unreviewedCases: 0
                }),
                AddOntologiesModal({
                  showModal: this.state.showAddOntologiesModal,
                  onOKRequest: this.okModal,
                  onCloseRequest: this.closeModal,
                  onAfterOpen: this.afterModalOpen
                }),
              ]),
            ]),
          ]),
        ]),
      ])
    );
  }
}

export default AdminConsole;


