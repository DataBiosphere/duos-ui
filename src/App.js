import React from 'react';
import Modal from 'react-modal';
import DuosHeader from './components/DuosHeader';
import DuosFooter from './components/DuosFooter';
import { div, h } from 'react-hyperscript-helpers';
import './App.css';
import Routes from "./Routes"

import { SpinnerComponent as Spinner } from './components/SpinnerComponent';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
  }

  showSpinner = () => {
    this.setState({
      loading: true
    });
  }

  hideSpinner = () => {
    this.setState({
      loading: false
    });
  }

  componentWillMount() {
    Modal.setAppElement(document.getElementById('modal-root'));
  }

  render() {

    const { loading } = this.state;

    return (
      div({ className: "body" }, [
        div({ className: "wrap" }, [
          div({ className: "main" }, [
            h(DuosHeader, {
            }),
            h(Spinner, {
              name: "mainSpinner", group: "duos", loadingImage: "/images/loading-indicator.svg"
            }),
            h(Routes, {
              isRendered: !loading
            }),
          ])
        ]),
        h(DuosFooter, {})
      ])

    );
  }
}

export default App;
