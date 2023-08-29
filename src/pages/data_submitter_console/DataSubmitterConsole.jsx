import React from 'react';
import {Styles, Theme} from '../../libs/theme';
import lockIcon from '../../images/lock-icon.png';
import {Link} from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export default function DataSubmitterConsole(props) {

  const addDatasetButtonStyle = {
    color: Theme.palette.link,
    backgroundColor: 'white',
    border: '1px solid',
    borderColor: Theme.palette.link,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.45rem',
    padding: '3%',
    cursor: 'default',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginRight: 5,
    marginTop: 10
  };

  return (
    <div style={Styles.PAGE}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '112%',
          marginLeft: '-6%',
          padding: '0 2.5%'
        }}>
        <div
          className={'left-header-section'}
          style={Styles.LEFT_HEADER_SECTION}>
          <div
            style={Styles.ICON_CONTAINER}>
            <img
              alt={'Lock Icon'}
              id={'lock-icon'}
              src={lockIcon}
              style={Styles.HEADER_IMG}/>
          </div>
          <div
            style={Styles.HEADER_CONTAINER}>
            <div
              style={{fontFamily: 'Montserrat', fontWeight: 600, fontSize: '2.8rem'}}>
              My Submitted Datasets
            </div>
            <div
              style={{fontFamily: 'Montserrat', fontSize: '1.6rem'}}>
              View the status of datasets registered in DUOS
            </div>
            <div>
              <button style={addDatasetButtonStyle}>
                <AddCircleOutlineIcon/><Link to={'/data_submission_form'} style={{marginLeft: 5}}>Add Dataset</Link>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}