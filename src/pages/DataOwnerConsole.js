import { Component } from 'react';
import { div, hr } from 'react-hyperscript-helpers';
import { AddDulModal } from '../components/AddDulModal';
import { PageHeading } from '../components/PageHeading';

class DataOwnerConsole extends Component {
    
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
        let currentUser = {
            displayName: 'Nadya Lopez Zalba'
        }

        return (
            div({ className: "container" }, [
                div({ className: "row no-margin" }, [
                    div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
                        PageHeading({ imgSrc: "", iconSize: "none", color: "common-color", title: "Welcome " + currentUser.displayName + "!", description: "These are your pending cases for review" }),
                    ]),

                    div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 no-padding" }, [
                        AddDulModal({})
                    ]),
                ]),
                hr({ className: "section-separator" }),
            ])
        );
    }
}

export default DataOwnerConsole;