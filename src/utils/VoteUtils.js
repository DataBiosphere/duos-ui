import {isEmpty} from 'lodash/fp';
//helper method -> process match data and converts it to a Yes/No algorithm vote result
export const processMatchData = (matchData) => {
  if(isEmpty(matchData)){ return 'N/A'};
  const {match, failed} = matchData;
  return failed ? 'Unable to determine a system match' : match ? 'Yes' : 'No';
};

export default {
  processMatchData
};
