import { Component } from 'react';
import { div, hh, img, h2, span } from 'react-hyperscript-helpers';
import './PageHeading.css';

export const PageHeading = hh(class PageHeading extends Component {

  render() {

    return div({className: "page-heading"}, [
      img({
        isRendered: this.props.imgSrc !== undefined,
        src: this.props.imgSrc,
        alt: this.props.title,
        className: "page-heading-icon"
      }),
      div({className: "page-heading-text " + this.props.iconSize}, [
        h2({className: "page-heading-title  " + this.props.color + "-color"}, [this.props.title]),
        span({className: "page-heading-description"}, [this.props.description]),
      ]),

    ])

  }

});
