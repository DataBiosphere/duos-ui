import {Styles} from '../../libs/theme';

export const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    borderRadius: '4px',
    margin: '0.5% 0'
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
    color: '#7B7B7B',
    fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    backgroundColor: 'B8CDD3',
    border: 'none'
  }),
  cellWidths: {
    duosId: '10%',
    phsId: '10%',
    datasetName: '15%',
    studyName: '15%',
    dataSubmitter: '15%',
    dataCustodian: '15%',
    dataUse: '10%',
    status: '10%'
  },
  color: {
    dataUseGroup: '#000000',
    votes: '#000000',
    numberOfDatasets: '#000000',
    datasets: '#000000',
  },
  fontSize: {
    dataUseGroup: '1.4rem',
    votes: '1.4rem',
    numberOfDatasets: '1.4rem',
    datasets: '1.4rem',
  },
};
