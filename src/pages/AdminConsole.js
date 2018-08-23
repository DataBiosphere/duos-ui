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
            showModal: false
        };

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
                                AddDulModal({
                                    linkType: "console-tag",
                                    id: 'btn_addDUL',
                                    modalBtnStyle: "admin-box-wrapper",
                                    description: 'Catalog a Data Use Limitation Record in the system',
                                    iconName: 'add-dul',
                                    iconSize: 'default'
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
                                AddUserModal({
                                    linkType: "console-tag",
                                    id: 'btn_addUser',
                                    modalBtnStyle: "admin-box-wrapper",
                                    description: 'Catalog a new User in the system',
                                    iconName: 'add-user',
                                    iconSize: 'default'
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
                                AddDatasetModal({
                                    linkType: "console-tag",
                                    id: 'btn_addDataset',
                                    modalBtnStyle: "admin-box-wrapper",
                                    iconName: 'add-dataset',
                                    iconSize: 'large', 
                                    title: "Add Datasets",
                                    description: 'Store Datasets associated with Data Use Limitations',
                                }),
                            ]),
                        ]),

                        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                                ElectionTimeoutModal({
                                    linkType: "console-tag",
                                    id: 'btn_setDataOwnerElectionTimeout',
                                    modalBtnStyle: "admin-box-wrapper",
                                    title: 'Set Data Owner election Timeout',
                                    description: 'Manage Data Owner election expiration time',
                                    iconName: 'manage-timeout',
                                    iconSize: 'default'
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
                                AddOntologiesModal({
                                    linkType: "console-tag",
                                    id: 'btn_addOntologies',
                                    modalBtnStyle: "admin-box-wrapper",
                                    title: 'Add Ontologies',
                                    description: 'Store Ontologies for index',
                                    iconName: 'add-ontologies',
                                    iconSize: 'large'
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