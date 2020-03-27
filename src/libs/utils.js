import Noty from 'noty';
import 'noty/lib/noty.css';

export const formatDate = (dateval) => {
  if (dateval === null || dateval === undefined) {
    return '---';
  }

  let dateFormat = new Date(dateval);
  let year = dateFormat.getFullYear();
  let month = ('0' + (dateFormat.getMonth() + 1)).slice(-2);
  let day = ('0' + dateFormat.getDate()).slice(-2);
  let datestr = year + '-' + month + '-' + day;
  return datestr;
};

export const USER_ROLES = {
  admin: 'Admin',
  chairperson: 'Chairperson',
  member: 'Member',
  researcher: 'Researcher',
  alumni: 'Alumni',
  dataOwner: 'DataOwner',
  all: 'All'
};

export const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

export const Navigation = {
  back: (user, history) => {
    const page = user.isChairPerson ? '/chair_console'
      : user.isMember ? '/member_console'
        : user.isAdmin ? '/admin_console'
          : user.isResearcher ? '/dataset_catalog?reviewProfile'
            : user.isDataOwner ? '/data_owner_console'
              : user.isAlumni ? '/summary_votes'
                : '/';
    history.push(page);
  }
};

export const download = (fileName, text) => {
  const break_line = '\r\n \r\n';
  text = break_line + text;
  let blob = new Blob([text], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = fileName + '-restriction';
  a.click();
};

export const Notifications = {
  defaultNotification: {
    layout: 'bottomRight',
    timeout: '3500',
    progressBar: false,
  },
  /**
   * @param props: pass in properties like 'text', 'timeout', 'layout', and 'progressBar'.
   * See https://ned.im/noty/#/options for more customization options.
   */
  showError: props => {
    return new Noty({
      text: 'Something went wrong. Please try again.',
      ...Notifications.defaultNotification,
      ...props,
      type: 'error',
      theme: 'duos',
    }).show();
  },
};
