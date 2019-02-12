import { Component } from 'react';
import { div, hr, h1, h3, span, p, img } from 'react-hyperscript-helpers';

class HomeHelp extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
  }

  render() {

    return (

      div({ className: "row home" }, [
        div({ className: "col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          h1({ className: "home-title" }, ["Data Use Oversight System"]),
          div({ className: "home-title-description" }, ["A semi-automated management service for compliant secondary use of human genomics data"]),
          hr({ className: "home-line" }),
          div({ className: "home-sections home-sections-table" }, [
            img({ src: "/images/home_icon_help.svg", className: "home-sections-icon", alt: "Help icon" }),
            div({ className: "home-sections-title" }, [
              h3({}, ["Help"]),
              p({ className: "home-sections-description" }, ["Admin contact information"]),
              div({ className: "home-content" }, [
                p({}, [
                  "Need help? Please contact: ",
                  span({ className: "bold" }, ["DUOS@broadinstitute.org"])
                ])
              ])
            ])
          ])
        ])
      ])
    );
  }

  showData(data) {
  }
}

export default HomeHelp;
