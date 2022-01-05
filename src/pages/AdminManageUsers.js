import _ from 'lodash';
import { Component, Fragment } from 'react';
import { a, button, div, h, hr, span } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import { AddUserModal } from '../components/modals/AddUserModal';
import { PageHeading } from '../components/PageHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';
import { User } from '../libs/ajax';
import manageUsersIcon from "../images/icon_manage_users.png";
import {hasCompletedProfile, USER_ROLES} from "../libs/utils";

class AdminManageUsers extends Component {

  // limit = 5;

  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      userList: [],
      showAddUserModal: false,
      limit: 10,
      currentPage: null,
    };
  }

  componentDidMount() {
    this.getUsers();
  }

  componentDidUpdate() {
    ReactTooltip.rebuild();
  }

  async getUsers() {
    const users = await User.list(USER_ROLES.admin);
    let userList = users.map(user => {
      user.researcher = false;
      user.hasCompletedProfile = false;
      if (user.roles != null) {
        user.roles.forEach(role => {
          if (role.name === 'Researcher' || user.name === 'RESEARCHER') {
            user.researcher = true;
            user.hasCompletedProfile = hasCompletedProfile(user);
          }
        });
      }
      user.key = user.id;
      return user;
    });

    this.setState(prev => {
      prev.currentPage = 1;
      prev.userList = userList;
      return prev;
    }, () => {
      ReactTooltip.rebuild();
    });

  }

  search = (e) => {
    let query = e.target.value;
    this.setState(prev => {
      prev.currentPage = 1;
      prev.searchUsers = query;
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

  addUser = () => {
    this.setState(prev => {
      prev.user = null;
      prev.showAddUserModal = true;
      return prev;
    });
  };

  editUser = (user) => () => {
    this.setState(prev => {
      prev.userEmail = user.email;
      prev.user = user;
      prev.showAddUserModal = true;
      return prev;
    });
  };

  openResearcherReview = (userId) => {
    this.props.history.push(`researcher_review/${userId}`);
  };

  okModal = async () => {
    this.setState(prev => {
      prev.showAddUserModal = false;
      return prev;
    }, () => {
      this.getUsers();
    });
  };

  closeModal = () => {
    this.setState(prev => { prev.showAddUserModal = false; return prev; });
  };

  afterModalOpen = () => {
    this.setState(prev => { prev.showAddUserModal = false; return prev; });
  };

  handleSearchUser = (query) => {
    this.setState({ searchUserText: query });
  };

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  render() {

    const { currentPage, searchUserText } = this.state;

    return (
      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "manageUsers", imgSrc: manageUsersIcon, iconSize: "medium", color: "common", title: "Manage Users", description: "Select and manage users and their roles" }),
          ]),
          div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-wrapper no-padding" }, [
            div({ className: "col-lg-7 col-md-7 col-sm-7 col-xs-7" }, [
              h(SearchBox, { id: 'manageUsers', searchHandler: this.handleSearchUser, pageHandler: this.handlePageChange, color: 'common' })
            ]),

            a({
              id: 'btn_addUser',
              className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 btn-primary btn-add common-background no-margin",
              onClick: this.addUser
            }, [
              div({ className: "all-icons add-user_white" }),
              span({}, ["Add User"]),
            ]),

            AddUserModal({
              isRendered: this.state.showAddUserModal,
              showModal: this.state.showAddUserModal,
              onOKRequest: this.okModal,
              onCloseRequest: this.closeModal,
              onAfterOpen: this.afterModalOpen,
              user: this.state.user,
            }),

          ])
        ]),
        div({ className: "jumbotron table-box" }, [
          div({ className: "row no-margin" }, [
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header common-color" }, ["User Name"]),
            div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 cell-header common-color" }, ["Google account id"]),
            div({ className: "col-lg-4 col-md-4 col-sm-3 col-xs-3 cell-header common-color" }, ["User Role"]),
            div({ className: "col-lg-1 col-md-1 col-sm-2 col-xs-2 cell-header common-color f-center" }, ["Edit User"]),
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header common-color f-center" }, ["Researcher Review"]),
          ]),

          hr({ className: "table-head-separator" }),

          this.state.userList.filter(this.searchTable(searchUserText)).slice((currentPage - 1) * this.state.limit, currentPage * this.state.limit).map((user) => {
            return h(Fragment, { key: user.dacUserId }, [
              div({ id: user.dacUserId, className: "row no-margin tableRow" }, [
                div({ id: user.dacUserId + "_name", name: "userName", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [user.displayName]),
                div({ id: user.dacUserId + "_email", name: "userEmail", className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 cell-body text" }, [user.email]),
                div({ id: user.dacUserId + "_roles", name: "userRoles", className: "col-lg-4 col-md-4 col-sm-3 col-xs-3 cell-body text bold" }, [
                  span({ className: "admin-users-list"},
                    _.map(_.sortedUniq(_.map(user.roles, 'name')),
                      (n) => {return span({ className: "enabled default-color"}, n);})
                  ),
                ]),
                div({ className: "col-lg-1 col-md-1 col-sm-2 col-xs-2 cell-body f-center" }, [
                  button({
                    id: user.dacUserId + "_btnEditUser",
                    name: 'btn_editUser',
                    className: "cell-button hover-color",
                    onClick: this.editUser(user)
                  }, ["Edit"]),
                ]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                  div({ className: "row no-margin" }, [


                    a({
                      id: user.dacUserId + "_btnResearcherReview", name: "btn_researcherReview", onClick: () => this.openResearcherReview(user.dacUserId),
                      isRendered: user.researcher !== false && user.hasCompletedProfile, className: "admin-manage-buttons col-lg-10 col-md-10 col-sm-10 col-xs-9"
                    }, [
                      div({
                        className:
                            ((user.researcher === true && user.hasCompletedProfile && user.status === 'pending') || user.status === null) ? 'enabled'
                              : user.researcher === true && user.hasCompletedProfile && user.status !== 'pending' ? 'editable'
                                : user.researcher === false || !user.hasCompletedProfile ? 'disabled' : ''
                      }, ["Review"]),
                    ]),

                    a({ isRendered: user.researcher === "false" || !user.hasCompletedProfile, className: "admin-manage-buttons col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                      div({ className: "disabled" }, ["Review"]),
                    ]),

                    div({ id: user.dacUserId + "_flagBonafide", name: "flag_bonafide", className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 bonafide-icon" }, [
                      span({ className: "glyphicon glyphicon-thumbs-up dataset-color", isRendered: user.status === 'approved' && user.hasCompletedProfile, "data-tip": "Bonafide researcher", "data-for": "tip_bonafide" }),

                      span({ className: "glyphicon glyphicon-thumbs-down cancel-color", isRendered: user.status === 'rejected' && user.hasCompletedProfile, "data-tip": "Non-Bonafide researcher", "data-for": "tip_nonBonafide" }),

                      span({ className: "glyphicon glyphicon-hand-right hover-color", isRendered: user.researcher && user.status === 'pending' && user.hasCompletedProfile, "data-tip": "Researcher review pending", "data-for": "tip_pendingReview" }),

                      span({ className: "glyphicon glyphicon-hand-right dismiss-color", isRendered: !(user.hasCompletedProfile) || (user.researcher === false), disabled: "disabled" }, []),
                    ]),

                  ]),

                ]),

              ]),
              hr({ className: "table-body-separator" })
            ]);
          }),
          PaginatorBar({
            total: this.state.userList.filter(this.searchTable(searchUserText)).length,
            limit: this.state.limit,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          }),
          h(ReactTooltip, {
            id: "tip_bonafide",
            place: 'right',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper',
          }),
          h(ReactTooltip, {
            id: "tip_nonBonafide",
            place: 'right',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          }),
          h(ReactTooltip, {
            id: "tip_pendingReview",
            place: 'right',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          }),
        ])
      ])
    );
  }
}

export default AdminManageUsers;
