import { Component } from 'react';
import { div } from 'react-hyperscript-helpers';

class ResearcherConsole extends Component {

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
                    "Researcher Console goes here ..."
                ])
            ])
        );
    }
}

export default ResearcherConsole;