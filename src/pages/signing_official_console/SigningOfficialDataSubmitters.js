import {useState, useEffect} from 'react';
import {Notifications} from '../../libs/utils';
import {div, h} from 'react-hyperscript-helpers';
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
    div({style: Styles.PAGE}, [
      div({style: {}, className: 'signing-official-tabs'}, [
        h(DataCustodianTable, {researchers, signingOfficial, unregisteredResearchers, isLoading}, []),
      ])
    ])
  );
}