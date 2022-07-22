/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from 'cypress/react';
import ChairActions from '../../../src/components/dar_collection_table/ChairActions';
import {cloneDeep} from 'lodash/fp';
import { Navigation } from '../../../src/libs/utils';
import { Storage } from '../../../src/libs/storage';

let propCopy;
const collectionId = 1;
const collectionSkeleton = {
  darCollectionId: collectionId,
  dars: undefined
};

const nonVoteableDars = {
  1: {
    elections: {
      1: {
        electionType: 'DataAccess',
        status: 'Open',
        votes: {
          1: {dacUserId: 2}
        }
      }
    },
    data: {}
  }
};

const votableDars = {
  1: {
    elections: {
      1: {
        electionType: 'DataAccess',
        status: 'Open',
        votes: {
          1: {dacUserId: 2}
        },
        dataSetId: 1
      },
    },
    data: {}
  },
  2: {
    elections: {
      3: {
        electionType: 'DataAccess',
        status: 'Open',
        votes: {
          2: {dacUserId: 1}
        },
        dataSetId: 2
      }
    },
    data: {}
  }
};

const nonOpenDars = {
  1: {
    elections: {
      1: {
        electionType: 'DataAccess',
        status: 'Closed',
        votes: {
          1: {dacUserId: 1}
        },
        dataSetId: 1
      },
    },
    data: {}
  },
  2: {
    elections: {
      2: {
        electionType: 'DataAccess',
        status: 'Closed',
        votes: {
          1: {dacUserId: 1}
        },
        dataSetId: 2
      }
    },
    data: {}
  }
};

const missingElectionSet = {
  1: {
    elections: {},
    data: {
      datasetIds: [1]
    },
    datasetIds: [1]
  },
  2: {
    elections: {
      1: {
        electionType: 'DataAccess',
        status: 'Open',
        votes: {
          1: {dacUserId: 2}
        },
        referenceId: 2
      }
    },
    data: {}
  }
};

const cancelableDars = {
  1: {
    elections: {
      1: {
        electionType: 'DataAccess',
        status: 'Open',
        votes: {
          1: {dacUserId: 1}
        },
        dataSetId: 1
      }
    },
    data: {}
  }
};

const nonCancelableDars = {
  1: {
    elections: {
      1: {
        electionType: 'DataAccess',
        status: 'Open',
        votes: {
          1: {dacUserId: 1}
        },
        dataSetId: 1
      }
    },
    data: {}
  },
  2: {
    elections: {
      2: {
        electionType: 'DataAccess',
        status: 'Closed',
        votes: {
          1: {dacUserId: 1}
        },
        dataSetId: 2
      }
    },
    data: {}
  }
};

const darsWithRpElection = {
  1: {
    elections: {
      1: {
        electionType: 'RP',
        status: 'Open',
        votes: {
          1: {dacUserId: 1}
        },
        dataSetId: 1
      }
    },
    data: {}
  }
};


const user = {
  userId: 1,
  roles: [
    {
      dacId: 2
    },
    {}, //not all roles are tied to a DAC, this is a stub for those roles
    {
      dacId: 3
    }
  ]
};

const props = {
  collection: collectionSkeleton,
  showCancelModal: () => {},
  updateCollections: () => {}
};

beforeEach(() => {
  propCopy = cloneDeep(props);
  cy.stub(Navigation, 'console').returns({});
  cy.stub(Storage, 'getCurrentUser').returns(user);
});

describe('Chair Actions - Container', () => {
  it('renders the actions container div', () => {
    propCopy.collection.dars = votableDars;
    propCopy.relevantDatasets = [];
    mount(<ChairActions {...propCopy}/>);
    const container = cy.get('.chair-actions');
    container.should('exist');
  });
});

describe('Chair Actions - Open Button', () => {
  it('should render the open button if there is a valid election for opening/re-opening', () => {
    propCopy.collection.dars = nonOpenDars;
    propCopy.relevantDatasets = [{dataSetId: 1}, {dataSetId: 2}, {dataSetId: 3}];
    mount(<ChairActions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('exist');
  });

  it('should not render if there is no valid election for opening/re-opening', () => {
    propCopy.openEnabled = false;
    mount(<ChairActions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('not.exist');
  });

  it('should render if there are valid DARs with no election present', () => {
    propCopy.openEnabled = true;
    mount(<ChairActions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('exist');
  });
});

describe('Chair Actions - Close Button', () => {
  it('should render if there is a valid election for canceling (all open elections)', () => {
    propCopy.cancelEnabled = true;
    mount(<ChairActions {...propCopy} />);
    const closeButton = cy.get(`#chair-cancel-${collectionId}`);
    closeButton.should('exist');
  });

  it('should not render if there is no valid election for canceling (no open elections)', () => {
    propCopy.cancelEnabled = false;
    mount(<ChairActions {...propCopy} />);
    const closeButton = cy.get(`#chair-cancel-${collectionId}`);
    closeButton.should('not.exist');
  });
});

describe('Chair Actions - Vote Button', () => {
  it('should not render if relevant elections are not votable', () => {
    propCopy.voteEnabled = false;
    mount(<ChairActions {...propCopy} />);
    const voteButton = cy.get(`#chair-vote-${collectionId}`);
    voteButton.should('not.exist');
  });
  it('should render if all relevant elections are votable', () => {
    propCopy.voteEnabled = true;
    mount(<ChairActions {...propCopy} />);
    const voteButton = cy.get(`#chair-vote-${collectionId}`);
    voteButton.should('exist');
  });
});



