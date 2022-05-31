import { Component } from 'react';
import { div, hh, h4, span } from 'react-hyperscript-helpers';
import './Alert.css';

export const Alert = hh(class Alert extends Component {

  render() {

    return div({
      id: this.props.id + '_alert',
      className: 'alert-wrapper ' + (this.props.type)
    }, [
      h4({
        id: this.props.id + '_title',
        className: 'alert-title',
        isRendered: this.props.title !== undefined
      }, [this.props.title]),
      span({
        id: this.props.id + '_description',
        className: 'alert-description',
        isRendered: this.props.description !== undefined
      }, [this.props.description]),
    ]);
  }

});
