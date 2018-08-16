import { Component } from 'react';
import { div, a, hh } from 'react-hyperscript-helpers';

export const AdminConsoleBox = hh(class AdminConsoleBox extends Component {

    render() {

        let tag = a({}, []);

        const badge = this.props.unreviewed_cases && this.props.unreviewed_cases > 0 ?
            div({ className: "pcases-medium-tag" }, [this.props.unreviewed_cases])
            : null;

        const iconTag = div({ id: this.props.id + "-icon", className: "all-icons " + this.props.icon_name }, []);
        const titleTag = div({id: this.props.id + "-title",  className: "admin-icon-subtitles " + this.props.color }, [this.props.title, badge]);
        const subTitleTag = div({ id: this.props.id + "-subtitle", className: "cm-title-description", style: { 'marginLeft': '50px !important' } }, [this.props.subtitle]);

        if (this.props.url !== undefined && this.props.clickHandler === undefined) {
            tag = a({ id: this.props.id, href: this.props.url, className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 console-boxes admin-icons" }, [
                iconTag, titleTag, subTitleTag
            ]);
        }

        if (this.props.url === undefined && this.props.clickHandler !== undefined) {
            tag = a({ id: this.props.id, onClick: this.props.clickHandler, className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 console-boxes admin-icons" }, [
                iconTag, titleTag, subTitleTag
            ]);
        }

        if (this.props.url !== undefined && this.props.clickHandler !== undefined) {
            tag = a({ id: this.props.id, href: this.props.url, onClick: this.props.clickHandler, className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 console-boxes admin-icons" }, [
                iconTag, titleTag, subTitleTag
            ]);
        }

        return tag;
    }

});
