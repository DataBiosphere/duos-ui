

import { Component } from 'react';
import { button, div, h, span, hh, a } from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import styles from './BaseModal.css';
import { PageSubHeading } from '../components/PageSubHeading';
import { AdminConsoleBox } from '../components/AdminConsoleBox';

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

    constructor(props) {
        super(props);

        this.state = {
            modalIsOpen: this.props.showModal
        };

        console.log('-------------------- BaseModal.state ---------------', this.state, this.props);

        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.ok = this.ok.bind(this);
        this.cancel = this.cancel.bind(this);
    }

    componentWillMount() {
        console.log('componentWillMount', this.state, this.props);
    }

    componentWillUpdate() {
        console.log('componentWillUpdate', this.state, this.props);
    }

    componentDidMount() {
        console.log('componentDidMount', this.state, this.props);
    }

    componentDidUpdate() {
        console.log('componentDidUpdate', this.state, this.props);
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

        console.log('-------------------------- BaseModal.render ---------------------', this.state);
        return (
            div({}, [

                // a({ 
                //     isRendered: this.props.linkType === "a-tag",
                //     className: this.props.modalBtnStyle,
                //     onClick: this.openModal
                // },[
                //     div({ isRendered: this.props.modalBtnIcon, className: "all-icons " + this.props.modalBtnIcon }),
                //     span({ },[this.props.modalBtnText]),
                // ]),

                // button({
                //     isRendered: this.props.linkType === "button-tag",
                //     className: this.props.modalBtnStyle,
                //     onClick: this.openModal
                // },[
                //     div({ isRendered: this.props.modalBtnIcon, className: "all-icons " + this.props.modalBtnIcon }),
                //     span({ },[this.props.modalBtnText]),
                // ]),

                // a({ 
                //     isRendered: this.props.linkType === "console-tag",
                //     modalBtnStyle: this.props.modalBtnStyle,
                //     onClick: this.openModal
                // },[
                //     AdminConsoleBox({
                //         linkType: this.props.linkType,  
                //         id: this.props.id,
                //         color: this.props.color,
                //         title: this.props.title,
                //         description: this.props.description,
                //         iconName: this.props.iconName,
                //         iconSize: this.props.iconSize
                //       },[
                //     ]),
                // ]),

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
                            PageSubHeading({ imgSrc: this.props.imgSrc, color: this.props.color, iconSize: this.props.iconSize, title: this.props.title, description: this.props.description }),
                        ]),

                        div({ className: "modal-content" }, [
                            this.props.children
                        ]),

                        div({ className: "modal-footer" }, [
                            // disabled: "consentForm.$invalid || disableButton",
                            button({ id: "btn_action", className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn " + this.props.color + "-background", onClick: this.props.action.handler }, [this.props.action.label]),
                            button({ id: "btn_cancel", className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn dismiss-background", onClick: this.closeModal }, ["Cancel"]),

                        ]),

                    ])

            ])
        );
    }
});
