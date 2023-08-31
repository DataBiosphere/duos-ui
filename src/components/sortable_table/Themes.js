import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  components: {
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          textAlign: 'center',
          color: '#626262',
          '&.Mui-active': {
            color: '#626262'
          }
        },
      }
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          fontFamily: 'Montserrat',
          color: '#000',
          fontSize: '14px',
          fontWeight: '400',
          padding: '7px 20px 7px 20px'
        },
        actions: {
          marginRight: '20px',
          marginLeft: '25px'
        },
        displayedRows: {
          fontFamily: 'Montserrat',
          color: '#626262',
          fontSize: '12px',
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: 'Montserrat',
          color: '#000',
          fontSize: '14px',
          fontWeight: '400',
          padding: '7px 20px 7px 20px'
        }
      }
    },
  }
});