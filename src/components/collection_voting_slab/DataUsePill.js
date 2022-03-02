import {div, span} from "react-hyperscript-helpers";

const styles = {
  code: {
    height: '32px',
    width: '53px',
    borderRadius: '5rem',
    backgroundColor: '#0948B7',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  },
  description: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: '1.4rem'
  }
};


export default function DataUsePill(props) {
  const {dataUseRestriction, key} = props;
  const {code, description} = dataUseRestriction;

  return div({key: 'data_use_pill_' + key}, [
    span({ style: styles.code }, code === null ? '' : code),
    span({ style: styles.description }, [description])
  ]);
}