import { div, span } from 'react-hyperscript-helpers';


const style = {
  'fontSize': 19,
  'fontStyle': 'normal',
  'margin': '10px 0 30px 56px',
  'color': '#333333',
  'fontWeight': 'normal',
  'lineHeight': '27px'
};

const pipe = ' | ';

export const instance = () => {
  return {
    translatedUseRestriction: '',
    researcherId: '',
    status: '',
    hasAdminComment: false,
    adminComment: '',
    hasPurposeStatements: false,
    darCode: '',
    projectTitle: '',
    purposeStatements: [],
    hasDiseases: false,
    diseases: [],
    researchType: [],
    researchTypeManualReview: '',
    pi: '',
    havePI: false,
    profileName: '',
    institution: '',
    department: '',
    city: '',
    country: '',
    datasets: [],

    // Deprecated
    datasetId: '',
    datasetName: '',
  };

};

export const details = (props) => {
  const isPopulated =
    props.projectTitle.length > 0 &&
    props.darCode.length > 0 &&
    props.datasetId.length > 0 &&
    props.datasetName.length > 0 &&
    props.consentName.length > 0;
  return (
    div({ style: style }, [
      div ({isRendered: isPopulated, }, [
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
