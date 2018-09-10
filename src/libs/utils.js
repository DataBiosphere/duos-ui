export const formatDate = (myDate) => {

  let dateval = new Date(myDate);
  let year = dateval.getFullYear();
  let month = ('0' + dateval.getMonth()).slice(-2);
  let day = ('0' + dateval.getDate()).slice(-2);
  let datestr = year + '-' + month + '-' + day;
  return datestr;
}