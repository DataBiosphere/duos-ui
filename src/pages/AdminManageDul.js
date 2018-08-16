import { Component } from 'react';
import { div } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class AdminManageDul extends Component {

    constructor(props) {
        super(props);
        this.state = {
            value: ''
        }

        this.myHandler = this.myHandler.bind(this);
    }

    myHandler(event) {
        // TBD
    }

    render() {
        return (
            div({ className: "container" }, [
                div({ className: "row no-margin" }, [
                    div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
                        PageHeading({ imgSrc: "../images/icon_manage_dul.png", iconSize: "medium", color: "dul-color", title: "Manage Data Use Limitations", description: "Select and manage Data Use Limitations for DAC review" }),
                    ]),
                ])
            ])
        );
    }
}

export default AdminManageDul;

