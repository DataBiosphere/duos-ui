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

  render() {
    const aliases = _.join(_.map(this.props.dar.datasets, 'alias'), ', ');
    const names = _.join(_.map(this.props.dar.datasets, 'name'), ', ');
    return (
      div({ style: style }, [
        div({}, [
          span([this.props.dar.projectTitle, pipe]),
          span({}, [this.props.dar.darCode]),
          div({}, [
            span([aliases, pipe]),
            span([names, pipe]),
            span({}, [this.props.consentName])
          ])
        ])
      ])
    );
  }
});
