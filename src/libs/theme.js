export const Theme = {
  palette: {
    primary: '#1f3b50',
    secondary: '#00609f',
    highlighted: '#c16b0c',
    link: '#216fb4',
    error: '#DB3214',
    success: '#00928A',
    disabled: '#cccccc',
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
      header: '18px',
      subheader: '16px',
      small: '14px'
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

export const Styles = {
  PAGE: {
    width: "90%",
    margin: "0 auto"
  },
  TITLE: {
    fontFamily: "Montserrat",
    fontWeight: Theme.font.weight.semibold,
    fontSize: Theme.font.size.title,
  },
  SMALL: {
    fontFamily: 'Montserrat',
    fontWeight: Theme.font.weight.regular,
    fontSize: Theme.font.size.small
  },
  HEADER_IMG: {
    width: '60px',
    height: '60px',
  },
  HEADER_CONTAINER: {
    display: 'flex',
    flexDirection: "column"
  },
  ICON_CONTAINER: {
    flexBasis: '76px',
    height: '60px',
    paddingRight: '16px'
  },
  RIGHT_HEADER_SECTION: {
    display: 'flex',
    alignItems: 'flex-end'
  },
  LEFT_HEADER_SECTION: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: "3rem"
  },
  TABLE: {
    CONTAINER: {
      margin: "3rem auto"
    },
    HEADER_ROW: {
      fontFamily: "Montserrat",
      fontSize: "14px",
      color: "#00243C",
      fontWeight: Theme.font.weight.medium,
      backgroundColor: "#f3f6f7",
      display: "flex",
      justifyContent: "center",
      height: "51px"
    },
    RECORD_ROW: {
      fontFamily: 'Montserrat',
      fontWeight: Theme.font.weight.regular,
      fontSize: "14px",
      display: "flex",
      justifyContent: "center",
      height: "48px",
    },
    RECORD_TEXT: {
      color: "#00243C"
    },
    DAR_TEXT_HOVER: {
      cursor: 'pointer',
      color: '#0cabc5d9'
    },
    DATA_REQUEST_TEXT: {
      color: "#00609F",
      fontWeight: Theme.font.weight.semibold
    },
    //NOTE: play around with the cell measurements
    TITLE_CELL: {
      width: "18%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
      margin: "0 2%"
    },
    DATA_ID_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    SUBMISSION_DATE_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    DAC_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    ELECTION_STATUS_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    ELECTION_ACTIONS_CELL: {
      width: "23%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    FOOTER: {
      display: 'flex',
      color: "#00243C",
      fontSize: '14px'
    },
    END_FOOTER_SECTION: {
      width: "20%"
    },
    MIDDLE_FOOTER_SECTION: {
      width: "25%"
    }
  },
  MODAL: {
    CONTENT: {
      height: "auto",
      top: "20%",
      bottom: "20%",
      left: "20%",
      right: "20%",
      fontFamily: 'Montserrat',
      padding: "2%"
    },
    DAR_SUBHEADER: {
      display: 'flex',
      fontFamily: 'Montserrat',
      fontSize: '16px',
      fontWeight: Theme.font.weight.semibold,
      justifyContent: 'left',
      color: "#777"
    },
    TITLE_HEADER: {
      display: 'flex',
      fontFamily: 'Montserrat',
      fontSize: Theme.font.size.title,
      fontWeight: Theme.font.weight.regular,
      justifyContent: 'left',
      marginBottom: '4%'
    },
    DAR_DETAIL_ROW: {
      padding: '0 3%',
      margin: '2% 0',
      display: 'flex',
      justifyContent: 'space-between'
    },
    DAR_LABEL: {
      color: "#777777",
      fontSize: '14px',
      fontWeight: Theme.font.weight.semibold,
      width: "25%",
      textAlign: 'right'
    },
    DAR_DETAIL: {
      fontSize: '16px',
      fontWeight: Theme.font.weight.medium,
      width: "70%"
    }
  }
};
