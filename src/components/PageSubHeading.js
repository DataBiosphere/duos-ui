import { Component } from 'react';
import { div, hh, img, h2, span } from 'react-hyperscript-helpers';
import styles from './PageSubHeading.css';

export const PageSubHeading = hh(class PageSubHeading extends Component {

    render() {
        
        return div({ className: "page-sub-heading" }, [
            img({ isRendered: this.props.imgSrc, src: this.props.imgSrc, alt: this.props.title, className: "page-sub-heading-icon" }),
            div({ className: "page-sub-heading-text"}, [
                h2({ className: "page-sub-heading-title  " + this.props.color }, [this.props.title]),
                span({ className: "page-sub-heading-description"}, [this.props.description]),
            ]),
            
        ])

    }
    
});
