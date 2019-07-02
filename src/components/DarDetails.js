import { PureComponent } from 'react';
import { div, hh, label, h4, h, hr, span } from 'react-hyperscript-helpers';
import * as Utils from '../libs/utils';

export const DarDetails = hh(class DarDetails extends PureComponent {
    
    constructor(props) {
        super(props);
    }

    render() {
        return (
            span({className: "consent-data-alt"}, [
                span({className: "pipe"}, [
                    this.props.projectTitle  
                ]),
            
                span({className: "pipe"}, [
                    this.props.darCode
                ]),
    
                div({style: {'display':'block'}}, [
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