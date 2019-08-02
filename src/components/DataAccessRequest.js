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

export const details = (props) => {
  return (
    div({ style: style }, [
      span([props.projectTitle, pipe]),
      span({}, [props.darCode]),
      div({}, [
        span([props.datasetId, pipe]),
        span([props.datasetName, pipe]),
        span({}, [props.consentName])
      ])
    ])
  );
};
