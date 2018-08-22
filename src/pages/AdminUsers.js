import { Component, Fragment } from 'react';
import { div, hr, h2, br, small, a, span, i, h, img, input } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { User } from '../libs/ajax';

class AdminUsers extends Component {
    
    constructor(props) {
        super(props);
        this.state = {userList:[]};
        this.getUsers();
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.getUsers = this.getUsers.bind(this);
    }

    async getUsers(){
        const users = await User.list();
        let userList = [];
        users.map(user => {
          user.researcher = false;
          user.roles.map(role => {
              if(role.name === 'Researcher') {
                  user.status = role.status;
                  user.completed = role.profileCompleted;
                  user.researcher = true;
              }
              return user;
          });
          user.key = user.id;
          userList.push(user);
          return userList;
        });
        this.setState({ userList: userList });
      } 

    handleOpenModal() {
        this.setState({ showModal: true });
    }

    handleCloseModal() {
        this.setState({ showModal: false });
    }


    render() {        

        return (
            div({ className: "container" }, [
                div({ className: "row no-margin" }, [
                    div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
                        PageHeading({ imgSrc: "../images/icon_manage_users.png", iconSize: "medium",  color: "common", title: "Manage Users", description: "Select and manage users and their roles" }),
                    ]),
                    div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-reviewed no-padding" }, [
                        div({ className: "col-lg-7 col-md-7 col-sm-7 col-xs-7" }, [
                            div({ className: "search-text" }, [
                                i({ className: "glyphicon glyphicon-search common-color" }),
                                input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", "ng-model": "searchUsers" }),
                            ]),
                        ]),

                        a({ className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 admin-add-button common-background", onClick: this.addUser }, [
                            div({ className: "all-icons add-user_white" }, []),
                            span({}, ["Add User"]),
                        ]),
                    ])
                ]),
                div({ className: "jumbotron box-vote-singleresults box-vote-no-margin" }, [
                    div({ className: "row" }, [
                        div({ className: "pvotes-box-head" }, [
                            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-box-subtitle common-color" }, ["User Name"]),
                            div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 pvotes-box-subtitle common-color" }, ["Google account id"]),
                            div({ className: "col-lg-4 col-md-4 col-sm-3 col-xs-3 pvotes-box-subtitle common-color" }, ["User Roles"]),
                            div({ className: "col-lg-1 col-md-1 col-sm-2 col-xs-2 pvotes-box-subtitle common-color f-center" }, ["Edit User"]),
                            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-box-subtitle common-color f-center" }, ["Researcher Review"]),
                        ]),
                        div({ className: "admin-box-body" }, [
                            hr({ className: "pvotes-main-separator" }),
                            div({ "dir-paginate": "user in AdminUsers.usersList.dul | filter: searchUsers | itemsPerPage:8" }, [
                                this.state.userList.map(user => {
                                    return h(Fragment, {}, [
                                        div({ className: "row pvotes-main-list" }, [
                                            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-list-id" }, [user.displayName]),
                                            div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 pvotes-list-id" }, [user.email]),
                                            div({ className: "col-lg-4 col-md-4 col-sm-3 col-xs-3 pvotes-list-id" }, [
                                                user.roles.map(role =>
                                                    span({ className: "admin-users-list" }, [
                                                        span({ className: "enabled default-color", isRendered: role.name === 'Admin' }, ["Admin"]),
                                                        span({ className: "enabled default-color", isRendered: role.name === 'Member' }, ["Member"]),
                                                        span({ className: "enabled default-color", isRendered: role.name === 'Chairperson' }, ["Chairperson"]),
                                                        span({ className: "enabled default-color", isRendered: role.name === 'Alumni' }, ["Alumni"]),
                                                        span({ className: "enabled default-color", isRendered: role.name === 'Researcher' }, ["Researcher"]),
                                                        span({ className: "enabled default-color", isRendered: role.name === 'DataOwner' }, ["Data Owner"]),
                                                    ])
                                                )
                                            ]),

                                            a({ href: "", className: "admin-manage-buttons col-lg-1 col-md-1 col-sm-2 col-xs-2 no-padding" }, [
                                                div({ onClick: this.editUser(user.email), className: "enabled" }, ["Edit"]),
                                            ]),
                                            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 no-padding" }, [
                                                div({ className: "row no-margin" }, [
                                                    a({ isRendered: user.researcher !== false && user.completed, "ui-sref": "researcher_review({dacUserId: '{{user.dacUserId}}'})", className: "admin-manage-buttons col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                                                        // div({ className: "{'enabled': user.researcher && user.completed && user.status ::: 'pending' || user.status ::: null, 'editable': user.researcher && user.completed && user.status !:: 'pending', 'disabled': user.researcher :: false || !(user.completed)}" }, ["Review"]),
                                                        div({ className: 
                                                            user.researcher && user.completed && user.status === 'pending' || user.status === null ? 'enabled'
                                                            : user.researcher && user.completed && user.status !== 'pending' ? 'editable'
                                                            : user.researcher === false || !user.completed ? 'disabled': '' }, ["Review"]),
                                                    ]),
                                                    a({ isRendered: user.researcher === false || !user.completed, className: "admin-manage-buttons col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                                                        div({ className: "disabled" }, ["Review"]),
                                                    ]),
                                                    div({ isRendered: user.researcher === true, className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 bonafide-icon" }, [
                                                        span({ className: "glyphicon glyphicon-thumbs-up dataset-color", isRendered: user.status === 'approved' && user.completed, tooltip: "Bonafide researcher", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "left" }, []),
                                                        span({ className: "glyphicon glyphicon-thumbs-down cancel-color", isRendered: user.status === 'rejected' && user.completed, tooltip: "Non-Bonafide researcher", "tooltip-className": "tooltip-class", "tooltip- trigger": "true", "tooltip-placement": "left" }, []),
                                                        span({ className: "glyphicon glyphicon-hand-right hover-color", isRendered: user.status === 'pending' && user.completed, tooltip: "Researcher review pending", "tooltip-className": "tooltip-class", "tooltip -trigger": "true", "tooltip-placement": "left" }, []),
                                                        span({ className: "glyphicon glyphicon-hand-right dismiss-color", isRendered: !(user.completed) }, []),
                                                    ]),
                                                    div({ isRendered: user.researcher === false, className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 bonafide-icon" }, [
                                                        span({ className: "glyphicon glyphicon-hand-right dismiss-color" }, []),
                                                    ]),
                                                ]),

                                            ]),

                                        ]),
                                        hr({ className: "pvotes-separator" })
                                    ])
                                }),
                                div({ "dir-pagination-controls": "true", "max-size": "8", "direction-links": "true", "boundary-links": "true", className: "pvotes-pagination" }, []),
                            ])
                        ])
                    ])
                ])
            ])
        );
    }

    editUser() {

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

export default AdminUsers;