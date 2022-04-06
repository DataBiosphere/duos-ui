/* eslint-disable no-undef */
import {checkIfOpenableElectionPresent, checkIfCancelableElectionPresent, updateCollectionFn, cancelCollectionFn, openCollectionFn} from '../../../src/utils/DarCollectionUtils';
import { Collections } from '../../../src/libs/ajax';
import { Notifications } from '../../../src/libs/utils';

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
};

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

describe('updateCollectionFn', () => {
  it('generates an update callback function for consoles to use', () => {
    const collections = [{}];
    const filterFn = () => {};
    const searchRef = {current:{value: 1}};
    const setCollections = () => {};
    const setFilteredList = () => {};

    expect(updateCollectionFn({collections, filterFn, searchRef, setCollections, setFilteredList})).to.exist;
  });

  it('collections and filteredList with the filter results', () => {
    let filteredList = [];
    let collections = [{darCollectionId: 1, dars: {}}];
    const updatedList = [{ darCollectionId: 1, dars: {} }];
    const updatedCollection = {darCollectionId: 1, dars: {1: {data: 'test'}}};
    const setFilteredList = (arr) => filteredList = arr;
    const setCollections = ((arr) => collections = arr);
    const filterFn = () => updatedList;
    const searchRef = {current: {value: 'value'}};
    const callback = updateCollectionFn({collections, filterFn, searchRef, setCollections, setFilteredList});

    callback(updatedCollection);
    expect(filteredList[0].darCollectionId).to.equal(updatedList[0].darCollectionId);
    expect(filteredList[0].data).to.equal(updatedList[0].data);
    expect(collections[0].darCollectionId).to.equal(updatedCollection.darCollectionId);
    expect(collections[0].dars[1].data).to.equal(updatedCollection.dars[1].data);
  });
});

describe ('cancelCollectionFn', () => {
  it('returns a callback function for consoles to use', () => {
    const updateCollections = (arr) => collections = arr;
    const callback = cancelCollectionFn({updateCollections, role: 'admin'});
    expect(callback).to.exist;
  });

  it('updates collections and filteredList on successful cancel', async() => {
    let collections = [{dars: { 1: {status: 'Open'}}}];
    const updatedCollection = {dars: {1: {status: 'Canceled'}}};
    const updateCollections = (collection) => collections = [collection];
    const callback = cancelCollectionFn({updateCollections});
    cy.stub(Collections, 'cancelCollection').returns(updatedCollection);
    cy.stub(Notifications, 'showSuccess').returns(undefined);
    cy.stub(Notifications, 'showError').returns(undefined);

    await callback({darCode: 'test', darCollectionId: 1});
    expect(collections).to.not.be.empty;
    expect(collections[0].dars[1].status).to.equal(updatedCollection.dars[1].status);
  });
});

describe('openCollectionFn', () => {
  it('returns a callback function for consoles to use', () => {
    const updateCollections = (arr) => collections = arr;
    const callback = openCollectionFn(updateCollections);
    expect(callback).to.exist;
  });

  it('updatesCollections on a successful open', async() => {
    const updatedCollection = { dars: { 1: { status: 'Open' } } };
    cy.stub(Collections, 'openElectionsById').returns(updatedCollection);
    let collections = [{dars: {1: {status: 'Canceled'}}}];
    const updateCollections = (collection) => collections = [collection];
    const callback = openCollectionFn({updateCollections});
    await callback({darCode: 'test', darCollectionId: 1});
    expect(collections[0].dars[1].status).to.equal(updatedCollection.dars[1].status);
  });
});