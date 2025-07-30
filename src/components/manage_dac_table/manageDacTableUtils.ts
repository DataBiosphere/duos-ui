import { Styles } from 'src/libs/theme'

export const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    borderRadius: '4px',
    margin: '0.5% 0',
    overflow: 'visible',
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
    border: 'none',
  }),
  cellWidth: {
    name: '25%',
    description: '60%',
    datasets: '10%',
    actions: '7%',
  },
  color: {
    name: '#337ab7',
    description: '#000000',
    datasets: '#000000',
    actions: '#000000',
  },
  fontSize: {
    name: '1.6rem',
    description: '1.4rem',
    datasets: '1.4rem',
    actions: '1.6rem',
  },
}
