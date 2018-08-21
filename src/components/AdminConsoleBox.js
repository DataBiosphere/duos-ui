import { Component } from 'react';
import { div, a, hh, h2, span } from 'react-hyperscript-helpers';
import styles from './AdminConsoleBox.css';

export const AdminConsoleBox = hh(class AdminConsoleBox extends Component {

    render() {

        let tag = a({}, []);

        const badge = this.props.unreviewed_cases && this.props.unreviewed_cases > 0 ?
            div({ className: "pcases-medium-tag" }, [this.props.unreviewed_cases])
            : null;

        const iconTag = div({ id: this.props.id + "-icon", className: "admin-box-icon " + this.props.icon_name }, []);
        const titleTag = h2({ id: this.props.id + "-title", className: "admin-box-title " + this.props.color }, [this.props.title, badge]);
        const descriptionTag = span({ id: this.props.id + "-description", className: "admin-box-description" }, [this.props.description]);
        const textWrapTag = div({ id: this.props.id + "-text", className: "admin-box-text " + this.props.icon_size }, [titleTag, descriptionTag]);

        if (this.props.url !== undefined && this.props.clickHandler === undefined) {
            tag = a({ id: this.props.id, href: this.props.url, className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                iconTag, textWrapTag
            ]);
        }

        if (this.props.url === undefined && this.props.clickHandler !== undefined) {
            tag = a({ id: this.props.id, onClick: this.props.clickHandler, className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                iconTag, textWrapTag
            ]);
        }

        if (this.props.url !== undefined && this.props.clickHandler !== undefined) {
            tag = a({ id: this.props.id, href: this.props.url, onClick: this.props.clickHandler, className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 admin-box" }, [
                iconTag, textWrapTag
            ]);
        }

        return tag;
    }

});
