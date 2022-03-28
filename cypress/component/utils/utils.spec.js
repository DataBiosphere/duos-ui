/* eslint-disable no-undef */
import { getSearchFilterFunctions } from '../../../src/libs/utils';
import { cloneDeep } from 'lodash/fp';

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

let searchFn;

beforeEach(() => {
  searchFn = getSearchFilterFunctions().darCollections;
});

describe('Dar Collection Search Filter', () => {
  it('filters succssfully with missing institution, project title, elections, datasets, dar, and institution', () => {
    const filteredList = searchFn("DAR-2", collectionsSkeleton);
    expect(filteredList).to.be.empty;
  });

  it('filters on status with elections present', () => {
    const filteredList = searchFn("open", collectionsWithElection);
    expect(filteredList).to.not.be.empty;
    const emptyFilteredList = searchFn('closed', collectionsWithElection);
    expect(emptyFilteredList).to.be.empty;
  });

  it(`filters on status with datasets present`, () => {
    const collectionsWithDatasets = cloneDeep(collectionsSkeleton);
    collectionsWithDatasets[0].datasets = [{1: {}}];
    const filteredList = searchFn("1", collectionsWithDatasets);
    expect(filteredList).to.not.be.empty;
    const emptyList = searchFn("4", collectionsWithDatasets);
    expect(emptyList).to.be.empty;
  });

  it('filters on projectTitle', () => {
    const filteredList = searchFn("project", collectionsWithProjectTitleAndInstitution);
    expect(filteredList).to.not.be.empty;
    const emptyList = searchFn("invalid", collectionsWithProjectTitleAndInstitution);
    expect(emptyList).to.be.empty;
  });

  it('filters on institution', () => {
    const institutionTerm = Object.values(collectionsWithProjectTitleAndInstitution[0].dars)[0].data.institution;
    const filteredList = searchFn(institutionTerm, collectionsWithProjectTitleAndInstitution);
    expect(filteredList).to.not.be.empty;
    const emptyList = searchFn("invalid", collectionsWithProjectTitleAndInstitution);
    expect(emptyList).to.be.empty;
  });

  it('filters on dar code', () => {
    const darTerm = 'dar-1';
    const collectionsWithDarCode = cloneDeep(collectionsSkeleton);
    collectionsWithDarCode[0].darCode = 'DAR-1';
    const filteredList = searchFn(darTerm, collectionsWithDarCode);
    expect(filteredList).to.not.be.empty;
    const emptyList = searchFn("invalid", collectionsWithDarCode);
    expect(emptyList).to.be.empty;
  });

  it('filters on create date', () => {
    const createDate = '2020-04-05';
    const collectionsWithCreateDate = cloneDeep(collectionsSkeleton);
    collectionsWithCreateDate[0].createDate = createDate;
    const filteredList = searchFn('2020-04', collectionsWithCreateDate);
    expect(filteredList).to.not.be.empty;
    const emptyList = searchFn('invalid', collectionsWithCreateDate);
    expect(emptyList).to.be.empty;
  });
});