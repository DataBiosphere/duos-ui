/* eslint-disable no-undef */
import {checkIfOpenableElectionPresent, checkIfCancelableElectionPresent} from '../../../src/utils/DarCollectionUtils';

const openableAndClosableDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        electionType: 'DataAccess'
      },
      2: {
        status: 'Open',
        electionType: 'RP'
      },
    },
  },
  2: {
    elections: {
      3: {
        status: 'Canceled',
        electionType: 'DataAccess'
      },
      4: {
        status: 'Canceled',
        electionType: 'RP'
      }
    },
  },
};

const closeableDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        electionType: 'DataAccess'
      },
      2: {
        status: 'Open',
        electionType: 'RP'
      }
    }
  },
  2: {
    elections: {
      3: {
        status: 'Open',
        electionType: 'DataAccess'
      },
      4: {
        status: 'Open',
        electionType: 'RP'
      }
    }
  }
};

const openableDars = {
  1: {
    elections: {
      1: {
        status: 'Canceled',
        electionType: 'DataAccess'
      },
      2: {
        status: 'Canceled',
        electionType: 'RP'
      }
    }
  },
  2: {
    elections: {
      3: {
        status: 'Closed',
        electionType: 'DataAccess'
      },
      4: {
        status: 'Closed',
        electionType: 'RP'
      }
    }
  }
}

describe('checkIfOpenableElectionPresent()', () => {
  it('returns true if there is at least one election that is not open', () => {
    const isOpenable = checkIfOpenableElectionPresent(openableAndClosableDars);
    expect(isOpenable).to.be.true;
  });
  it('returns false if there is no valid election to be opened', () => {
    const isOpenable = checkIfOpenableElectionPresent(closeableDars);
    expect(isOpenable).to.be.false;
  });
});

describe('checkIfCancelableElectionPresent()', () => {
  it('returns true if there is at least one cancelable election present', () => {
    const isCancelable = checkIfCancelableElectionPresent(openableAndClosableDars);
    expect(isCancelable).to.be.true;
  });
  it('returns false if there is no valid elections for cancelation', () => {
    const isCancelable = checkIfCancelableElectionPresent(openableDars);
    expect(isCancelable).to.be.false;
  });
});