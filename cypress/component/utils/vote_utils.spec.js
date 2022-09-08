/* eslint-disable no-undef */
import {processMatchData} from '../../../src/utils/VoteUtils';

describe('VoteUtil - processMatchData()', () => {
  it('returns "N/A" if matchData is empty', () => {
    expect(processMatchData({})).to.equal('N/A');
  });
  it('returns "Yes" if failed === false and match === true', () => {
    expect(processMatchData({match: true, failed: false})).to.equal('Yes');
  });
  it('returns "Unable to determine a system match" if failed === true', () => {
    expect(processMatchData({ failed: true, match: false })).to.equal('Unable to determine a system match');
  });
  it('returns "No" if failed === false and match === false', () => {
    expect(processMatchData({ failed: false, match: false })).to.equal('No');
  });
});
