import { Component } from 'react';
import { div, hh, img, h2, span } from 'react-hyperscript-helpers';
import './PageHeading.css';

export const PageHeading = hh(class PageHeading extends Component {

  render() {

    const DESCRIPTION = {
      color: '#000000',
      height: '25px',
      fontWeight: '400',
      fontSize: '19px'
    };

    const TITLE = {
      margin: '7px 0 5px 0',
      lineBreak: 'auto'
    };

    return div({ id: this.props.id + "_heading", className: "page-heading"}, [
      img({
        id: this.props.id + "_icon",
        isRendered: this.props.imgSrc !== undefined,
        src: this.props.imgSrc,
        alt: this.props.title,
        className: "page-heading-icon"
      }),
      div({ className: "page-heading-text " + this.props.iconSize}, [
        h2({ id: this.props.id + "_title", className: this.props.color + "-color", style: TITLE}, [this.props.title]),
        span({ id: this.props.id + "_description", style: DESCRIPTION }, [this.props.description]),
      ]),

    ]);

  }

});
