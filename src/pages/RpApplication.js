import { Component } from 'react';
import { div, button, hr } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';


class RpApplication extends Component {

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
            div({ className: "container " }, [
                div({ className: "row no-margin" }, [
                    div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                        PageHeading({ imgSrc: "../images/icon_add_access.png", iconSize: "medium", color: "access", title: "Data Access Request Application", description: "The section below includes a series of questions intended to allow our Data Access Committee to evaluate a newly developed semi-automated process of data access control." }),
                    ]),
                ]),
                hr({ className: "section-separator" }),

                button({}, ["Click Me!"])
            ])
        );
    }
}

export default RpApplication;

