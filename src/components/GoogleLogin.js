import { Component } from 'react';
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogin from 'react-google-login';
import GoogleLogout from 'react-google-login';

export const GoogleLoginButton = hh(class GoogleLoginButton extends Component {
    constructor(props) {
        super(props);
        this.state = {googleButton:null};
        // this.getgoogleConfig();
        this.loggin = props.loginState;
        // this.getgoogleConfig = this.getgoogleConfig.bind(this);
    }

    responseGoogle = (response) => {
        console.log(response);
        console.log("PROPS DE GOOGLE LOGIN ", this.props);
        this.loggin(true);
    };

    forbidden = (response) => {
        console.log(response);
    };

    logout = () => {
        console.log('logout');
    };

    async getgoogleConfig(){
        const googleButton = h(GoogleLogin, {
            className: "navbar-duos-button",
            clientId: "469451274261-mhatdmqbta3boko0nc9s0ltnhe7q8hc7.apps.googleusercontent.com",
            buttonText: "Sign In",
            onSuccess: this.responseGoogle,
            onFailure: this.forbidden,
        });
        this.setState({googleButton: googleButton})
    }
    componentWillMount() {
        this.getgoogleConfig();
    }

        render() {
            return(this.state.googleButton);

    }
});