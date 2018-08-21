import React from 'react';
import DuosHeader from './components/DuosHeader';
import {div, h} from 'react-hyperscript-helpers';
import './App.css';
import Routes from "./Routes"


class App extends React.Component {

    constructor(props) {
        super(props);
        console.log('------------------- App Constructor -----------------------------');
        console.log(this.state);

        this.state = {
            isLogged: false
        };

        this.loginState = this.loginState.bind(this);

    }

    loginState(isLogged) {
        this.setState({isLogged: isLogged}, function () {
            sessionStorage.setItem('isLogged', isLogged);
            console.log('-------------- loggedIn ------------------', this.state);
        });
    }

    render() {
         return (
            div({}, [
                h(DuosHeader, {isLogged: this.state.isLogged, loginState: this.loginState}),
                h(Routes, {isLogged: sessionStorage.getItem('isLogged') === 'true', loginState: this.loginState})
            ])
        );
    }

}

export default App;
