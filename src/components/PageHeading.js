import { Component } from 'react';
import { div, hh, img, h2, span } from 'react-hyperscript-helpers';
import './PageHeading.css';

export const PageHeading = hh(class PageHeading extends Component {

  render() {

    return div({ id: this.props.id + "_heading", className: "page-heading"}, [
      img({
        id: this.props.id + "_icon",
        isRendered: this.props.imgSrc !== undefined,
        src: this.props.imgSrc,
        alt: this.props.title,
        className: "page-heading-icon"
      }),
      div({ className: "page-heading-text " + this.props.iconSize}, [
        h2({ id: this.props.id + "_title", className: "page-heading-title  " + this.props.color + "-color", style: this.props.titleStyle }, [this.props.title]),
        span({ id: this.props.id + "_description", className: "page-heading-description", style: this.props.descriptionStyle }, [this.props.description]),
      ]),

    ]);

  }

});
