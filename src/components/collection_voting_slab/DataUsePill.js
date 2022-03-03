import {div, span} from "react-hyperscript-helpers";

const styles = {
  baseStyle: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    margin: '1rem 0 1rem 0'
  },
  code: {
    height: '32px',
    width: '53px',
    borderRadius: '5rem',
    backgroundColor: '#0948B7',
    color: '#FFFFFF',
    fontWeight: 'bold',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  },
  description: {
    color: '#333F52',
    fontWeight: '500',
  }
};


export default function DataUsePill(props) {
  const {dataUse, key} = props;
  const {code, description} = dataUse;

  return div({key: 'data_use_pill_' + key, style: styles.baseStyle}, [
    span({ style: styles.code }, code === null ? '' : code),
    span({ style: styles.description }, [description])
  ]);
}