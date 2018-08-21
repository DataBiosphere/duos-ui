

import { Component } from 'react';
import { button, div, h2, h4, h, form, input, label, fieldset, textarea, img, span, hh, p, a } from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import styles from './BaseModal.css';
import { PageSubHeading } from '../components/PageSubHeading';

const customStyles = {
    overlay: {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(255, 255, 255, 0.75)'
    },

    content: {
        position: 'relative',
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
        width: '750px',
        margin: '12vh auto auto auto',
        border: '1px solid rgb(204, 204, 204)',
        background: 'rgb(255, 255, 255)',
        overflow: 'auto',
        borderRadius: '4px',
        outline: 'none',
        padding: '10px 20px 20px 20px',
    }
};

export const BaseModal = hh(class BaseModal extends Component {

    constructor() {
        super();

        this.state = {
            modalIsOpen: false
        };

        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.ok = this.ok.bind(this);
        this.cancel = this.cancel.bind(this);
    }

    openModal() {
        this.setState({ modalIsOpen: true });
    }

    afterOpenModal() {
        // references are now sync'd and can be accessed.
        // this.subtitle.style.color = '#f00';
    }

    closeModal() {
        this.setState({ modalIsOpen: false });
    }

    ok() {

    }

    cancel() {

    }

    render() {
        const file = {
            name: "MyFile.txt"
        }    

        const alerts = [

        ];

        return (
            div({}, [

                a({ className: this.props.modalBtnStyle , onClick: this.openModal },[
                    div({ isRendered: this.props.modalBtnIcon, className: "all-icons " + this.props.modalBtnIcon }),
                    span({ },[this.props.title]),
                ]),

                h(Modal, {
                    isOpen: this.state.modalIsOpen,
                    onAfterOpen: this.afterOpenModal,
                    onRequestClose: this.closeModal,
                    style: customStyles,
                    contentLabel: "Modal"
                }, [

                        div({ className: "modal-header" }, [
                            button({ type: "button", className: "modal-close-btn close", onClick: this.closeModal }, [
                                span({ className: "glyphicon glyphicon-remove default-color" }),
                            ]),
                            PageSubHeading({ imgSrc: this.props.imgSrc, color: this.props.color, title: this.props.title, description: this.props.description }),
                        ]),

                        div({ className: "modal-content" }, [
                            this.props.children
                        ]),

                        div({ className: "modal-footer" }, [                        
                            // disabled: "consentForm.$invalid || disableButton",
                            button({ className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn " + this.props.color + "-background", onClick: this.props.action.handler }, [this.props.action.label]),
                            button({ className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn dismiss-background", onClick: this.closeModal }, ["Cancel"]),

                        ]),

                    ])
                
            ])
        );
    }
});
