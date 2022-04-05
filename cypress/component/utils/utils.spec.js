/* eslint-disable no-undef */
import { getSearchFilterFunctions, formatDate } from '../../../src/libs/utils';
import { cloneDeep } from 'lodash/fp';
import { forEach } from 'lodash';

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
          institution: "broad institute",
          projectTitle: "Project: test",
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
  it('filters succssfully with missing institution, project title, elections, datasets, dar, and institution', () => {
    const filteredList = collectionSearchFn("DAR-2", collectionsSkeleton);
    expect(filteredList).to.be.empty;
  });

  it('filters on status with elections present', () => {
    const filteredList = collectionSearchFn("open", collectionsWithElection);
    expect(filteredList).to.not.be.empty;
    const emptyFilteredList = collectionSearchFn('closed', collectionsWithElection);
    expect(emptyFilteredList).to.be.empty;
  });

  it(`filters on status with datasets present`, () => {
    const collectionsWithDatasets = cloneDeep(collectionsSkeleton);
    collectionsWithDatasets[0].datasets = [{1: {}}];
    const filteredList = collectionSearchFn("1", collectionsWithDatasets);
    expect(filteredList).to.not.be.empty;
    const emptyList = collectionSearchFn("4", collectionsWithDatasets);
    expect(emptyList).to.be.empty;
  });

  it('filters on projectTitle', () => {
    const filteredList = collectionSearchFn("project", collectionsWithProjectTitleAndInstitution);
    expect(filteredList).to.not.be.empty;
    const emptyList = collectionSearchFn("invalid", collectionsWithProjectTitleAndInstitution);
    expect(emptyList).to.be.empty;
  });

  it('filters on institution', () => {
    const institutionTerm = Object.values(collectionsWithProjectTitleAndInstitution[0].dars)[0].data.institution;
    const filteredList = collectionSearchFn(institutionTerm, collectionsWithProjectTitleAndInstitution);
    expect(filteredList).to.not.be.empty;
    const emptyList = collectionSearchFn("invalid", collectionsWithProjectTitleAndInstitution);
    expect(emptyList).to.be.empty;
  });

  it('filters on dar code', () => {
    const darTerm = 'dar-1';
    const collectionsWithDarCode = cloneDeep(collectionsSkeleton);
    collectionsWithDarCode[0].darCode = 'DAR-1';
    const filteredList = collectionSearchFn(darTerm, collectionsWithDarCode);
    expect(filteredList).to.not.be.empty;
    const emptyList = collectionSearchFn("invalid", collectionsWithDarCode);
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