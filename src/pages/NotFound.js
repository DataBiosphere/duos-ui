import { Component } from 'react';
import { div, a } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class NotFound extends Component {

  render() {

    return (
      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "notFound", color: "common", title: "Sorry, the page you were looking for was not found." }),
          ]),
          a({ id: "btn_back", className: "btn vote-button vote-button-back vote-button-bigger f-left", style: { 'marginTop': '15px' }, href: "/home" }, ["Back to Home"]),
        ])
      ])
    );
  }
}

export default NotFound;

