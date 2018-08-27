import { Component } from 'react';
import { div, a } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class NotFound extends Component {

  render() {

<<<<<<< HEAD
        return (
            div({ className: "container" }, [
                div({ className: "row no-margin" }, [
                    div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                        PageHeading({ color: "common", title: "Sorry, the page you were looking for was not found." }),
                    ]),
                    a({ className: "btn btn-primary vote-button f-left", style: {marginTop: '15px'}, href: "/home" }, ["Back to Home"]),
                ]),
=======
    return (
      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ color: "common", title: "Sorry, the page you were looking for was not found." }),
          ]),
          a({ className: "btn btn-primary vote-button f-left", style: { marginTop: '15px' }, href: "/home" }, ["Back to Home"]),
        ]),
>>>>>>> more-modal-fixes

      ])
    );
  }
}

export default NotFound;

