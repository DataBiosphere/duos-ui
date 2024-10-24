import React from 'react';
import {useState, useEffect} from 'react';
import {Notifications} from '../../libs/utils';
import {Styles} from '../../libs/theme';
import {User} from '../../libs/ajax/User';
import {DAA} from '../../libs/ajax/DAA';
import {DAC} from '../../libs/ajax/DAC';
import { USER_ROLES } from '../../libs/utils';
import ManageResearcherDAAsTable from './ManageResearcherDAAsTable';

export default function ManageResearcherDAAs() {
  const [signingOfficial, setSigningOfficial] = useState({});
  const [researchers, setResearchers] = useState([]);
  const [daas, setDaas] = useState([]);
  const [dacs, setDacs] = useState([]);

  //states to be added and used for manage researcher component
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const soUser = await User.getMe();
        const researcherList = await User.list(USER_ROLES.signingOfficial);
        const daaList = await DAA.getDaas();
        const dacList = await DAC.list();

        setResearchers(researcherList);
        setSigningOfficial(soUser);
        setDaas(daaList);
        setDacs(dacList);
        setIsLoading(false);
      } catch (error) {
        Notifications.showError({
          text: 'Error: Unable to retrieve current user from server',
        });
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return (
    <div style={Styles.PAGE}>
      <div className='signing-official-tabs'>
        <ManageResearcherDAAsTable researchers={researchers} signingOfficial={signingOfficial} daas={daas} dacs={dacs} isLoading={isLoading} />
      </div>
    </div>
  );
}
