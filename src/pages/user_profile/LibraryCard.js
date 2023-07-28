import React, { useEffect, useState } from 'react';
import { eRACommons } from '../../components/eRACommons';
import { Notifications } from '../../libs/utils';

export default function LibraryCard(props) {

  const {
    issuedOn,
    issuedBy
  } = props;

  return <div style={{ display: 'flex' }}>
    <div style={{
      height: '40px',
      width: '60px',
      background: '#00A097',
      borderRadius: '4px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25) inset',
      paddingTop: '1px'
    }}>
      <p style={{
        fontFamily: 'Montserrat',
        fontSize: '16px',
        fontWeight: '500',
        lineHeight: '20px',
        letterSpacing: '0em',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 1)'
      }}>
        Yes
      </p>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <p style={{ margin: '0px 0px 0px 10px' }}>Issued on: {issuedOn}</p>
      <p style={{ margin: '0px 0px 0px 10px' }}>Issued by: {issuedBy}</p>
    </div>
  </div>
}