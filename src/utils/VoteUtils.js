import {getOr} from 'lodash/fp';

//helper method -> process match data and converts it to a Yes/No algorithm vote result
export const processMatchData = (matchData) => {
  const failure = JSON.stringify(getOr('false')('failed')(matchData)).toLowerCase() === 'true';
  const vote = JSON.stringify(getOr('false')('match')(matchData)).toLowerCase() === 'true';
  return failure ? 'Unable to determine a system match' : vote ? 'Yes' : 'No';
};

export default {
  processMatchData
};
