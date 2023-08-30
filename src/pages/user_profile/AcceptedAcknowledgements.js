import React, { useState, useEffect } from 'react';
import { User } from '../../libs/ajax';
import { Notifications } from '../../libs/utils';

const Acknowledgment = ({ value }) =>
  <div style={{
    display: 'flex',
    flexDirection: 'row',
    fontFamily: 'Montserrat',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: '400',
    width: '675px'

  }}>
    <p>{value.name}</p>
    <div style={{ flex: '1' }} />
    <p>attested on: {value.attestedTime}</p>
  </div>;

export default function AcceptedAcknowledgements() {

  const [acceptedAcknowledgements, setAcceptedAcknowledgements] = useState([]);

  useEffect(() => {
    const init = async () => {
      const allAcknowledgements = [];
      try {
        const acknowledgements = await User.getAcknowledgements();
        for (const key in acknowledgements) {
          const currAcknowledgement = acknowledgements[key];
          const date = new Date(currAcknowledgement.lastAcknowledged);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const year = date.getFullYear();
          const newAcknowledgment = {
            name: currAcknowledgement.ackKey,
            attestedTime: `${month}/${day}/${year}`
          };
          allAcknowledgements.push(newAcknowledgment);
        }
        setAcceptedAcknowledgements(allAcknowledgements);
      } catch (error) {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' });
      }
    };
    init();
  }, []);

  return <div>
    <h1
      style={{
        color: '#01549F',
        fontSize: '20px',
        fontWeight: '600',
      }}
    >
      Accepted Terms & Policies
    </h1>
    <div style={{ marginTop: '20px' }} />
    {
      (acceptedAcknowledgements.length === 0)
        ?
        <div>
          <p>No Accepted Terms & Policies Found</p>
        </div>
        :
        acceptedAcknowledgements.map((value, index) => (
          <Acknowledgment key={index} value={value} />
        ))
    }
  </div>;
}
