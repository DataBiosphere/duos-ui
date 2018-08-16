import { Component } from 'react';
import { div, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../components/BaseModal';
import { AddDulModal } from '../components/AddDulModal';

export const ChairConsole = hh(class ChairConsole extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showModal: false
        };
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
    }

    handleOpenModal() {
        this.setState({ showModal: true });
    }

    handleCloseModal() {
        this.setState({ showModal: false });
    }


    render() {

        return (

            div({}, [

                div({ className: "container" }, [
                    "Chair Console goes here ...",
                    AddDulModal({})
                ])
            ])
        );
    }
});
