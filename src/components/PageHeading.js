import { Component } from 'react';
import { div, hh, img, h2, span } from 'react-hyperscript-helpers';
import styles from './PageHeading.css';

export const PageHeading = hh(class PageHeading extends Component {

    render() {

        return div({ className: "page-heading" }, [
            img({ isRendered: this.props.imgSrc, src: this.props.imgSrc, alt: this.props.title, className: "page-heading-icon" }),
            div({ className: "page-heading-text " + this.props.iconSize }, [
                h2({ className: "page-heading-title  " + this.props.color }, [this.props.title]),
                span({ className: "page-heading-description"}, [this.props.description]),
            ]),
            
        ])

    }
    
});
