import { Component } from 'react';
import { div, h2, a, br } from 'react-hyperscript-helpers';

class NotFound extends Component {

    render() {

        return (
            div({ className: "container " }, [
                div({ className: "row " }, [
                    h2({ className: "main-title common-color" }, [
                        "Sorry, the page you were looking for was not found.",
                        br()
                    ]),
                    a({ className: "btn btn-primary vote-button", style: {"float": "left !important", "margin-top": "15px"}, href: "/home" }, [
                        "Back to Home"
                    ]),
                ])
            ])
        );
    }
}

export default NotFound;

