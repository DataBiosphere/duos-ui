export const Theme = {
  palette: {
    primary: '#1f3b50',
    secondary: '#00609f',
    highlighted: '#c16b0c',
    link: '#216fb4',
    error: '#DB3214',
    success: '#00928A',
    disabled: '#cccccc',
    white: '#ffffff',
    background: {
      secondary: 'rgba(0, 96, 159, 0.1)',
      highlighted: 'rgba(193,107,12, 0.1)',
    }
  },
  font: {
    weight: {
      semibold: '600',
      regular: '400',
      medium: '500'
    },
    size: {
      title: '28px',
      superheader: '24px',
      header: '1.8rem',
      subheader: '1.65rem',
      small: '1.5rem',
    },
    leading: {
      regular: '22px',
      dense: '18px',
      title: '34px',
    }
  },
  legacy: {
    color: '#777777',
    fontFamily: '\'Roboto\', sans-serif',
    fontSize: '15px'
  },
  lightTable: {
    margin: '25px 0 10px 0',
    borderRadius: '10px',
    padding: '15px',
    boxShadow: '3px 3px 0 #cccccc',
    height: 'auto',
    border: '1px solid #cccccc',
    background: '#ffffff',
  },
  textTableBody: {
    fontWeight: 'normal',
    fontSize: '14px',
    color: '#000000',
    padding: '12px 5px 0 5px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  textTableHead: {
    minHeight: '43px',
    fontSize: '16px',
    padding: '10px',
    fontWeight: '500'
  },
};

const targetFont  = 'Montserrat';

export const Styles = {
  NAVBAR: {
    DRAWER_LINK: {
      fontFamily: targetFont,
      fontWeight: 400,
      fontSize: '1.6rem'
    }
  },
  PAGE: {
    width: '90%',
    margin: '0 auto'
  },
  TITLE: {
    fontFamily: targetFont,
    fontWeight: Theme.font.weight.semibold,
    fontSize: Theme.font.size.title,
  },
  SMALL: {
    fontFamily: targetFont,
    fontWeight: Theme.font.weight.regular,
    fontSize: Theme.font.size.small
  },
  SMALL_BOLD: {
    fontFamily: targetFont,
    fontWeight: Theme.font.weight.semibold,
    fontSize: Theme.font.size.small,
    padding: '1rem'
  },
  MEDIUM: {
    fontFamily: targetFont,
    fontWeight: Theme.font.weight.semibold,
    fontSize: '18px',
    margin: '15px 0'
  },
  MEDIUM_ROW: {
    display: 'flex',
    fontSize: '18px'
  },
  MEDIUM_DESCRIPTION: {
    fontFamily: targetFont,
    fontWeight: Theme.font.weight.regular,
    fontSize: '15px',
  },
  SUB_HEADER: {
    marginTop: '20px',
    fontSize: '22px',
    fontWeight: '500'
  },
  MINOR_HEADER:{
    fontWeight: Theme.font.weight.semibold,
    fontSize: Theme.font.size.small,
    backgroundColor: Theme.palette.background.secondary,
    padding: '1rem'
  },
  JUMBO: {
    fontSize: '60px',
    paddingTop: '30px',
    textAlign: 'center'
  },
  DESCRIPTION_BOX: {
    borderRadius: 9,
    height: 200,
    width: 550,
    border: '1px solid #BABEC1',
    margin: '.5rem 1rem .5rem 0',
    overflowX: 'hidden',
    overflowY: 'scroll'
  },
  SQUARE_BOX: {
    alignContent: 'center',
    borderRadius: 9,
    height: 200,
    width: 220,
    border: '1px solid #BABEC1',
    margin: '.5rem 1rem .5rem 0',
    overflowX: 'hidden',
    overflowY: 'scroll'
  },
  READ_MORE: {
    border: '1px solid #BABEC1',
    alignContent: 'center',
    borderRadius: 9,
    backgroundColor: Theme.palette.background.secondary,
    margin: '1rem 1rem 1rem 0',
    overflowX: 'hidden',
    overflowY: 'scroll',
  },
  HEADER_IMG: {
    width: '60px',
    height: '60px',
  },
  HEADER_CONTAINER: {
    display: 'flex',
    flexDirection: 'column'
  },
  ICON_CONTAINER: {
    flexBasis: '76px',
    height: '60px',
    paddingRight: '16px'
  },
  RIGHT_HEADER_SECTION: {
    display: 'flex',
    alignItems: 'flex-end',
    width: '25%',
  },
  LEFT_HEADER_SECTION: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: '3rem'
  },
  TABLE: {
    CONTAINER: {
      marginTop: '2rem',
      marginLeft: '-6%',
      borderTop: '1px solid #979797',
      backgroundColor: 'rgb(184,205,211,0.08)',
      padding: '2rem 4rem',
      width: '112%',
      color: '#7B7B7B',
      fontFamily: 'Montserrat',
    },
    CARDCONTAINER: {
      margin: '-.75rem -12.5% 2rem',
      border: '1px solid #979797',
      backgroundColor: 'rgb(184,205,211,0.08)',
      padding: '1rem 4rem',
      color: '#7B7B7B',
      fontFamily: 'Montserrat',
    },
    HEADER_ROW: {
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      marginBottom: '1rem',
      fontWeight: Theme.font.weight.semibold,
    },
    HEADER_SORT: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '100%'
    },
    RECORD_ROW: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #DEDEDE',
      width: '100%',
      display: 'flex',
      borderRadius: '5px',
      marginBottom: '1rem',
    },
    RECORD_TEXT: {
      color: '#7B7B7B',
    },
    DAR_TEXT_HOVER: {
      cursor: 'pointer',
      color: '#0cabc5d9'
    },
    RECORD_ROW_HOVER: {
      backgroundColor: '#e2eef9'
    },
    DATA_REQUEST_TEXT: {
      color: '#00609F',
      fontWeight: Theme.font.weight.semibold
    },
    //NOTE: play around with the cell measurements
    TITLE_CELL: {
      width: '18%',
      display: 'flex',
      justifyContent: 'left',
      alignItems: 'center',
      wordBreak: 'break-word',
      margin: '0 1%'
    },
    DATASET_CELL: {
      width: '18%',
      margin: '0 1%',
      display: 'flex',
      justifyContent: 'left',
      alignItems: 'center'
    },
    DATA_ID_CELL: {
      width: '14%',
      margin: '0 1%',
      display: 'flex',
      justifyContent: 'left',
      alignItems: 'center'
    },
    SUBMISSION_DATE_CELL: {
      width: '12%',
      margin: '0 1%',
      display: 'flex',
      justifyContent: 'left',
      alignItems: 'center',
    },
    DAC_CELL: {
      width: '8%',
      margin: '0 1%',
      display: 'flex',
      justifyContent: 'left',
      alignItems: 'center',
    },
    ELECTION_STATUS_CELL: {
      color: '#7B7B7B',
      fontWeight: Theme.font.weight.medium,
      width: '12%',
      margin: '0 1%',
      display: 'flex',
      justifyContent: 'left',
      alignItems: 'center',
    },
    ELECTION_ACTIONS_CELL: {
      width: '16%',
      margin: '0 1%',
      display: 'flex',
      justifyContent: 'left',
      alignItems: 'center',
    },
    ID_CELL: {
      width: '2%',
      margin: '0 1%',
      display: 'flex',
      justifyContent: 'left',
      alignItems: 'center',
    },
    INSTITUTION_CELL: {
      maxWidth: '25%',
      minWidth: '25%',
      margin: '0 1%',
      display: 'flex',
      justifyContent: 'left',
      alignItems: 'center',
    },
    FOOTER: {
      backgroundColor: '#f3f6f7',
      fontSize: '14px',
      fontFamily: targetFont,
      display: 'flex',
      padding: '0 1%',
      justifyContent: 'flex-end',
      height: '51px',
      borderBottomLeftRadius: 'inherit',
      borderBottomRightRadius: 'inherit'
    },
    FOOTER_SECTION: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center'
    },
    PAGINATION_SECTION_OFFSET: {
      flex: 1
    },
    PAGINATION_BUTTON_SECTION: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1
    },
    PAGINATION_BUTTON: {
      margin: '2%',
      flex: 1,
      fontFamily: 'Montserrat'
    },
    PAGINATION_CURRENT_PAGE: {
      margin: '2% 0',
      flex: 2,
      fontFamily: 'Montserrat'
    },
    PAGINATION_INPUT: {
      textAlign: 'center',
      width: '20%',
      fontFamily: 'Montserrat'
    },
    PAGINATION_TABLE_SIZE_SECTION: {
      display: 'flex',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      fontFamily: 'Montserrat'
    },
    TABLE_TEXT_BUTTON: {
      display: 'flex',
      width: '65%',
      minWidth: '98px',
      maxWidth: '115px',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Theme.palette.secondary,
      color: 'white',
      height: '60%',
      borderRadius: '.3rem',
      cursor: 'default',
      minHeight: '3rem',
      margin: '2% 10% 2% 0'
    },
    TABLE_TEXT_BUTTON_SUCCESS: {
      display: 'flex',
      width: '65%',
      minWidth: '98px',
      maxWidth: '115px',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Theme.palette.success,
      color: Theme.palette.white,
      height: '60%',
      borderRadius: '.3rem',
      cursor: 'default',
      minHeight: '3rem',
      margin: '2% 10% 2% 0'
    },
    TABLE_TEXT_BUTTON_OUTLINED: {
      display: 'flex',
      width: '65%',
      minWidth: '98px',
      maxWidth: '115px',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Theme.palette.white,
      color: Theme.palette.secondary,
      height: '60%',
      borderRadius: '.3rem',
      cursor: 'default',
      minHeight: '3rem',
      margin: '2% 10% 2% 0',
      border: '1px solid',
      borderColor: Theme.palette.secondary
    },
    TABLE_BUTTON_TEXT_HOVER: {
      backgroundColor: '#2FA4E7',
      cursor: 'pointer'
    },
    TABLE_BUTTON_TEXT_HOVER_OUTLINED: {
      cursor: 'pointer',
      borderColor: '#2FA4E7',
      color: '#2FA4E7'
    },
    TABLE_BUTTON_TEXT_HOVER_SUCCESS: {
      backgroundColor: '#00D8CC',
      cursor: 'pointer'
    },
    TABLE_BUTTON_ICON_HOVER: {
      color: '#2FA4E7',
      cursor: 'pointer'
    },
    TABLE_ICON_BUTTON: {
      display: 'flex',
      width: 'auto',
      color: Theme.palette.secondary,
      height: '60%',
      borderRadius: '.3rem',
      cursor: 'pointer',
      minHeight: '3rem',
    }
  },
  MODAL: {
    CONTENT: {
      height: 'auto',
      top: '20%',
      bottom: '20%',
      left: '20%',
      right: '20%',
      fontFamily: targetFont,
      padding: '2%'
    },
    CONFIRMATION: {
      height: '250px',
      inset: '20%',
      fontFamily: targetFont,
      padding: '2%'
    },
    DAR_SUBHEADER: {
      display: 'flex',
      fontFamily: targetFont,
      fontSize: '16px',
      fontWeight: Theme.font.weight.semibold,
      justifyContent: 'left',
      color: '#1F3B50'
    },
    TITLE_HEADER: {
      display: 'flex',
      fontFamily: targetFont,
      fontSize: Theme.font.size.title,
      fontWeight: Theme.font.weight.semibold,
      justifyContent: 'left',
      marginBottom: '4%',
      color: '#1F3B50'
    },
    DAR_DETAIL_ROW: {
      padding: '0 3%',
      margin: '2% 0',
      display: 'flex',
      justifyContent: 'space-between'
    },
    DAR_LABEL: {
      color: '#1F3B50',
      fontSize: '14px',
      fontWeight: Theme.font.weight.semibold,
      width: '25%',
      textAlign: 'right'
    },
    DAR_DETAIL: {
      fontSize: '16px',
      fontWeight: Theme.font.weight.regular,
      width: '70%'
    }
  },
  ALERT: {
    fontSize: '15px',
    textAlign: 'center'
  }
};
