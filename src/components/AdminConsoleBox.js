import { Component } from 'react';
import { div, a, hh, h2, span } from 'react-hyperscript-helpers';
import styles from './AdminConsoleBox.css';

export const AdminConsoleBox = hh(class AdminConsoleBox extends Component {

    componentWillMount() {
        console.log('componentWillMount', this.state, this.props);
    }

    componentWillUpdate() {
        console.log('componentWillUpdate', this.state, this.props);
    }

    componentDidMount() {
        console.log('componentDidMount', this.state, this.props);
    }

    componentDidUpdate() {
        console.log('componentDidUpdate', this.state, this.props);
    }

    
    render() {

        console.log('-----------AdminConsoleBox-------------', this.state, this.props);
        
        let tag = a({}, []);

        const badge = this.props.unreviewedCases && this.props.unreviewedCases > 0 ?
            div({ className: "pcases-medium-tag" }, [this.props.unreviewedCases])
            : null;

        const iconTag = div({ id: this.props.id + "-icon", className: "admin-box-icon " + this.props.iconName }, []);
        const titleTag = h2({ id: this.props.id + "-title", className: "admin-box-title " + this.props.color + "-color" }, [this.props.title, badge]);
        const descriptionTag = span({ id: this.props.id + "-description", className: "admin-box-description" }, [this.props.description]);
        const textWrapTag = div({ id: this.props.id + "-text", className: "admin-box-text " + this.props.iconSize }, [titleTag, descriptionTag]);

        // tag = a({ id: this.props.id, href: this.props.url, className: "admin-box-wrapper"}, [
        //     iconTag, textWrapTag
        // ]);
      

        if (this.props.url !== undefined && this.props.clickHandler === undefined) {
            tag = a({ id: this.props.id, href: this.props.url, className: "admin-box-wrapper" }, [
                iconTag, textWrapTag
            ]);
        }

        if (this.props.url === undefined && this.props.clickHandler !== undefined) {
            tag = a({ id: this.props.id, onClick: this.props.clickHandler, className: "admin-box-wrapper" }, [
                iconTag, textWrapTag
            ]);
        }

        return tag;
    }

});
