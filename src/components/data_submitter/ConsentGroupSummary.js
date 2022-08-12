import { div, input, label, span } from 'react-hyperscript-helpers';


export const ConsentGroupSummary = (props) => {
  const {
    consentGroup
  } = props;

  const primaryGroupText = () => {
    return '';
  };

  const secondaryGroupText = () => {
    return '';
  };

  const dataLocationText = () => {
    return '';
  };



  return div({}, [

    // row 1:
    // name, primary consent
    div({
      style: {
        display: 'flex',
        justifyContent: 'space-around',  
      }
    }, [

      div({
        width: '50%',
      }, [
        span({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          },
        },
        [consentGroup.consentGroupName]),
      ]),

      div({
        width: '50%',
      }, [
        span({}, ['asdf',primaryGroupText()]),
      ]),
    ]),

    // row 2:
    // secondary, data location
    // row 3:
    // url
  ]);
};

export default ConsentGroupSummary;