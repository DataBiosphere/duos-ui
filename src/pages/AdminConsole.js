import { Component } from 'react';
import { div, hr, h2, br, small } from 'react-hyperscript-helpers';
import { AdminConsoleBox } from '../components/AdminConsoleBox';

class AdminConsole extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showModal: false
        };
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
    }

    handleOpenModal() {
        this.setState({ showModal: true });
    }

    handleCloseModal() {
        this.setState({ showModal: false });
    }


    render() {

        let currentUser = {
            displayName: 'Diego Gil'
        }

        return (

            div({}, [
                div({ className: "container" }, [

                    div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                        h2({ className: "common-color cm-title" }, ["Welcome ", currentUser.displayName, "!",
                            br({}, []),
                            small({}, ["What would you like to do today?"]),
                        ]),
                        hr({ className: "section-separator" })
                    ]),

                    div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            AdminConsoleBox({ id: '0010', url: '/admin_manage_dul', color: 'dul-color', title: 'Manage Data Use Limitations', subtitle: 'Select and manage Data Use Limitations Record for review', icon_name: 'manage-dul', unreviewed_cases: 9 }),
                            AdminConsoleBox({ id: '0011', clickHandler: this.handleOpenModal, color: 'dul-color', title: 'Add Data Use Limitations', subtitle: 'Catalog a Data Use Limitation Record in the system', icon_name: 'add-dul' }),
                        ]),

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            AdminConsoleBox({ id: '0012', url: '/admin_users', color: 'common-color', title: 'Manage Users', subtitle: 'Select and manage Users and their roles', icon_name: 'manage-user', unreviewed_cases: 8 }),
                            AdminConsoleBox({ id: '0013', clickHandler: this.addUser, color: 'common-color', title: 'Add User', subtitle: 'Catalog a new User in the system', icon_name: 'add-user' }),
                        ]),

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            AdminConsoleBox({ id: '0014', url: '/admin_manage_access', color: 'access-color', title: 'Manage Data Access Reques', subtitle: 'Select and manage Data Access Request for review', icon_name: 'manage-access', unreviewed_cases: 0 }),
                            AdminConsoleBox({ id: '0015', clickHandler: this.addDataSets, color: 'dataset-color', title: 'Add Datasets', subtitle: 'Store Datasets associated with Data Use Limitations', icon_name: 'add-dataset' }),
                        ]),

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            AdminConsoleBox({ id: '0016', clickHandler: this.setTimeout, color: 'common-color', title: 'Set Data Owner election Timeout', subtitle: 'Manage Data Owner election expiration time', icon_name: 'manage-timeout' }),
                            AdminConsoleBox({ id: '0017', url: '/invalid_restrictions', color: 'common-color', title: 'Invalid Request Restrictions', subtitle: 'Show Invalid Restrictions for Data Use Limitations and Data Access Requests', icon_name: 'invalid-restrictions', unreviewed_cases: 0 }),
                        ]),

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            AdminConsoleBox({ id: '0018', url: '/manage_ontologies', color: 'common-color', title: 'Manage Ontologies', subtitle: 'Select and manage Ontologies for index', icon_name: 'manage-ontologies', unreviewed_cases: 0 }),
                            AdminConsoleBox({ id: '0019', clickHandler: this.addOntology, color: 'common-color', title: 'Add Ontologies', subtitle: 'Store Ontologies for index', icon_name: 'add-ontologies' }),
                        ])
                    ]),
                ]),
            ])
        );
    }

    addDul() {
        console.log('addDul');
    }

    addUser() {
        console.log('addUser');
    }

    addDataSets() {
        console.log('addDataSets');
    }

    setTimeout() {
        console.log('setTimeout');
    }

    addOntology() {
        console.log('addOntology');
    }

}

export default AdminConsole;