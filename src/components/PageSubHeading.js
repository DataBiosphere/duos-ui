import { Component } from 'react';
import { div, hh, img, h2, span } from 'react-hyperscript-helpers';
import './PageSubHeading.css';

export const PageSubHeading = hh(class PageSubHeading extends Component {

  render() {

    return div({ className: "page-sub-heading" }, [
      img({ 
        id: this.props.id + "_icon",
        isRendered: this.props.imgSrc !== undefined,
        src: this.props.imgSrc,
        alt: this.props.title,
        className: "page-sub-heading-icon"
       }),
      div({ className: "page-sub-heading-text " + this.props.iconSize }, [
        h2({ id: this.props.id + "_title", className: "page-sub-heading-title " + this.props.color + "-color" }, [this.props.title]),
        span({ id: this.props.id + "_description", className: "page-sub-heading-description" }, [this.props.description]),
      ])
    ])
  }

});
