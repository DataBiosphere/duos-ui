import React from 'react';
import { isNil } from 'lodash';
import { Styles } from '../libs/theme';

export const TableHeaderSection = (props) => {
  const { icon, title, description } = props;

  return (
    <div style={{ display: 'flex', padding: '0 0 0 2em' }}>
      <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
        {!isNil(icon) && (
          <div style={Styles.ICON_CONTAINER}>
            <img
              id="dataset-icon"
              src={icon}
              style={{
                width: icon.width,
                height: icon.height,
              }}
            />
          </div>
        )}
        <div style={{ ...Styles.HEADER_CONTAINER, width: '120%' }}>
          <div
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontSize: '2.8rem',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: 'Montserrat',
              fontSize: '1.4rem',
              width: '150%',
            }}
          >
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableHeaderSection;
