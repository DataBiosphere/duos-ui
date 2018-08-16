import { Component } from 'react';
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogout from 'react-google-login';

export const GoogleLogoutButton = hh(class GoogleLogoutButton extends Component {
    constructor(props) {
        super(props);

    }

    responseGoogle = (response) => {
        console.log(response);
    }

    logout = () => {
        console.log('logout');
    }

    render() {
        let logoutButton = h(GoogleLogout, {
            buttonText: "Sign Out",
            onSuccess: this.logout,
        });

        return (logoutButton);
    }
})