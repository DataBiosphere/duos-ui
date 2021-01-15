import { Component } from 'react';
import { div, hh, img, h2, span } from 'react-hyperscript-helpers';
import './PageSubHeading.css';

export const PageSubHeading = hh(class PageSubHeading extends Component {

  render() {

    const DESCRIPTION = {
      color: '#000000',
      fontSize: '16px',
      fontWeight: '400'
    };

    const TITLE = {
      margin: '10px 0 5px 0',
      lineBreak: 'auto',
      padding: '5px 10px 0 0',
      fontSize: '22px',
      fontWeight: '500',
    };

    return div({ className: "page-sub-heading" }, [
      img({
        id: this.props.id + "_icon",
        isRendered: this.props.imgSrc !== undefined,
        src: this.props.imgSrc,
        alt: this.props.title,
        className: "page-sub-heading-icon"
       }),
      div({ className: "page-sub-heading-text " + this.props.iconSize }, [
        h2({ id: this.props.id + "_title", className: this.props.color + "-color", style: TITLE }, [this.props.title]),
        span({ id: this.props.id + "_description", style: DESCRIPTION }, [this.props.description]),
      ])
    ]);
  }

});
