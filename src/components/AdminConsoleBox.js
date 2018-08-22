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
        const titleTag = h2({ id: this.props.id + "-title", className: "admin-box-title " + this.props.color + "-color" }, [this.props.title, badge]);
        const descriptionTag = span({ id: this.props.id + "-description", className: "admin-box-description" }, [this.props.description]);
        const textWrapTag = div({ id: this.props.id + "-text", className: "admin-box-text " + this.props.icon_size }, [titleTag, descriptionTag]);

        if (this.props.url !== undefined && this.props.linkType === undefined) {
            tag = a({ id: this.props.id, href: this.props.url, className: "admin-box-wrapper"}, [
                iconTag, textWrapTag
            ]);
        }

        if (this.props.url === undefined && this.props.linkType !== undefined) {
            tag = div({ id: this.props.id, className: "admin-box-wrapper" }, [
                iconTag, textWrapTag
            ]);
        }

        return tag;
    }

});
