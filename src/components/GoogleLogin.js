import { Component } from 'react';
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogin from 'react-google-login';
import GoogleLogout from 'react-google-login';

export const GoogleLoginButton = hh(class GoogleLoginButton extends Component {
    constructor(props) {
        super(props);
        this.state = props.loginState;
    }

    responseGoogle = (response) => {
        console.log(response);
        console.log("PROPS DE GOOGLE LOGIN ", this.props);
        this.state(true);
    };

    forbidden = (response) => {
        console.log(response);
    };

    logout = () => {
        console.log('logout');
    };

    render() {
        let loginButton = h(GoogleLogin, {
            className: "navbar-duos-button",
            clientId: "<change me>",
            buttonText: "Sign In",
            onSuccess: this.responseGoogle,
            onFailure: this.forbidden,
        });

        return (loginButton);
    }
})