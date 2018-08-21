import {Component} from 'react';
import {h, hh} from 'react-hyperscript-helpers';
import GoogleLogin from 'react-google-login';

export const GoogleLoginButton = hh(class GoogleLoginButton extends Component {
    constructor(props) {
        super(props);
        this.state = {googleButton: null};
        this.login = props.loginState;
    }

    responseGoogle = (response) => {
        console.log(response);
        console.log("GOOGLE PROPS ", this.props);
        this.login(true);
    };

    forbidden = (response) => {
        console.log(response);
    };

    logout = () => {
        console.log('logout');
    };

    async getGoogleConfig() {
        const googleButton = h(GoogleLogin, {
            className: "navbar-duos-button",
            // clientId: <complete-clientId>,
            clientId: "469451274261-mhatdmqbta3boko0nc9s0ltnhe7q8hc7.apps.googleusercontent.com",

            buttonText: "Sign In",
            onSuccess: this.responseGoogle,
            onFailure: this.forbidden,
        });
        this.setState({googleButton: googleButton})
    }

    componentWillMount() {
        this.getGoogleConfig();
    }

    render() {
        return (this.state.googleButton);
    }
});