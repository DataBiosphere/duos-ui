import { Component } from 'react';
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogin from 'react-google-login';
import { User } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { USER_ROLES } from '../libs/utils';
import { withRouter } from 'react-router-dom';

const LoginButton = hh(class GoogleLoginButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      googleButton: null,
      toDashBoard: false
    };
    this.login = props.loginState;
    this.getUser = this.getUser.bind(this);
  }

  responseGoogle = async (response) => {
    Storage.setGoogleData(response);
    await this.getUser().then(
      user => {

        const currentUserRoles = user.roles.map(roles => roles.name);
        user.isChairPerson = currentUserRoles.indexOf(USER_ROLES.chairperson) > -1;
        user.isMember = currentUserRoles.indexOf(USER_ROLES.member) > -1;
        user.isAdmin = currentUserRoles.indexOf(USER_ROLES.admin) > -1;
        user.isResearcher = currentUserRoles.indexOf(USER_ROLES.researcher) > -1;
        user.isDataOwner = currentUserRoles.indexOf(USER_ROLES.dataOwner) > -1;
        user.isAlumni = currentUserRoles.indexOf(USER_ROLES.alumni) > -1;

        Storage.setCurrentUser(user);
        this.login(true);
        this.props.history.push(this.redirect(user));
      },
      error => {
        Storage.clearStorage();
      });
  };

  forbidden = (response) => {
    Storage.clearStorage();
  };

  logout = () => {
    console.log('logout');
  };

  async getGoogleConfig() {
    const googleButton = h(GoogleLogin, {
      className: "btn navbar-duos-button",
      clientId: "469451274261-mhatdmqbta3boko0nc9s0ltnhe7q8hc7.apps.googleusercontent.com",
      buttonText: "Sign In",
      onSuccess: this.responseGoogle,
      onFailure: this.forbidden,
    });
    console.log("Boton Google login GetGoogleConfig() ", googleButton);
    this.setState( prev => {
      prev.googleButton = googleButton;
      return prev;})
  }

  async getUser() {
    return await User.getByEmail(Storage.getGoogleData().profileObj.email);
  }

  componentWillMount() {
    this.getGoogleConfig();
  }

  render() {
    console.log("RENDERIZA BOTON en googleLogin", this.state.googleButton );

    return (this.state.googleButton);
  }

  // returns the initial page to be redirected when a user logs in
  redirect = (user) => {
    let page = '/';
    if (Storage.userIsLogged()) {
      page = user.isChairPerson ? 'chair_console' :
        user.isMember ? 'member_console' :
          user.isAdmin ? 'admin_console' :
            user.isResearcher ? 'dataset_catalog' :
              user.isDataOwner ? 'data_owner_console' :
                user.isAlumni ? 'summary_votes' : '/';
    }
    return page
  };

});

export const GoogleLoginButton = withRouter(LoginButton);

