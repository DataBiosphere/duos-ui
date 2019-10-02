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
      datasets: props.datasets,
      consentName: props.consentName
    };
  };

  render() {
    const aliases = _.join(_.map(this.state.datasets, 'alias'), ', ');
    const properties = _.flatMap(this.state.datasets, 'properties');
    const filtered = _.filter(properties, {'propertyName': 'Dataset Name'});
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

export const details = (props) => {
  const isPopulated =
    props.projectTitle.length > 0 &&
    props.darCode.length > 0 &&
    props.datasetId.length > 0 &&
    props.datasetName.length > 0 &&
    props.consentName.length > 0;
  return (
    div({ style: style }, [
      div({ isRendered: isPopulated }, [
        span([props.projectTitle, pipe]),
        span({}, [props.darCode]),
        div({}, [
          span([props.datasetId, pipe]),
          span([props.datasetName, pipe]),
          span({}, [props.consentName])
        ])
      ])
    ])
  );
};

export const aliasDatasetId = (datasetId) => {
  const prefix = 'DUOS-';
  const i = parseInt(datasetId);
  if (i < 10) {
    return prefix + '00000' + i;
  }
  if (i < 100) {
    return prefix + '0000' + i;
  }
  if (i < 1000) {
    return prefix + '000' + i;
  }
  if (i < 10000) {
    return prefix + '00' + i;
  }
  if (i < 100000) {
    return prefix + '0' + i;
  }
  return datasetId;
};
