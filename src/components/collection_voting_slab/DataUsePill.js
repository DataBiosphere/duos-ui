import {div} from "react-hyperscript-helpers";

const styles = {
  code: {
    height: '32px',
    width: '53px',
    borderRadius: '16px',
    backgroundColor: '#0948B7',
    color: '#FFFFFF',
    fontFamily: 'Arial',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  description: {
    color: '#333F52',
    fontFamily: 'Arial',
    fontSize: '14px'
  }
};


export default function DataUsePill(props) {
  const {dataUseRestriction} = props;

  return div({}, [

  ]);
}