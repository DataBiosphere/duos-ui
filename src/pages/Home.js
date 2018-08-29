import { Component } from 'react';
import { div, h1, h3, hr, span, svg, circle, img, p } from 'react-hyperscript-helpers';

class Home extends Component {

  render() {

    return (

      div({ className: "row home" }, [
        div({ className: "col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          h1({ className: "home-title" }, ["Data Use Oversight System"]),
          div({ className: "home-title-description" }, ["A semi-automated management service for compliant secondary use of human genomics data"]),
          hr({ className: "home-line" }),
          div({ className: "home-content" }, [
            p({}, [
              "There are restrictions on researching human genomics data. For example: ",
              span({ className: "italic" }, ["“Data can only be used for breast cancer research with non-commercial purpose”."]),
            ]),
            p({}, ["The Data Use Oversight system ensures that researchers using genomics data honor these restrictions."]),
          ]),
          h3({}, ["What is DUOS?"]),
          div({ className: "home-content-references" }, [
            svg({ height: "14", width: "14" }, [
              circle({ cx: "7", cy: "7", r: "7", fill: "#016798" }, [])
            ]),
            span({}, ["Interfaces to transform data use restrictions to machine readable codes"]),
          ]),
          div({ className: "home-content-references" }, [
            svg({ height: "14", width: "14" }, [
              circle({ cx: "7", cy: "7", r: "7", fill: "#B22439" }, []),
            ]),
            span({}, ["A matching algorithm that checks if a data access request is compatible with the restrictions on the data"]),
          ]),
          div({ className: "home-content-references" }, [
            svg({ height: "14", width: "14" }, [
              circle({ cx: "7", cy: "7", r: "7", fill: "#3F8C51" }, []),
            ]),
            span({}, ["Interfaces for the data access committee (DAC) to evaluate data access requests requiring manual review"]),
          ]),
          img({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 home-content-graphic", alt: "What is DUOS graphic", src: "/images/what_is_duos.svg" }),
        ])
      ])
    );
  }
}

export default Home;
