import React from 'react';
import DuosHeader from './components/DuosHeader';
import {div, h} from 'react-hyperscript-helpers';
import './App.css';
import Routes from "./Routes"
import { GoogleLoginButton } from './components/GoogleLogin';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isLogged: false
        };
        this.loginState = this.loginState.bind(this);
    }

    loginState(isLogged) {
        this.setState({isLogged: isLogged}, function () {
            if (isLogged) {
                sessionStorage.setItem('isLogged', isLogged);
            } else {
                sessionStorage.clear();
            }
        });
    }

    render() {
         return (
            div({}, [
                h(DuosHeader, {isLogged: this.state.isLogged, loginState: this.loginState, button: GoogleLoginButton({isLogged:sessionStorage.getItem('isLogged') === 'true', loginState:this.loginState})}),
                h(Routes, {isLogged: sessionStorage.getItem('isLogged') === 'true', loginState: this.loginState})
            ])
        );
    }

}

export default App;
