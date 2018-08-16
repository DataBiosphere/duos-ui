import { Component } from 'react';
import { div, a } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class NotFound extends Component {

    render() {

        return (
            div({ className: "container" }, [
                div({ className: "row no-margin" }, [
                    div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                        PageHeading({ imgSrc: "", iconSize: "none", color: "common-color", title: "Sorry, the page you were looking for was not found." }),
                    ]),
                    a({ className: "btn btn-primary vote-button f-left", style: {marginTop: '15px'}, href: "/home" }, ["Back to Home"]),
                ]),

            ])
        );
    }
}

export default NotFound;

