import { Component } from 'react';
import { div, h1, form, label, input, hr } from 'react-hyperscript-helpers';

class HomeRegister extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    }
    this.myHandler = this.myHandler.bind(this);
  }

  myHandler(event) {
    // TBD
  }

  render() {
    return (
      div({ className: "row home" }, [
        div({ className: "col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          h1({ className: "home-title" }, ["Join DUOS"]),
          div({ className: "home-title-description" }, ["Sign up to DUOS to find genomic datasets of interest and to submit Data Access Requests."]),
          hr({ className: "home-line" }),
          div({ className: "row" }, [
            div({ className: "col-lg-6 col-md-8 col-sm-12 col-xs-12" }, [
              label({ className: "home-control-label col-lg-12 col-md-12 col-sm-12 col-xs-12" }, ["Full Name"]),
              input({ className: "form-control col-lg-12 col-md-12 col-sm-12 col-xs-12", type: "text", "ng-model": "form.name" }),
            ]),
            div({ className: "col-lg-6 col-md-8 col-sm-12 col-xs-12" }, [
              div({ className: "pos-relative" }, [
                div({ className: "custom-g-signin2 g-signin2 signInRegister", "data-onsuccess": "onSignIn", "data-theme": "dark"  }),
                div({ isRendered: !form.name, className: "signInDisabledButton" })
              ]),
            ]),
          ])
        ])
      ])
    );
  }
}

export default HomeRegister;

