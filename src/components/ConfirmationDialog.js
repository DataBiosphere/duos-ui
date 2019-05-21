import { Component } from 'react';
import { button, div, h, h2, span, hh, label } from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import AsyncSelect from 'react-select/lib/Async';
import { Alert } from '../components/Alert';
import './ConfirmationDialog.css';


const customStyles = {
  overlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },

  content: {
    position: 'relative',
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    width: '600px',
    margin: '12vh auto auto auto',
    border: '1px solid rgb(204, 204, 204)',
    background: 'rgb(255, 255, 255)',
    overflow: 'auto',
    borderRadius: '4px',
    outline: 'none',
    padding: '10px 20px 20px 20px',
  },

  labelMargin: {
    margin: '10px 0 5px 0', textAlign: 'left', float: 'left'
  }
};

Modal.setAppElement('#root');

export const ConfirmationDialog = hh(class ConfirmationDialog extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dacName: '',
      alertMessage: undefined,
      alertTitle: undefined
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    return {
      alertMessage: nextProps.alertMessage,
      alertTitle: nextProps.alertTitle
    };
  }

  render() {
    const { disableOkBtn = false, disableNoBtn = false } = this.props;

    return (

      div({}, [

        h(Modal, {
          isOpen: this.props.showModal,
          onAfterOpen: this.props.afterOpenModal,
          onRequestClose: this.props.onRequestClose,
          style: customStyles,
          contentLabel: "Modal"
        }, [

            div({ className: "dialog-header" }, [
              button({ id: "btn_dialogClose", type: "button", className: "dialog-close-btn close", onClick: this.props.action.handler(false) }, [
                span({ className: "glyphicon glyphicon-remove default-color" }),
              ]),
              h2({ id: "lbl_dialogTitle", className: "dialog-title " + this.props.color + "-color" }, [this.props.title]),
            ]),

            div({ id: "lbl_dialogContent", className: "dialog-content" }, [
              this.props.children,
              div({ 
                isRendered: this.props.dacSelection !== undefined, 
                className: "form-group" }, [
                label({
                  id: "lbl_selectDAC",
                  className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 control-label " + this.props.color + "-color", style: customStyles.labelMargin,
                }, ["Select a DAC to vote on this election"]),
                  h(AsyncSelect, {
                    id: "sel_dac",
                    // key: this.state.dacName,
                    isMulti: false,
                    // loadOptions: (query, callback) => this.searchDacs(query, callback),
                    // onChange: (option) => this.onDacsChange(option),
                    // value: this.state.dacName,
                    // noOptionsMessage: () => this.state.optionMessage,
                    // loadingMessage: () => this.state.optionMessage,
                    classNamePrefix: "select",
                    placeholder: "Select DAC...",
                    className: 'select-autocomplete',
                    required: true
                  })
              ]),
              div({ isRendered: this.state.alertTitle !== undefined, className: "dialog-alert" }, [
                Alert({ id: "dialog", type: "danger", title: this.state.alertTitle, description: this.state.alertMessage })
              ])
            ]),

            div({ className: "dialog-footer" }, [
              button({ isRendered: this.props.type !== "informative", id: "btn_cancel", className: "col-lg-3 col-lg-offset-3 col-md-3 col-md-offset-3 col-sm-4 col-sm-offset-2 col-xs-6 btn dismiss-background", onClick: this.props.action.handler(false), disabled: disableNoBtn }, ["No"]),
              button({ id: "btn_action", className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn " + this.props.color + "-background " + (this.props.type === "informative" ? "f-right" : ""), onClick: this.props.action.handler(true), disabled: disableOkBtn }, [this.props.action.label]),
            ])
          ])
      ])
    );
  }
});
