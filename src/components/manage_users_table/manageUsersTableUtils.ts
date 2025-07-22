import {Styles} from 'src/libs/theme';

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
  cellWidth: {
    username: '20%',
    usernameMargin: '5%',
    email: '20%',
    emailMargin: '5%',
    institution: '20%',
    institutionMargin: '5%',
    perms: '20%',
  },
  color: {
    username: '#000000',
    email: '#000000',
    perms: '#000000',
  },
  fontSize: {
    username: '1.6rem',
    email: '1.4rem',
    perms: '1.4rem',
  },
};
