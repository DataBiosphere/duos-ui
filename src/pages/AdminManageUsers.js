import { Component, Fragment } from 'react';
import { div, button, hr, a, span, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { AddUserModal } from '../components/modals/AddUserModal';
import { User } from "../libs/ajax";
import { PaginatorBar } from '../components/PaginatorBar';
import ReactTooltip from 'react-tooltip';
import { SearchBox } from '../components/SearchBox';
import { LoadingIndicator } from '../components/LoadingIndicator';

class AdminManageUsers extends Component {

  limit = 5;

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      searchText: '',
      userList: [],
      showAddUserModal: false,
      limit: this.limit,
      currentPage: null,
    };
  }

  componentDidMount() {
    this.getUsers();
  }

  async getUsers() {
    User.list().then(users => {

      let userList = users.map(user => {
        user.researcher = false;
        user.roles.forEach(role => {
          if (role.name === 'Researcher') {
            user.status = role.status;
            user.completed = role.profileCompleted;
            user.researcher = true;
          }
        });
        user.key = user.id;
        return user;
      });

      this.setState(prev => {
        prev.loading = false;
        prev.currentPage = 1;
        prev.userList = userList;
        return prev;
      });
    });
  }

  search = (e) => {
    let query = e.target.value;
    this.setState(prev => {
      prev.currentPage = 1;
      prev.searchUsers = query;
      return prev;
    });

  }

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

  addUser = (e) => {
    this.setState(prev => {
      prev.user = null;
      prev.showAddUserModal = true;
      return prev;
    });
  };

  editUser = (user) => (e) => {
    this.setState(prev => {
      prev.user = user;
      prev.showAddUserModal = true;
      return prev;
    });
  };

  openResearcherReview = (userId) => {
    this.props.history.push(`researcher_review/${userId}`);
  }
  okModal = (name) => {
    this.setState(prev => { prev.showAddUserModal = false; return prev; });
  }

  closeModal = (name) => {
    this.setState(prev => { prev.showAddUserModal = false; return prev; });
  }

  afterModalOpen = (name) => {
    this.setState(prev => { prev.showAddUserModal = false; return prev; });
  };

  handleSearchUser = (query) => {
    this.setState({ searchUserText: query });
  }

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.includes(query);
    }
    return true;
  }

  render() {

    if (this.state.loading) { return LoadingIndicator(); }

    const { currentPage, searchUserText } = this.state;
    
    return (
      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "manageUsers", imgSrc: "/images/icon_manage_users.png", iconSize: "medium", color: "common", title: "Manage Users", description: "Select and manage users and their roles" }),
          ]),
          div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-wrapper no-padding" }, [
            div({ className: "col-lg-7 col-md-7 col-sm-7 col-xs-7" }, [
              SearchBox({ id: 'manageUsers', searchHandler: this.handleSearchUser, color: 'common' })
            ]),

            a({
              id: 'btn_addUser',
              className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 admin-add-button common-background no-margin",
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
              user: this.state.user
            }),

          ])
        ]),
        div({ className: "jumbotron table-box" }, [
          div({ className: "row no-margin" }, [
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header common-color" }, ["User Name"]),
            div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 cell-header common-color" }, ["Google account id"]),
            div({ className: "col-lg-4 col-md-4 col-sm-3 col-xs-3 cell-header common-color" }, ["User Roles"]),
            div({ className: "col-lg-1 col-md-1 col-sm-2 col-xs-2 cell-header common-color f-center" }, ["Edit User"]),
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header common-color f-center" }, ["Researcher Review"]),
          ]),

          hr({ className: "table-head-separator" }),

          this.state.userList.filter(this.searchTable(searchUserText)).slice((currentPage - 1) * this.state.limit, currentPage * this.state.limit).map((user, index) => {
            return h(Fragment, { key: user.dacUserId }, [
              div({ id: user.dacUserId, className: "row no-margin tableRow" }, [
                div({ id: user.dacUserId + "_name", name: "userName", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [user.displayName]),
                div({ id: user.dacUserId + "_email", name: "userEmail", className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 cell-body text" }, [user.email]),
                div({ id: user.dacUserId + "_roles", name: "userRoles", className: "col-lg-4 col-md-4 col-sm-3 col-xs-3 cell-body text bold" }, [
                  user.roles.map((role, eIndex) =>
                    span({ key: user.dacUserId + "_roles_" + eIndex, id: user.dacUserId + "_roles_" + eIndex, className: "admin-users-list" }, [
                      span({ className: "enabled default-color", isRendered: role.name === 'Admin' }, ["Admin"]),
                      span({ className: "enabled default-color", isRendered: role.name === 'Member' }, ["Member"]),
                      span({ className: "enabled default-color", isRendered: role.name === 'Chairperson' }, ["Chairperson"]),
                      span({ className: "enabled default-color", isRendered: role.name === 'Alumni' }, ["Alumni"]),
                      span({ className: "enabled default-color", isRendered: role.name === 'Researcher' }, ["Researcher"]),
                      span({ className: "enabled default-color", isRendered: role.name === 'DataOwner' }, ["Data Owner"]),
                    ])
                  )
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
                    a({ id: user.dacUserId + "_btnResearcherReview", name: "btn_researcherReview", onClick: () => this.openResearcherReview(user.dacUserId), isRendered: user.researcher !== false && user.completed, className: "admin-manage-buttons col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                      div({
                        className:
                          ((user.researcher && user.completed && user.status === 'pending') || user.status === null) ? 'enabled'
                            : user.researcher && user.completed && user.status !== 'pending' ? 'editable'
                              : user.researcher === false || !user.completed ? 'disabled' : ''
                      }, ["Review"]),
                    ]),
                    a({ isRendered: user.researcher === false || !user.completed, className: "admin-manage-buttons col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                      div({ className: "disabled" }, ["Review"]),
                    ]),

                    div({ id: user.dacUserId + "_flagBonafide", name: "flag_bonafide", className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 bonafide-icon" }, [
                      span({ className: "glyphicon glyphicon-thumbs-up dataset-color", isRendered: user.status === 'approved' && user.completed, "data-tip": "", "data-for": "tip_bonafide" }),
                      h(ReactTooltip, { id: "tip_bonafide", place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Bonafide researcher"]),

                      span({ className: "glyphicon glyphicon-thumbs-down cancel-color", isRendered: user.status === 'rejected' && user.completed, "data-tip": "", "data-for": "tip_nonBonafide" }),
                      h(ReactTooltip, { id: "tip_nonBonafide", place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Non-Bonafide researcher"]),

                      span({ className: "glyphicon glyphicon-hand-right hover-color", isRendered: user.status === 'pending' && user.completed, "data-tip": "", "data-for": "tip_pendingReview" }),
                      h(ReactTooltip, { id: "tip_pendingReview", place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Researcher review pending"]),

                      span({ className: "glyphicon glyphicon-hand-right dismiss-color", isRendered: !(user.completed) || (user.researcher === false), disabled: "disabled" }, []),
                    ]),

                  ]),

                ]),

              ]),
              hr({ className: "table-body-separator" })
            ])
          }),
          PaginatorBar({
            total: this.state.userList.filter(this.searchTable(searchUserText)).length,
            limit: this.state.limit,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          })
        ])
      ])
    );
  }
}

export default AdminManageUsers;