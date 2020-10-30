import _ from 'lodash';
import {div, span} from 'react-hyperscript-helpers';

const parseAlias = (alias) => {
  const n = parseInt(alias);
  const prefix = 'DUOS-';
  const pad = '000000';
  return prefix + (pad + n).slice(-pad.length);
};

const style = {
  'fontSize': 19,
  'fontStyle': 'normal',
  'margin': '10px 0 30px 56px',
  'color': '#333333',
  'fontWeight': 'normal',
  'lineHeight': '27px',
};

const pipe = ' | ';

export default function DataAccessRequestHeader(props) {

  const aliases = _.join(
    _.map(props.dar.datasets, 'alias').map(a => parseAlias(a)), ', ');
  const names = _.join(_.map(props.dar.datasets, 'name'), ', ');
  return (
    div({style: style}, [
      div({}, [
        span([props.dar.projectTitle, pipe]),
        span({}, [props.dar.darCode]),
        div({}, [
          span([aliases, pipe]),
          span([names, pipe]),
          span({}, [props.consentName]),
        ]),
      ]),
    ])
  );
};
