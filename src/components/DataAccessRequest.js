import _ from 'lodash';
import { Component } from 'react';
import { div, hh, span } from 'react-hyperscript-helpers';


const parseAlias = (alias) => {
  const prefix = 'DUOS-';
  const aliasInt = parseInt(alias);
  if (aliasInt < 10) {
    return prefix + '00000' + alias;
  }
  if (aliasInt < 100) {
    return prefix + '0000' + alias;
  }
  if (aliasInt < 1000) {
    return prefix + '000' + alias;
  }
  if (aliasInt < 10000) {
    return prefix + '00' + alias;
  }
  if (aliasInt < 100000) {
    return prefix + '0' + alias;
  }
  return prefix + alias;
};

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
    const aliases = _.join(_.map(this.props.dar.datasets, 'alias').map(a => parseAlias(a)), ', ');
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
