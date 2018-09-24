export const formatDate = (dateval) => {
  if (dateval === null || dateval === undefined) {
    return '---';
  }
  
  let dateFormat = new Date(dateval);
  let year = dateFormat.getFullYear();
  let month = ('0' + dateFormat.getMonth()).slice(-2);
  let day = ('0' + dateFormat.getDate()).slice(-2);
  let datestr = year + '-' + month + '-' + day;
  return datestr;
};

export const USER_ROLES = {
  admin: 'ADMIN',
  chairperson: 'CHAIRPERSON',
  member: 'MEMBER',
  researcher: 'RESEARCHER',
  alumni: 'ALUMNI',
  dataOwner: 'DATAOWNER',
  all: 'ALL'
};
