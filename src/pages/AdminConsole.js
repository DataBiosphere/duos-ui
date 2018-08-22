import { Component } from 'react';
import { div, hr } from 'react-hyperscript-helpers';
import { AdminConsoleBox } from '../components/AdminConsoleBox';
import { PageHeading } from '../components/PageHeading';
import { AddDulModal } from '../components/modals/AddDulModal';
import { AddUserModal } from '../components/modals/AddUserModal';
import { AddDatasetModal } from '../components/modals/AddDatasetModal';

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
                                    icon_name: 'manage-dul',
                                    icon_size: 'default',
                                    unreviewed_cases: 9
                                }),
                            ]),

                            div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                                AddDulModal({
                                    linkType: "console-tag",
                                    id: 'btn_addDUL',
                                    modalBtnStyle: "admin-box-wrapper",
                                    description: 'Catalog a Data Use Limitation Record in the system',
                                    icon_name: 'add-dul',
                                    icon_size: 'default'
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
                                    icon_name: 'manage-user',
                                    icon_size: 'default',
                                    unreviewed_cases: 8
                                 }),
                            ]),

                            div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                                AddUserModal({
                                    linkType: "console-tag",
                                    id: 'btn_addUser',
                                    modalBtnStyle: "admin-box-wrapper",
                                    description: 'Catalog a new User in the system',
                                    icon_name: 'add-user',
                                    icon_size: 'default'
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
                                    icon_name: 'manage-access',
                                    icon_size: 'default',
                                    unreviewed_cases: 0
                                 }),
                            ]),

                            div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                                AddDatasetModal({
                                    linkType: "console-tag",
                                    id: 'btn_addDataset',
                                    modalBtnStyle: "admin-box-wrapper",
                                    icon_name: 'add-dataset',
                                    icon_size: 'large', 
                                    title: "Add Datasets",
                                    description: 'Store Datasets associated with Data Use Limitations',
                                }),
                            ]),
                        ]),

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                                AddDulModal({
                                    linkType: "console-tag",
                                    id: 'btn_setDataOwnerElectionTimeout',
                                    modalBtnStyle: "admin-box-wrapper",
                                    title: 'Set Data Owner election Timeout',
                                    description: 'Manage Data Owner election expiration time',
                                    icon_name: 'manage-timeout',
                                    icon_size: 'default'
                                }),
                            ]),

                            div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                                AdminConsoleBox({
                                    id: 'btn_invalidRequest',
                                    url: '/invalid_restrictions',
                                    color: 'common',
                                    title: 'Invalid Request Restrictions',
                                    description: 'Show Invalid Restrictions for Data Use Limitations and Data Access Requests',
                                    icon_name: 'invalid-restrictions',
                                    icon_size: 'large',
                                    unreviewed_cases: 0
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
                                    icon_name: 'manage-ontologies',
                                    icon_size: 'large',
                                    unreviewed_cases: 0
                                 }),
                            ]),

                            div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                                AddDulModal({
                                    linkType: "console-tag",
                                    id: 'btn_addOntologies',
                                    modalBtnStyle: "admin-box-wrapper",
                                    title: 'Add Ontologies',
                                    description: 'Store Ontologies for index',
                                    icon_name: 'add-ontologies',
                                    icon_size: 'large'
                                }),
                            ]),
                        ]),
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