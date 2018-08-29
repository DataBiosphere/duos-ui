import { Component } from 'react';
import { div, button, hr } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class HomeRegister extends Component {

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
                        PageHeading({ id: "joinDUOS", color: "common", title: "Join DUOS", description: "Sign up to DUOS to find genomic datasets of interest and to submit Data Access Requests" }),
                    ]),
                ]),
                hr({ className: "section-separator" }),

                button({}, ["Click Me!"])
            ])
        );
    }
}

export default HomeRegister;

