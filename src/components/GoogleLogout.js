import { Component } from 'react';
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogout from 'react-google-login';

export const GoogleLogoutButton = hh(class GoogleLogoutButton extends Component {
    constructor(props) {
        super(props);
        this.state = props.loginState;

    }

    responseGoogle = (response) => {
        console.log(response);
    };

    logout = () => {
        console.log('logout');
        this.state(false);
    };

    render() {
        let logoutButton = h(GoogleLogout, {
            buttonText: "Sign Out",
            onSuccess: this.logout,
        });

        return (logoutButton);
    }
});