import { User } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { div } from 'react-hyperscript-helpers';
import { USER_ROLES } from '../libs/utils';
import { useHistory, useLocation } from 'react-router';

export default function BackgroundSignIn(props) {
  const location = useLocation();
  const history = useHistory();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const bearerToken = props.bearerToken || (token || '');

  const getUser = async () => {
    return await User.getMe();
  };

  const redirect = (user) => {
    const page = user.isAdmin ? 'admin_console' :
      user.isChairPerson ? 'chair_console' :
        user.isMember ? 'member_console' :
          user.isResearcher ? 'dataset_catalog' :
            user.isDataOwner ? 'data_owner_console' :
              user.isAlumni ? 'summary_votes' : '/';
    history.push(page);
    if (props.onSignIn)
      props.onSignIn();
  };

  const setUserRoleStatuses = (user) => {
    const currentUserRoles = user.roles.map(roles => roles.name);
    user.isChairPerson = currentUserRoles.indexOf(USER_ROLES.chairperson) > -1;
    user.isMember = currentUserRoles.indexOf(USER_ROLES.member) > -1;
    user.isAdmin = currentUserRoles.indexOf(USER_ROLES.admin) > -1;
    user.isResearcher = currentUserRoles.indexOf(USER_ROLES.researcher) > -1;
    user.isDataOwner = currentUserRoles.indexOf(USER_ROLES.dataOwner) > -1;
    user.isAlumni = currentUserRoles.indexOf(USER_ROLES.alumni) > -1;
    Storage.setCurrentUser(user);
    return user;
  };

  const setIsLogged = (user) => {
    Storage.setUserIsLogged(true);
  };

  Storage.setGoogleData({ accessToken: bearerToken });
  getUser().then(
    user => {
      user = Object.assign(user, setUserRoleStatuses(user));
      setIsLogged();
      redirect(user);
    },
    error => {
      const status = error.status;
      switch (status) {
        case 400:
          if (props.onError)
            props.onError(error);
          break;
        case 409:
        // If the user exists, just log them in.
          getUser().then(
            user => {
              user = Object.assign(user, setUserRoleStatuses(user));
              setIsLogged();
              redirect(user);
            },
            error => {
              Storage.clearStorage();
            });
          break;
        default:
          break;
      }
    });

  return div({}, []);
}