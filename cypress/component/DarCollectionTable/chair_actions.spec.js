/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from '@cypress/react';
import ChairActions from '../../../src/components/dar_collection_table/ChairActions';
import {cloneDeep} from 'lodash/fp';
import { Navigation } from '../../../src/libs/utils';
import { DAC } from '../../../src/libs/ajax';
import { Storage } from '../../../src/libs/storage';

let propCopy;
const collectionId = 1;
const collectionSkeleton = {
  collectionId,
  dars: undefined
};

const nonVoteableDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        votes: {
          dacUserId: 2
        }
      }
    }
  }
};

const votableDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        votes: {
          1: {dacUserId: 2}
        },
        datasetId: 1
      },
    }
  },
  2: {
    elections: {
      3: {
        status: 'Open',
        votes: {
          2: {dacUserId: 1}
        },
        datasetId: 2
      }
    }
  }
};

const nonOpenDars = {
  1: {
    elections: {
      1: {
        status: 'Closed',
        votes: {
          dacUserId: 1
        },
        datasetId: 1
      },
    }
  },
  2: {
    elections: {
      2: {
        status: 'Closed',
        votes: {
          dacUserId: 1
        },
        datasetId: 2
      }
    }
  }
};

const missingElectionSet = {
  1: {
    elections: {},
    data: {
      datasetIds: [1]
    }
  },
  2: {
    elections: {
      1: {
        status: 'Open',
        votes: {
          dacUserId: 2
        }
      }
    }
  }
};

const cancelableDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        votes: {
          dacUserId: 1
        },
        datasetId: 1
      }
    }
  },
  2: {
    elections: {
      2: {
        status: 'Closed',
        votes: {
          dacUserId: 1
        },
        datasetId: 2
      }
    }
  }
};

const user = {
  dacUserId: 1,
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
  updateCollections: () => {},
};

beforeEach(() => {
  propCopy = cloneDeep(props);
  cy.stub(Navigation, 'console').returns({});
  cy.stub(Storage, 'getCurrentUser').returns(user);
});

describe('Chair Actions - Container', () => {
  it('renders the actions container div', () => {
    propCopy.collection.dars = votableDars;
    cy.stub(DAC, 'datasets').returns([]);
    mount(<ChairActions {...propCopy}/>);
    const container = cy.get('.chair-actions');
    container.should('exist');
  });
});

describe('Chair Actions - Open Button', () => {
  it('should render the open button if there is a valid election for opening/re-opening', () => {
    propCopy.collection.dars = nonOpenDars;
    cy.stub(DAC, 'datasets').returns([{dataSetId: 1}, {dataSetId: 2}, {dataSetId: 3}]);
    mount(<ChairActions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('exist');
  });

  it('should not render if the is no valid election for opening/re-opening', () => {
    propCopy.collection.dars = votableDars;
    cy.stub(DAC, 'datasets').returns([]);
    mount(<ChairActions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('not.exist');
  });

  it('should render if there are valid DARs with no election present', () => {
    propCopy.collection.dars = missingElectionSet;
    let mockDacId = 1;
    cy.stub(DAC, 'datasets').returns([{dacId: mockDacId++}]);
    mount(<ChairActions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('exist');
  });

  it('should not render if DARs with missing elections are not under purview', () => {
    propCopy.collection.dars = missingElectionSet;
    cy.stub(DAC, 'datasets').returns([]);
    mount(<ChairActions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('not.exist');
  });
});

describe('Chair Actions - Close Button', () => {
  it('should render if there is a valid election for canceling', () => {
    propCopy.collection.dars = cancelableDars;
    cy.stub(DAC, 'datasets').returns([{dataSetId:1},{dataSetId: 2}]);
    mount(<ChairActions {...propCopy} />);
    const openButton = cy.get(`#chair-cancel-${collectionId}`);
    openButton.should('exist');
  });

  it('should not render if there is no valid election for canceling', () => {
    propCopy.collection.dars = nonOpenDars;
    cy.stub(DAC, 'datasets').returns([]);
    mount(<ChairActions {...propCopy} />);
    const openButton = cy.get(`#chair-cancel-${collectionId}`);
    openButton.should('not.exist');
  });
});

describe('Chair Actions - Vote Button', () => {
  it('should not render if relevant elections are not votable', () => {
    propCopy.collection.dars = nonVoteableDars;
    cy.stub(DAC, 'datasets').returns([{dataSetId: 1}, {dataSetId: 2}]);
    mount(<ChairActions {...propCopy} />);
    const voteButton = cy.get(`#chair-vote-${collectionId}`);
    voteButton.should('not.exist');
  });
  it('should not render if some DARs are missing elections', () => {
    propCopy.collection.dars = missingElectionSet;
    cy.stub(DAC, 'datasets').returns([{ dataSetId: 1 }, { dataSetId: 2 }]);
    mount(<ChairActions {...propCopy} />);
    const voteButton = cy.get(`#chair-vote-${collectionId}`);
    voteButton.should('not.exist');
  });
  it('should render if all relevant elections are votable', () => {
    propCopy.collection.dars = votableDars;
    cy.stub(DAC, 'datasets').returns([{ dataSetId: 1 }, { dataSetId: 2 }]);
    mount(<ChairActions {...propCopy} />);
    const voteButton = cy.get(`#chair-vote-${collectionId}`);
    voteButton.should('exist');
  });
  it('should not render if only some of the relevant elections are votable', () => {
    propCopy.collection.dars = missingElectionSet;
    cy.stub(DAC, 'datasets').returns([{ dataSetId: 1 }, { dataSetId: 2 }]);
    mount(<ChairActions {...propCopy} />);
    const voteButton = cy.get(`#chair-vote-${collectionId}`);
    voteButton.should('not.exist');
  });
});



