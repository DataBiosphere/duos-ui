import {Component} from 'react';
import {h, hh} from 'react-hyperscript-helpers';
import GoogleLogin from 'react-google-login';
import {User, Token} from "../libs/ajax";

export const GoogleLoginButton = hh(class GoogleLoginButton extends Component {
    constructor(props) {
        super(props);
        this.state = {googleButton: null};
        this.login = props.loginState;
        this.getUser = this.getUser.bind(this);

    }

    responseGoogle = (response) => {
        console.log(response);
        Token.setToken(response.accessToken);
        sessionStorage.setItem("GAPI", JSON.stringify(response));
        this.getUser().then((data) => {
            sessionStorage.setItem("CurrentUser", JSON.stringify(data));
            console.log("USER = ", data);
            // window.location.href = "/";
        },
            (data) => {
                sessionStorage.clear();
                console.log("Error: ", data)
            });
        this.login(true);
    };

    forbidden = (response) => {
        sessionStorage.clear();
        console.log(response);
    };

    logout = () => {
        console.log('logout');
    };

    async getGoogleConfig() {
        const googleButton = h(GoogleLogin, {
            className: "navbar-duos-button",
            clientId: "complete-clientId",
            buttonText: "Sign In",
            onSuccess: this.responseGoogle,
            onFailure: this.forbidden,
        });
        this.setState({googleButton: googleButton})
    }

    async getUser(){
        return await User.getByEmail(JSON.parse(sessionStorage.getItem("GAPI")).profileObj.email);
        // console.log (user)
    }

    componentWillMount() {
        this.getGoogleConfig();
    }

    render() {
        return (this.state.googleButton);
    }
});