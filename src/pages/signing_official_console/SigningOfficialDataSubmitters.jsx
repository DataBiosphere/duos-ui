import React from 'react';
import {useState, useEffect} from 'react';
import {Notifications} from '../../libs/utils';
import {Styles} from '../../libs/theme';
import {User} from '../../libs/ajax';
import { USER_ROLES } from '../../libs/utils';
import DataCustodianTable from './DataCustodianTable';


export default function SigningOfficialConsole() {
  const [signingOfficial, setSigningOfficial] = useState({});
  const [researchers, setResearchers] = useState([]);
  const [unregisteredResearchers, setUnregisteredResearchers] = useState();

  //states to be added
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        //Need to assign to state variable on Component init for template reference
        const soUser = await User.getMe();
        const soPromises = await Promise.all([
          User.list(USER_ROLES.signingOfficial),
          User.getUnassignedUsers()
        ]);
        setResearchers(soPromises[0]);
        setUnregisteredResearchers(soPromises[1]);
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
      <div className="signing-official-tabs">
        <DataCustodianTable researchers={researchers} signingOfficial={signingOfficial} unregisteredResearchers={unregisteredResearchers} isLoading={isLoading} />
      </div>
    </div>
  );
}
