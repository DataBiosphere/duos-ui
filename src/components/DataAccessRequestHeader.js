import _ from 'lodash';
import map from 'lodash/fp';
import {div, span} from 'react-hyperscript-helpers';
import { DataSet } from '../libs/ajax';
import { useState, useEffect} from 'react';

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

  const [datasets, setDatasets] = useState(props.dar.datasets || []);
  const [consentName, setConsentName] = useState(props.consentName || '');
  const [darCode, setDarCode] = useState(props.dar.darCode || '');
  const [projectTitle, setProjectTitle] = useState(props.dar.projectTitle || '');

  // const [fullDatasets, setFullDatasets] = useState(
  //   map((id) => DataSet.getDataSetsByDatasetId(id))(
  //     map('value')(props.dar.datasets)) || []);

  const aliases = _.join(
    _.map(datasets, 'alias').map(a => parseAlias(a)), ', ');
  const names = _.join(_.map(datasets, 'name'), ', ');
  return (
    div({style: style}, [
      div({}, [
        span([projectTitle, pipe]),
        span({}, [darCode]),
        div({}, [
          span([aliases, pipe]),
          span([names, pipe]),
          span({}, [consentName]),
        ]),
      ]),
    ])
  );
};
