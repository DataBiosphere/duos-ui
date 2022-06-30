import {useState, useEffect} from 'react';
import {Notifications} from '../libs/utils';
import {div, h} from 'react-hyperscript-helpers';
import {Styles} from '../libs/theme';
import {User} from '../libs/ajax';
import { USER_ROLES } from '../libs/utils';
import DataCustodianTable from '../components/data_custodian_table/DataCustodianTable';
import { Config } from '../libs/config';


export default function SigningOfficialConsole() {
  const [env, setEnv] = useState();
  const [signingOfficial, setSigningOfficial] = useState({});
  const [researchers, setResearchers] = useState([]);
  const [unregisteredResearchers, setUnregisteredResearchers] = useState();

  //states to be added
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        //NOTE: Config.getEnv is async, can't just use it directly in isRendered
        //Need to assign to state variable on Component init for template reference
        const envValue = await Config.getEnv();
        const soUser = await User.getMe();
        const soPromises = await Promise.all([
          User.list(USER_ROLES.signingOfficial),
          User.getUnassignedUsers()
        ]);
        const researcherList = soPromises[0];
        const unregisteredResearchers = soPromises[1];
        setUnregisteredResearchers(unregisteredResearchers);
        setResearchers(researcherList);
        setSigningOfficial(soUser);
        setEnv(envValue);
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
        h(DataCustodianTable, {isRendered: env !== 'prod', researchers, signingOfficial, unregisteredResearchers, isLoading}, []),
      ])
    ])
  );
}