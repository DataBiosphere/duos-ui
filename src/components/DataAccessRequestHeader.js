import _ from 'lodash';
import fp from 'lodash/fp';
import {div, span} from 'react-hyperscript-helpers';
import { DataSet } from '../libs/ajax';
import {useEffect, useState} from 'react';

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

  const [datasets] = useState(props.dar.datasets || []);
  const [consentName] = useState(props.consentName || '');
  const [darCode] = useState(props.dar.darCode || '');
  const [projectTitle] = useState(props.dar.projectTitle || '');
  const [fullDatasets, setFullDatasets] = useState([]);

  // Populate remote datasets here
  useEffect( () => {
    let didCancel = false;
    async function fetchDatasets() {
      const datasetIds = fp.map('value')(datasets);
      const response = await fp.map((id) => {
        return DataSet.getDataSetsByDatasetId(id);
      })(datasetIds);
      if (!didCancel) {
        console.log("finished dataset call: " + response);
      }
      console.log(response);
      setFullDatasets(response);
      // return () => { didCancel === true;};
    }
    fetchDatasets();
  }, [datasets]);

  const aliases = fp.join(',')(_.map(datasets, 'alias').map(a => parseAlias(a)));
  const names = fp.join(', ')(fp.map('name')(datasets));

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
