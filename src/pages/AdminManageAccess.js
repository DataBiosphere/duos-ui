import { Component } from 'react';
import { div } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class AdminManageAccess extends Component {

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
                        PageHeading({ imgSrc: "../images/icon_manage_access.png", iconSize: "medium", color: "access-color", title: "Manage Data Access Request", description: "Select and manage Data Access Request for DAC review" }),
                    ]),
                ])
            ])
        );
    }
}

export default AdminManageAccess;

