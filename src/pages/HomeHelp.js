import { Component } from 'react';
import { div, hr, h1, h2, span, p, img, h, svg, circle, a } from 'react-hyperscript-helpers';
import Mailto from 'react-protected-mailto';

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
              h2({style: {fontWeight: '750'}}, ["Need help?"]),

              div({ className: "home-content" }, [
                p({}, [
                  "Have a question about...",
                ])
              ]),

              div({ className: 'home-content-references' }, [
                svg({ height: '14', width: '14' }, [
                  circle({ cx: '7', cy: '7', r: '7', fill: '#016798' }, [])
                ]),
                span({}, ['How to submit a data access request?']),
              ]),

              div({ className: 'home-content-references' }, [
                svg({ height: '14', width: '14' }, [
                  circle({ cx: '7', cy: '7', r: '7', fill: '#e34420' }, [])
                ]),
                span({}, ['When will you receive a response on your request from the data access committee?'])
              ]),

              div({ className: 'home-content-references' }, [
                svg({ height: '14', width: '14' }, [
                  circle({ cx: '7', cy: '7', r: '7', fill: '#52098f' }, [])
                ]),
                span({}, ['What is a Library Card and how do I get one?'])
              ]),

              div({ className: "home-content" }, [
                p({}, [
                  "These questions and more are answered on our ",
                  span({ classname: "bold" }, [a( { href: '/FAQs', target: '_blank' }, 'FAQ page')])
                ])
              ]),

              div({ className: "home-content" }, [
                p({}, [
                  "If you need assistance accessing data in Terra for which you were already approved in DUOS, please contact: ",
                  span( [h(Mailto, { email: 'terra-support@broadinstitute.zendesk.com' })])
                ])
              ]),

              div({ className: "home-content" }, [
                p({}, [
                  "If you still have questions after reviewing out FAQ page, please contact us at: ",
                  span( [h(Mailto, { email: 'duos-support@broadinstitute.zendesk.com' })])
                ])
              ])
            ])
          ])
        ])
      ])
    );
  }

}

export default HomeHelp;
