import { Component } from 'react';
import { div, hr, h2, br, small } from 'react-hyperscript-helpers';
import { AdminConsoleBox } from '../components/AdminConsoleBox';
import { PageHeading } from '../components/PageHeading';

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
            displayName: 'Nadya Lopez Zalba'
        }

        return (

            div({}, [
                div({ className: "container" }, [
                    div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                        PageHeading({ imgSrc: "", iconSize: "none",  color: "common", title: "Welcome " + currentUser.displayName + "!", description: "What would you like to do today?" }),
                        hr({ className: "section-separator" })
                    ]),

                    div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            AdminConsoleBox({ id: '0010', url: '/admin_manage_dul', color: 'dul-color', color: 'dul-color', title: 'Manage Data Use Limitations', description: 'Select and manage Data Use Limitations Record for review', icon_name: 'manage-dul',  icon_size: 'default', unreviewed_cases: 9 }),
                            AdminConsoleBox({ id: '0011', clickHandler: this.handleOpenModal, color: 'dul-color', title: 'Add Data Use Limitations', description: 'Catalog a Data Use Limitation Record in the system', icon_name: 'add-dul', icon_size: 'default' }),
                        ]),

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            AdminConsoleBox({ id: '0012', url: '/admin_users', color: 'common-color', title: 'Manage Users', description: 'Select and manage Users and their roles', icon_name: 'manage-user', icon_size: 'default', unreviewed_cases: 8 }),
                            AdminConsoleBox({ id: '0013', clickHandler: this.addUser, color: 'common-color', title: 'Add User', description: 'Catalog a new User in the system', icon_name: 'add-user', icon_size: 'default' }),
                        ]),

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            AdminConsoleBox({ id: '0014', url: '/admin_manage_access', color: 'access-color', title: 'Manage Data Access Request', description: 'Select and manage Data Access Request for review', icon_name: 'manage-access', icon_size: 'default', unreviewed_cases: 0 }),
                            AdminConsoleBox({ id: '0015', clickHandler: this.addDataSets, color: 'dataset-color', title: 'Add Datasets', description: 'Store Datasets associated with Data Use Limitations', icon_name: 'add-dataset', icon_size: 'large' }),
                        ]),

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            AdminConsoleBox({ id: '0016', clickHandler: this.setTimeout, color: 'common-color', title: 'Set Data Owner election Timeout', description: 'Manage Data Owner election expiration time', icon_name: 'manage-timeout', icon_size: 'default' }),
                            AdminConsoleBox({ id: '0017', url: '/invalid_restrictions', color: 'common-color', title: 'Invalid Request Restrictions', description: 'Show Invalid Restrictions for Data Use Limitations and Data Access Requests', icon_name: 'invalid-restrictions', icon_size: 'large', unreviewed_cases: 0 }),
                        ]),

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            AdminConsoleBox({ id: '0018', url: '/manage_ontologies', color: 'common-color', title: 'Manage Ontologies', description: 'Select and manage Ontologies for index', icon_name: 'manage-ontologies', icon_size: 'large', unreviewed_cases: 0 }),
                            AdminConsoleBox({ id: '0019', clickHandler: this.addOntology, color: 'common-color', title: 'Add Ontologies', description: 'Store Ontologies for index', icon_name: 'add-ontologies', icon_size: 'large' }),
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