import _ from 'lodash';
import { Component } from 'react';
import { div, hh, span } from 'react-hyperscript-helpers';


const style = {
  'fontSize': 19,
  'fontStyle': 'normal',
  'margin': '10px 0 30px 56px',
  'color': '#333333',
  'fontWeight': 'normal',
  'lineHeight': '27px'
};

const pipe = ' | ';

export const DataAccessRequest = hh(class DataAccessRequest extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dar: props.dar,
      consentName: props.consentName
    };
  };

  render() {
    const aliases = _.join(_.map(this.state.dar.datasets, 'alias'), ', ');
    const properties = _.flatMap(this.state.dar.datasets, 'properties');
    const filtered = _.filter(properties, { 'propertyName': 'Dataset Name' });
    const mapped = _.map(filtered, 'propertyValue');
    const joined = _.join(mapped, ', ');
    return (
      div({ style: style }, [
        div({}, [
          span([this.state.dar.projectTitle, pipe]),
          span({}, [this.state.dar.darCode]),
          div({}, [
            span([aliases, pipe]),
            span([joined, pipe]),
            span({}, [this.state.consentName])
          ])
        ])
      ])
    );
  }
});
