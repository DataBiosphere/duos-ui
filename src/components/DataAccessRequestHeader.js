import { map, join } from 'lodash/fp';
import {div, span} from 'react-hyperscript-helpers';
import { DataSet } from '../libs/ajax';
import {useEffect, useState} from 'react';

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
    // dar.datasets.value holds the ID of the dataset
    const datasetIds = map('value')(datasets);
    async function fetchDatasets() {
      const response = await Promise.all(map((id) => {
        return DataSet.getDataSetsByDatasetId(id);
      })(datasetIds));
      setFullDatasets(response);
    }
    // Call async promise for all datasets
    fetchDatasets();
  }, [datasets]);

  const aliases = join(',')(map('alias')(fullDatasets));
  const names = join(', ')(map('name')(fullDatasets));

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
