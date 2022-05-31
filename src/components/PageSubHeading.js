import {Component} from 'react';
import {div, hh, img, h2, span} from 'react-hyperscript-helpers';

export const PageSubHeading = hh(class PageSubHeading extends Component {

  margins(iconSize) {

    const MEDIUM = {
      marginLeft: '45px'
    };

    const LARGE = {
      marginLeft: '55px'
    };

    const NONE = {
      marginLeft: '0'
    };

    if (iconSize === 'none') {
      return NONE;
    }
    if (iconSize === 'large') {
      return LARGE;
    } else {
      return MEDIUM;
    }
  }

  render() {

    const HEADING = {
      width: '100%',
      margin: '20px 0 10px 0',
      position: 'relative'
    };

    const DESCRIPTION = {
      color: '#000000',
      fontSize: '16px',
      fontWeight: '400'
    };

    const ICON = {
      position: 'absolute',
      top: '0',
      left: '0',
      height: '40px'
    };

    const TITLE = {
      margin: '10px 0 5px 0',
      lineBreak: 'auto',
      padding: '5px 10px 0 0',
      fontSize: '22px',
      fontWeight: '500',
    };

    const MARGINS = this.margins(this.props.iconSize);

    return div({style: HEADING}, [
      img({
        id: this.props.id + '_icon',
        isRendered: this.props.imgSrc !== undefined,
        src: this.props.imgSrc,
        alt: this.props.title,
        style: ICON
      }),
      div({style: MARGINS}, [
        h2({
          id: this.props.id + '_title',
          className: this.props.color + '-color',
          style: TITLE
        }, [this.props.title]),
        span({id: this.props.id + '_description', style: DESCRIPTION}, [this.props.description]),
      ])
    ]);
  }

})
;
