import { Component } from 'react';
import { div, hh } from 'react-hyperscript-helpers';

export const TitleBox = hh(class TitleBox extends Component {

    render() {

        return div({ className: "row admin-icons" }, [
            div({ className: this.props.iconName }, []),
            div({ className: "admin-icon-subtitles " + this.props.color }, [this.props.title]),
            div({ className: "cm-title-description", style: { 'marginLeft': '50px !important' } }, [this.props.description])
        ]);

    }

});
