import { Component } from 'react';
import { div, hh, img, h2, span } from 'react-hyperscript-helpers'

export const PageHeading = hh(class PageHeading extends Component {

  render() {

    const HEADING = {
      width: '100%',
      margin: '20px 0 10px 0',
      position: 'relative'
    };

    const ICON = {
      position: 'absolute',
      top: '0',
      left: '0',
      height: '50px'
    };

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

    const MEDIUM = {
      marginLeft: '55px'
    };

    const LARGE = {
      marginLeft: '70px'
    }

    const NONE = {
      marginLeft: '0'
    };


    return div({ id: this.props.id + "_heading", style: HEADING}, [
      img({
        id: this.props.id + "_icon",
        isRendered: this.props.imgSrc !== undefined,
        src: this.props.imgSrc,
        alt: this.props.title,
        style: ICON
      }),
      div(this.props.iconSize === 'none' ?
        { style: NONE }
        : this.props.iconSize === 'large' ?
          { style: LARGE }
          : { style: MEDIUM }, [
        h2({ id: this.props.id + "_title", className: this.props.color + "-color", style: TITLE}, [this.props.title]),
        span({ id: this.props.id + "_description", style: DESCRIPTION }, [this.props.description]),
      ]),

    ]);

  }

});
