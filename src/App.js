import React from 'react';
import Modal from 'react-modal';
import DuosHeader from './components/DuosHeader';
import DuosFooter from './components/DuosFooter';
import { div, h } from 'react-hyperscript-helpers';
import './App.css';
import Routes from "./Routes"
import { Storage } from './libs/storage';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLogged: false
    };
  }

  componentDidMount() {
    Modal.setAppElement(document.getElementById('modal-root'));
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    console.log('App.js : ', nextProps, prevState);
    const alreadyLogged = Storage.userIsLogged();
    if (prevState.isLogged !== alreadyLogged) {
      return {
        isLogged: alreadyLogged
      }
    }
    return null;
  }

  // shouldComponentUpdate(nextProps, nextState, nextContext) {
  //   console.log('nextProps', nextProps);
  //   console.log('nextState', nextState);
  //   console.log('nextContext', nextContext);
  //   return true;
  // }

  render() {

    const { isLogged } = this.state;

    return (
      div({ className: "body"}, [
        div({ className: "wrap" }, [
          div({ className: "main" }, [
            h(DuosHeader, {
              isLogged: isLogged
            }),
            h(Routes, {
              isLogged: isLogged
            }),
          ])
        ]),
        h(DuosFooter, {})
      ])
    );
  }
}

export default App;
