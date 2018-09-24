import { Component } from 'react';
import { div, hh, h4, span } from 'react-hyperscript-helpers';
import './LoadingIndicator.css';

export const LoadingIndicator = hh(class LoadingIndicator extends Component {

  render() {

    return div({
      id: this.props.id + "_alert",
      className: "alert-wrapper info"
    }, [
        h4({
          // id: this.props.id + "_title",
          className: "alert-title",
          // isRendered: this.props.title !== undefined
        }, ["Loading Data ....."]),
        span({
          id: this.props.id + "_description",
          className: "alert-description",
          // isRendered: this.props.description !== undefined
        }, ["Please wait until data loading finishes ..."]),
      ])
  }

});
