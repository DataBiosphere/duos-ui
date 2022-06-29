/* eslint-disable no-undef */
import {getSearchFilterFunctions, formatDate, darCollectionUtils, processElectionStatus} from '../../../src/libs/utils';
import {cloneDeep, toLower} from 'lodash/fp';
import { forEach } from 'lodash';
const { determineCollectionStatus } = darCollectionUtils;

const collectionsSkeleton = [
  {
    dars: {
      1: {
        data: {
          institution: undefined,
          projectTitle: undefined
        }
      }
    },
    darCode: undefined
  }
];

const collectionWithMixedElectionStatuses = {
  dars: {
    0: {
      elections: {
        0: {
          status: 'Closed',
          electionType: 'DataAccess',
          dataSetId: 100
        }
      }
    },
    1: {
      elections: {
        1: {
          status: 'Open',
          electionType: 'DataAccess',
          dataSetId: 200,
          votes: {0: {type: 'DAC'}}
        }
      }
    }
  }
};

const collectionWithSameElectionStatus = {
  dars: {
    0: {
      elections: {
        0: {
          status: 'Closed',
          electionType: 'DataAccess',
          dataSetId: 100
        }
      }
    },
    1: {
      elections: {
        1: {
          status: 'Closed',
          electionType: 'DataAccess',
          dataSetId: 200
        }
      }
    }
  }
};

const collectionsWithElection = [
  {
    dars: {
      1: {
        data: {
          institution: undefined,
          projectTitle: undefined,
        },
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
      }
    },
    datasets: [],
    darCode: 'DAR-1'
  }
];

const collectionsWithProjectTitleAndInstitution = [
  {
    dars: {
      1: {
        data: {
          institution: 'broad institute',
          projectTitle: 'Project: test',
        },
        elections: {
          1: {
            status: 'Open',
            electionType: 'DataAccess',
          },
          2: {
            status: 'Open',
            electionType: 'RP',
          },
        },
      },
    },
    datasets: [],
    darCode: 'DAR-1',
  },
];

const sampleLCList = [
  {
    userName: 'Test Person',
    createDate: 1649163460401,
    updateDate: 1649163480401,
    institution: {
      name: 'First Institution',
    },
    userEmail: 'devemail',
    eraCommonsId: 'commons',
  },
  {
    userName: 'another person',
    createDate: 1629163460401,
    updateDate: 1639163480801,
    institution: {
      name: 'Second Institution',
    },
    userEmail: 'prodemail',
    eraCommonsId: 'era',
  },
];

const sampleResearcherList = [
  {
    displayName: 'Test Person',
    eraCommonsId: 'era',
    email: 'devemail',
    roles: [{
      name : 'admin'
    }]
  },
  {
    displayName: 'Another person',
    eraCommonsId: 'commons',
    email: 'prodemail',
    roles: [{
      name: 'researcher'
    }]
  }
];

let collectionSearchFn, cardSearchFn, researcherSearchFn;

beforeEach(() => {
  const searchFunctionsMap = getSearchFilterFunctions();
  collectionSearchFn = searchFunctionsMap.darCollections;
  cardSearchFn = searchFunctionsMap.libraryCard;
  researcherSearchFn = searchFunctionsMap.signingOfficialResearchers;
});

describe('Dar Collection Search Filter', () => {
  it('filters successfully with missing institution, project title, elections, datasets, dar, and institution', () => {
    const filteredList = collectionSearchFn('DAR-2', collectionsSkeleton);
    expect(filteredList).to.be.empty;
  });

  it('filters on status with elections present', () => {
    const filteredList = collectionSearchFn('open', collectionsWithElection);
    expect(filteredList).to.not.be.empty;
    const emptyFilteredList = collectionSearchFn('closed', collectionsWithElection);
    expect(emptyFilteredList).to.be.empty;
  });

  it('filters on status with datasets present', () => {
    const collectionsWithDatasets = cloneDeep(collectionsSkeleton);
    collectionsWithDatasets[0].datasets = [{1: {}}];
    const filteredList = collectionSearchFn('1', collectionsWithDatasets);
    expect(filteredList).to.not.be.empty;
    const emptyList = collectionSearchFn('4', collectionsWithDatasets);
    expect(emptyList).to.be.empty;
  });

  it('filters on projectTitle', () => {
    const filteredList = collectionSearchFn('project', collectionsWithProjectTitleAndInstitution);
    expect(filteredList).to.not.be.empty;
    const emptyList = collectionSearchFn('invalid', collectionsWithProjectTitleAndInstitution);
    expect(emptyList).to.be.empty;
  });

  it('filters on institution', () => {
    const institutionTerm = Object.values(collectionsWithProjectTitleAndInstitution[0].dars)[0].data.institution;
    const filteredList = collectionSearchFn(institutionTerm, collectionsWithProjectTitleAndInstitution);
    expect(filteredList).to.not.be.empty;
    const emptyList = collectionSearchFn('invalid', collectionsWithProjectTitleAndInstitution);
    expect(emptyList).to.be.empty;
  });

  it('filters on dar code', () => {
    const darTerm = 'dar-1';
    const collectionsWithDarCode = cloneDeep(collectionsSkeleton);
    collectionsWithDarCode[0].darCode = 'DAR-1';
    const filteredList = collectionSearchFn(darTerm, collectionsWithDarCode);
    expect(filteredList).to.not.be.empty;
    const emptyList = collectionSearchFn('invalid', collectionsWithDarCode);
    expect(emptyList).to.be.empty;
  });

  it('filters on create date', () => {
    const createDate = '2020-04-05';
    const collectionsWithCreateDate = cloneDeep(collectionsSkeleton);
    collectionsWithCreateDate[0].createDate = createDate;
    const filteredList = collectionSearchFn('2020-04', collectionsWithCreateDate);
    expect(filteredList).to.not.be.empty;
    const emptyList = collectionSearchFn('invalid', collectionsWithCreateDate);
    expect(emptyList).to.be.empty;
  });

  it('filters on researcher name', () => {
    const researcherName = 'Name';
    const collectionsWithResearcherName = cloneDeep(collectionsSkeleton);
    collectionsWithResearcherName[0].createUser.displayName = researcherName;
    const filteredList = collectionSearchFn('name', collectionsWithResearcherName);
    expect(filteredList).to.not.be.empty;
    const emptyList = collectionSearchFn('invalid', collectionsWithResearcherName);
    expect(emptyList).to.be.empty;
  });
});

describe('LC Serch Filter', () => {
  it('filters cards on create date', () => {
    let filteredList;
    const originalCard = sampleLCList[0];
    filteredList = cardSearchFn('', sampleLCList);
    expect(filteredList.length).equals(sampleLCList.length);

    const term = formatDate(originalCard.createDate);
    filteredList = cardSearchFn(term, sampleLCList);
    expect(filteredList.length).equals(1);
    const filteredCard = filteredList[0];
    forEach(originalCard,(value, key) => {
      expect(filteredCard[key]).equals(value);
    });
  });

  it('filters cards on update date', () => {
    let filteredList;
    const originalCard = sampleLCList[0];
    filteredList = cardSearchFn('', sampleLCList);
    expect(filteredList.length).equals(sampleLCList.length);

    const term = formatDate(originalCard.updateDate);
    filteredList = cardSearchFn(term, sampleLCList);
    expect(filteredList.length).equals(1);
    const filteredCard = filteredList[0];
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key]).equals(value);
    });
  });

  it('filters on user email', () => {
    let filteredList;
    const originalCard = sampleLCList[0];
    filteredList = cardSearchFn('', sampleLCList);
    expect(filteredList.length).equals(sampleLCList.length);

    const term = 'test';
    filteredList = cardSearchFn(term, sampleLCList);
    expect(filteredList.length).equals(1);
    const filteredCard = filteredList[0];
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key]).equals(value);
    });
  });

  it('filters on user institution', () => {
    let filteredList;
    const originalCard = sampleLCList[0];
    filteredList = cardSearchFn('', sampleLCList);
    expect(filteredList.length).equals(sampleLCList.length);

    const term = 'first';
    filteredList = cardSearchFn(term, sampleLCList);
    expect(filteredList.length).equals(1);
    const filteredCard = filteredList[0];
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key]).equals(value);
    });
  });

  it('filters on user email', () => {
    let filteredList;
    const originalCard = sampleLCList[0];
    filteredList = cardSearchFn('', sampleLCList);
    expect(filteredList.length).equals(sampleLCList.length);

    const term = 'dev';
    filteredList = cardSearchFn(term, sampleLCList);
    expect(filteredList.length).equals(1);
    const filteredCard = filteredList[0];
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key]).equals(value);
    });
  });

  it('filters on eraCommonsId', () => {
    let filteredList;
    const originalCard = sampleLCList[0];
    filteredList = cardSearchFn('', sampleLCList);
    expect(filteredList.length).equals(sampleLCList.length);

    const term = 'commons';
    filteredList = cardSearchFn(term, sampleLCList);
    expect(filteredList.length).equals(1);
    const filteredCard = filteredList[0];
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key]).equals(value);
    });
  });
});

describe('Researcher Search Filter (SO Console)', () => {
  it('filters on researcher name', () => {
    let filteredList;
    filteredList = researcherSearchFn('', sampleResearcherList);
    expect(filteredList.length).equals(sampleResearcherList.length);

    const originalResearcher = sampleResearcherList[0];
    const term = 'test';
    filteredList = researcherSearchFn(term, sampleResearcherList);
    expect(filteredList.length).equals(1);

    const filteredResearcher = filteredList[0];
    forEach(originalResearcher, (value, key) => {
      expect(filteredResearcher[key]).equals(value);
    });
  });

  it('filters on eraCommonsId', () => {
    let filteredList;
    filteredList = researcherSearchFn('', sampleResearcherList);
    expect(filteredList.length).equals(sampleResearcherList.length);

    const originalResearcher = sampleResearcherList[0];
    const term = 'era';
    filteredList = researcherSearchFn(term, sampleResearcherList);
    expect(filteredList.length).equals(1);

    const filteredResearcher = filteredList[0];
    forEach(originalResearcher, (value, key) => {
      expect(filteredResearcher[key]).equals(value);
    });
  });

  it('filters on email', () => {
    let filteredList;
    filteredList = researcherSearchFn('', sampleResearcherList);
    expect(filteredList.length).equals(sampleResearcherList.length);

    const originalResearcher = sampleResearcherList[0];
    const term = 'devemail';
    filteredList = researcherSearchFn(term, sampleResearcherList);
    expect(filteredList.length).equals(1);

    const filteredResearcher = filteredList[0];
    forEach(originalResearcher, (value, key) => {
      expect(filteredResearcher[key]).equals(value);
    });
  });

  it('filters on eraCommonsId', () => {
    let filteredList;
    filteredList = researcherSearchFn('', sampleResearcherList);
    expect(filteredList.length).equals(sampleResearcherList.length);

    const originalResearcher = sampleResearcherList[0];
    const term = 'era';
    filteredList = researcherSearchFn(term, sampleResearcherList);
    expect(filteredList.length).equals(1);

    const filteredResearcher = filteredList[0];
    forEach(originalResearcher, (value, key) => {
      expect(filteredResearcher[key]).equals(value);
    });
  });

  it('filters on role name', () => {
    let filteredList;
    filteredList = researcherSearchFn('', sampleResearcherList);
    expect(filteredList.length).equals(sampleResearcherList.length);

    const originalResearcher = sampleResearcherList[0];
    const term = 'admin';
    filteredList = researcherSearchFn(term, sampleResearcherList);
    expect(filteredList.length).equals(1);

    const filteredResearcher = filteredList[0];
    forEach(originalResearcher, (value, key) => {
      expect(filteredResearcher[key]).equals(value);
    });
  });
});

describe('Dar Collection determineCollectionStatus', () => {
  it('Returns an Unreviewed status when there are no elections but the collection contains relevant datasets', () => {
    const collection = {
      dars: {
        0: {data: {datasetIds: [100]}}
      }
    };
    const relevantDatasets = [{dataSetId: 100}];
    const status = determineCollectionStatus(collection, relevantDatasets);
    expect(toLower(status)).equals('unreviewed');
  });

  it('Returns empty string when there are no elections and the collection does not contains relevant datasets', () => {
    const collection = {
      dars: {
        0: {data: {datasetIds: [100]}}
      }
    };
    const status = determineCollectionStatus(collection);
    expect(toLower(status)).equals('');
  });

  it('Filters out RP elections when determining collection status and relevant datasets is null', () => {
    const collection = {
      dars: {
        0: {
          elections: {
            0: {
              status: 'Closed',
              electionType: 'DataAccess',
              dataSetId: 100
            },
            1: {
              status: 'Open',
              electionType: 'RP',
              dataSetId: 100
            },
          }
        }
      }
    };
    const status = determineCollectionStatus(collection);
    expect(toLower(status)).equals('closed: 1');
  });

  it('Filters out RP elections when determining collection status and relevant datasets is non-null', () => {
    const collection = {
      dars: {
        0: {
          elections: {
            0: {
              status: 'Closed',
              electionType: 'DataAccess',
              dataSetId: 100
            },
            1: {
              status: 'Open',
              electionType: 'RP',
              dataSetId: 100
            },
          }
        }
      }
    };
    const relevantDatasets = [{dataSetId: 100}, {dataSetId: 200}];
    const status = determineCollectionStatus(collection, relevantDatasets);
    expect(toLower(status)).equals('denied');
  });

  it('Only considers DARs for relevant datasets when determining collection status', () => {
    const relevantDatasets = [{dataSetId: 100}];
    const status = determineCollectionStatus(collectionWithMixedElectionStatuses, relevantDatasets);
    expect(toLower(status)).equals('denied');
  });

  it('Does not limit DARs used to determine collection status when relevant datasets is null', () => {
    const status = determineCollectionStatus(collectionWithMixedElectionStatuses);
    expect(toLower(status)).equals('closed: 1\nopen: 1');
  });

  it('Increases status count when relevant datasets is null and multiple elections have the same status', () => {
    const status = determineCollectionStatus(collectionWithSameElectionStatus);
    expect(toLower(status)).equals('closed: 2');
  });

  it('Appends together statuses when relevant datasets is non-null and elections have different statuses', () => {
    const relevantDatasets = [{dataSetId: 100}, {dataSetId: 200}];
    const status = determineCollectionStatus(collectionWithMixedElectionStatuses, relevantDatasets);
    expect(toLower(status)).equals('denied, open');
  });

  it('Only returns unique statuses when relevant datasets is non-null and multiple elections have the same status', () => {
    const relevantDatasets = [{dataSetId: 100}, {dataSetId: 200}];
    const status = determineCollectionStatus(collectionWithSameElectionStatus, relevantDatasets);
    expect(toLower(status)).equals('denied');
  });
});

describe('processElectionStatus utils - tests', () => {
  it('Returns Unreviewed when election has a null status', () => {
    const election = {status: null};
    const status = processElectionStatus(election, null, false);
    expect(toLower(status)).equals('unreviewed');
  });

  it('Returns Approved when election is closed and has an approving final vote', () => {
    const election = {
      status: 'Closed'
    };
    const votes = [
      {
        type: 'FINAL',
        vote: true
      }
    ];
    const status = processElectionStatus(election, votes, false);
    expect(toLower(status)).equals('approved');
  });

  it('Returns Approved when election is final and has an approving final vote', () => {
    const election = {
      status: 'Final'
    };
    const votes = [
      {
        type: 'FINAL',
        vote: true
      }
    ];
    const status = processElectionStatus(election, votes, false);
    expect(toLower(status)).equals('approved');
  });

  it('Returns Denied when election is closed and there are no approving final votes', () => {
    const election = {
      status: 'Closed'
    };
    const votes = [
      {
        type: 'DAC',
        vote: true
      },
      {
        type: 'FINAL',
        vote: false
      }
    ];
    const status = processElectionStatus(election, votes, false);
    expect(toLower(status)).equals('denied');
  });
  it('Returns Denied when election is final and there are no approving final votes', () => {
    const election = {
      status: 'Final'
    };
    const votes = [
      {
        type: 'DAC',
        vote: true
      },
      {
        type: 'FINAL',
        vote: false
      }
    ];
    const status = processElectionStatus(election, votes, false);
    expect(toLower(status)).equals('denied');
  });

  it('Returns Open when election is open and contains votes', () => {
    const election = {
      status: 'Open',
      electionId: 1
    };
    const votes = [
      {
        type: 'DAC',
        electionId: 1
      }
    ];
    const status = processElectionStatus(election, votes, false);
    expect(toLower(status)).equals('open');
  });

  it('Returns Open with vote counts when election is open, contains votes, and showVotes is true', () => {
    const election = {
      status: 'Open',
      electionId: 1
    };
    const votes = [
      {
        type: 'DAC',
        electionId: 1
      },
      {
        type: 'DAC',
        vote: false,
        createDate: 1651241829000,
        electionId: 1
      }
    ];
    const status = processElectionStatus(election, votes, true);
    expect(toLower(status)).equals('open(1 / 2 votes)');
  });

  it('Vote counts for open election only considers DAC votes with electionId that matches the election', () => {
    const election = {
      status: 'Open',
      electionId: 1
    };
    const votes = [
      {
        type: 'FINAL',
        vote: true,
        createDate: 1651241829000,
        electionId: 1
      },
      {
        type: 'DAC',
        vote: true,
        createDate: 1651241829000,
        electionId: 2
      }
    ];
    const status = processElectionStatus(election, votes, true);
    expect(toLower(status)).equals('open(0 / 0 votes)');
  });
});