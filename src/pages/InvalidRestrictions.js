import { Component } from 'react';
import { div, hr, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';


class InvalidRestrictions extends Component {

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
                    div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                        PageHeading({ imgSrc: "../images/icon_invalid_restrictions.png", iconSize: "large", color: "common", title: "Invalid Request Restriction", description: "List of Invalid Restrictions for Data Use Limitations and Data Access Requests" }),
                    ]),
                ]),
                hr({ className: "section-separator" }),

                button({}, ["Click Me!"])
            ])
        );
    }
}

export default InvalidRestrictions;

