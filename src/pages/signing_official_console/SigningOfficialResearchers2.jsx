import React from 'react';
import {useState, useEffect} from 'react';
import {Notifications} from '../../libs/utils';
import {Styles} from '../../libs/theme';
import {User} from '../../libs/ajax';
import { USER_ROLES } from '../../libs/utils';
import SigningOfficialTable2 from './SigningOfficialTable2';

export default function SigningOfficialResearchers() {
  const [signingOfficial, setSigningOfficial] = useState({});
  const [researchers, setResearchers] = useState([]);

  //states to be added and used for manage researcher component
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        const soUser = await User.getMe();
        const researcherList = await User.list(USER_ROLES.signingOfficial);

        setResearchers(researcherList);
        setSigningOfficial(soUser);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retrieve current user from server'});
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return (
    <div style={Styles.PAGE}>
      <div className='signing-official-tabs'>
        <SigningOfficialTable2 researchers={researchers} signingOfficial={signingOfficial} isLoading={isLoading} />
      </div>
    </div>
  );
};
