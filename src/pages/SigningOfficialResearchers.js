import {useState, useEffect} from 'react';
import {Notifications} from '../libs/utils';
import {div, h} from 'react-hyperscript-helpers';
import {Styles} from '../libs/theme';
import SigningOfficialTable from '../components/signing_official_table/SigningOfficialTable';
import {User} from '../libs/ajax';
import { USER_ROLES } from '../libs/utils';


export default function SigningOfficialResearchers() {
  const [signingOfficial, setSiginingOfficial] = useState({});
  const [researchers, setResearchers] = useState([]);
  const [unregisteredResearchers, setUnregisteredResearchers] = useState();

  //states to be added and used for manage researcher component
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        const soUser = await User.getMe();
        const soPromises = await Promise.all([
          User.list(USER_ROLES.signingOfficial),
          User.getUnassignedUsers()
        ]);
        const researcherList = soPromises[0];
        const unregisteredResearchers = soPromises[1];
        setUnregisteredResearchers(unregisteredResearchers);
        setResearchers(researcherList);
        setSiginingOfficial(soUser);
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
        h(SigningOfficialTable, {researchers, signingOfficial, unregisteredResearchers, isLoading}, []),
      ])
    ])
  );
}