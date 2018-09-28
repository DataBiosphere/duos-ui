import { Component } from 'react';
import { div, a, img, span, h3, h } from 'react-hyperscript-helpers';
import { GoogleLoginButton } from '../components/GoogleLogin';

class Login extends Component {

  constructor(props) {
    super(props);
    console.log("props de login ", props);

    this.state = {
      googleButton: props.button,
      value: '',
      isLogged: props.isLogged,
    };

    this.myHandler = this.myHandler.bind(this);
    this.signIn = this.signIn.bind(this);

  }

  myHandler(event) {
    // TBD
  }

  signIn() {
    this.setState({ isLogged: true }, function () {
      this.props.loginState(this.state.isLogged);
    });
  }

  render() {

    return (
      div({ className: "container" }, [
        div({ className: "landing-box col-lg-6 col-lg-offset-3 col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-10 col-xs-offset-1" }, [
          div({ className: "landing-box-brand" }, [img({ src: "/images/broad_logo.png", alt: "Broad Institute Logo" }, []),
          div({ className: "landing-box-title" }, [h3({}, ["Broad Data Use Oversight System"]),]),
          div({ className: "landing-box-google-signin" }, [
            div({ className: "new-sign" }, ["Sign in with a google account"]),
            div({
              className: "custom-g-signin2 g-signin2", "data-theme": "dark", "data-width": "220", "data-height": "40",
              "data-longtitle": "true", "data-onsuccess": "onSignIn", "data-scope": "profile email"
            }, [a({ id: "link_signIn", onClick: this.signIn }, [
              // this.state.googleButton
              // h(GoogleLoginButton, {}),

            ])]),
            div({ className: "new-sign" }, [span({}, [
              "Don't have a Google Account? Create one",
              a({ href: "https://accounts.google.com/SignUp?continue:https%3A%2F%2Faccounts.google.com%2Fo%2Foauth2%2Fauth%3Fopenid.realm%26scope%3Demail%2Bprofile%2Bopenid%26response_type%3Dpermission%26redirect_uri%3Dstoragerelay%3A%2F%2Fhttp%2Flocalhost%3A8000%3Fid%253Dauth721210%26ss_domain%3Dhttp%3A%2F%2Flocalhost%3A8000%26client_id%3D832251491634-smgc3b2pogqer1mmdrd3hrqic3leof3p.apps.googleusercontent.com%26fetch_basic_profile%3Dtrue%26hl%3Des-419%26from_login%3D1%26as%3D43c5de35a7316d00&ltmpl:popup", target: "_blank" }, ["here."]),]),]),
          ]),
          ]),
        ]),
      ])
    );
  }
}

export default Login;

