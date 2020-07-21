import { Component } from 'react';
import { button, div, h, span, hh } from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import { PageSubHeading } from './PageSubHeading';


Modal.setAppElement('#root');

export const SupportRequestBaseModal = hh(class SupportRequestBaseModal extends Component {
  constructor(props) {
    super(props);
    this.customStyles = {
      overlay: {
        position: 'fixed',
        top: this.props.top,
        left: '10',
        right: '0',
        bottom: '0',
        backgroundColor: 'static',
        width: '400px',
        height: this.props.height,
        padding: '0px 450px 700px 0px',
      },

      content: {
        position: 'relative',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '400px',
        height: this.props.height,
        background: 'rgb(255, 255, 255)',
        outline: 'none',
      }
    };
  };
  render() {

    const {
      disableOkBtn = false
    } = this.props;

    return (
      div({}, [

        h(Modal, {
          isOpen: this.props.showModal,
          onAfterOpen: this.props.afterOpen,
          onRequestClose: this.props.onRequestClose,
          style: this.customStyles,
          height: this.props.height,
          top: this.props.top,
          contentLabel: "Modal"
        }, [

          div({
            style: {
              width: '100%',
              padding: '0 15px 5px 15px'
            }
          }, [
            button({
              type: "button",
              style: {
                position: 'absolute',
                top: '20px',
                right: '20px'
              },
              className: "close",
              onClick: this.props.onRequestClose
            }, [
              span({
                className: "glyphicon glyphicon-remove default-color"
              }),
            ]),
            PageSubHeading({
              id: this.props.id,
              imgSrc: this.props.imgSrc,
              color: this.props.color,
              iconSize: this.props.iconSize,
              title: this.props.title,
              description: this.props.description
            }),
          ]),

          div({
            style: {
              width: '100%',
              padding: '10px 15px',
              outline: '0'
            }
          }, [this.props.children]),

          div({
            className: "modal-footer"
          }, [
            button({
              id: "btn_action",
              className: "col-lg-5 col-md-3 col-sm-4 col-xs-6 btn " + this.props.color + "-background",
              onClick: this.props.action.handler,
              disabled: disableOkBtn
            }, [this.props.action.label]),
            button({
              isRendered: this.props.type !== "informative",
              id: "btn_cancel",
              className: "col-lg-5 col-md-3 col-sm-4 col-xs-6 btn dismiss-background",
              onClick: this.props.onRequestClose
            }, ["Cancel"]),
          ]),

        ])

      ])
    );
  }
});