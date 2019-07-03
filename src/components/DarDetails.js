import { PureComponent } from 'react';
import { div, hh, span } from 'react-hyperscript-helpers';

const styles = {
    consentDataAlt: {
        'font-size': 19,
        'font-style': 'normal',
        'margin': '10px 0 30px 56px',
        'color': '#333333',
        'font-weight': 'normal',
        'line-height': '27px'
    }
};

export const DarDetails = hh(class DarDetails extends PureComponent {
    
    constructor(props) {
        super(props);
    }

    render() {
        return (
            div({style: styles.consentDataAlt}, [
                span({className: "pipe"}, [
                    this.props.projectTitle  
                ]),
            
                span({className: "pipe"}, [
                    this.props.darCode
                ]),
    
                div({}, [
                    span({className: "pipe"}, [
                        this.props.datasetId  
                    ]),
        
                    span({className: "pipe"}, [
                        this.props.datasetName
                    ]),
        
                    span({}, [
                        this.props.consentName
                    ])
                ])
            ])
        )
    }
});