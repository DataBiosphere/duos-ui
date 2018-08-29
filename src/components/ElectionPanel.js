import { Component } from 'react';
import { div, hh, h4, span, button } from 'react-hyperscript-helpers';

export const ElectionPanel = hh(class ElectionPanel extends Component {

  render() {

    return div({ id: this.props.id, className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
      div({ className: "panel-heading cm-boxhead " + this.props.color + "-color" }, [
        h4({ id: "title_" + this.props.id }, [this.props.title]),
      ]),
      div({ className: "panel-body cm-boxbody" }, [
        button({
          isRendered: this.props.action !== "",
          id: "btn_" + this.props.id, 
          className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color no-margin",
          onClick: this.props.action.handler
         }, [this.props.action.label]),

         span({
          isRendered: this.props.content !== undefined,
          className: this.props.class
         }, [this.props.content])

      ]),
    ])
  }

});
