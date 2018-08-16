

import { Component } from 'react';
import { button, div, h2, form, input, h, hh } from 'react-hyperscript-helpers';
import  Modal  from 'react-modal';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)'
    }
};

export const BaseModal = hh(class BaseModal extends Component {

    constructor(props) {
        super(props);

        this.state = {
            modalIsOpen: false
        };

        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
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

    render() {
        return (
            div({}, [
                button({ onClick: this.openModal }, ["Open Modal"]),
                h(Modal, {
                    isOpen: this.state.modalIsOpen,
                    onAfterOpen: this.afterOpenModal,
                    onRequestClose: this.closeModal,
                    style: customStyles,
                    contentLabel: "Example Modal"
                }, [
                        // h2({ ref: subtitle => this.subtitle = subtitle }, ["Hello"]),
                        // button({ onClick: this.closeModal }, ["close"]),
                        // div({}, ["I am a modal"]),
                        // form({}, [
                        //     input({}),
                        //     button({}, ["tab navigation"]),
                        //     button({}, ["stays"]),
                        //     button({}, ["inside"]),
                        //     button({}, ["the modal"]),
                        // ])
                        this.props.content
                    ])
            ])
        );
    }
});