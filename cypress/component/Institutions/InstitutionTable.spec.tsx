import React from 'react';
import {mount} from 'cypress/react';
import InstitutionTable, {InstitutionTableProps} from 'src/components/institution_table/InstitutionTable';
import {DuosUser, Institution} from 'src/types/model';
import {BrowserRouter} from 'react-router-dom';

const createUser: DuosUser = {
  createDate: new Date(),
  displayName: 'Create User',
  email: 'create@test.com',
  emailPreference: true,
  eraCommonsId: 'admin-user',
  isAdmin: true,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [{
    roleId: 4,
    name: 'Admin',
    userId: 1,
    userRoleId: 1,
  }],
  userId: 1
};

const updateUser: DuosUser = {
  createDate: new Date(),
  displayName: 'Update User',
  email: 'update@test.com',
  emailPreference: true,
  eraCommonsId: 'update-user',
  isAdmin: true,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [{
    roleId: 4,
    name: 'Admin',
    userId: 2,
    userRoleId: 2,
  }],
  userId: 2
};

export const mockInstitutions = [
  {
    id: 1,
    name: 'Test Institution 1',
    domains: ['test1.edu'],
    signingOfficials: [{userId: '1', displayName: 'User 1', email: 'email1'}],
    createDate: 'Feb 1, 2023',
    createUser: createUser,
    createUserId: createUser.userId,
  } as unknown as Institution,
  {
    id: 2,
    name: 'Test Institution 2',
    domains: ['test2.edu'],
    signingOfficials: [{userId: '2', displayName: 'User 2', email: 'email2'}],
    createDate: 'Jul 1, 2025',
    createUser: createUser,
    createUserId: createUser.userId,
    updateDate: 'Jul 2, 2025',
    updateUser: updateUser,
    updateUserId: updateUser.userId,
  } as unknown as Institution,
];

const defaultProps = {
  filteredList: mockInstitutions,
  currentPage: 1,
  setCurrentPage: (page: number) => {console.log(`Set current page to ${page}`);},
  tableSize: 10,
  setTableSize: (size: number) => {console.log(`Set table size to ${size}`);},
} as InstitutionTableProps;


describe('InstitutionTable', () => {
  beforeEach(() => {
    cy.viewport(1400, 600);
    cy.initApplicationConfig();
  });

  it('renders', () => {
    mount(
        <BrowserRouter>
          <InstitutionTable
              filteredList={defaultProps.filteredList}
              currentPage={defaultProps.currentPage}
              setCurrentPage={defaultProps.setCurrentPage}
              tableSize={defaultProps.tableSize}
              setTableSize={defaultProps.setTableSize}/>
        </BrowserRouter>
    );
    cy.get('[data-cy="institution-table"]').should('exist');
  });

  it('displays paginated institution rows', () => {
    // Set the page count to 1 so only the first institution is displayed
    mount(
        <BrowserRouter>
          <InstitutionTable
              filteredList={defaultProps.filteredList}
              currentPage={defaultProps.currentPage}
              setCurrentPage={defaultProps.setCurrentPage}
              tableSize={1}
              setTableSize={defaultProps.setTableSize}/>
        </BrowserRouter>
    );
    cy.get('[data-cy="institution-table"]').should('exist');
    cy.get('[data-cy="institution-table"]').should('contain', mockInstitutions[0].name);
    cy.get('[data-cy="institution-table"]').should('not.contain', mockInstitutions[1].name);
  });

  it('links to the update institution page', () => {
    mount(
        <BrowserRouter>
          <InstitutionTable
              filteredList={defaultProps.filteredList}
              currentPage={defaultProps.currentPage}
              setCurrentPage={defaultProps.setCurrentPage}
              tableSize={defaultProps.tableSize}
              setTableSize={defaultProps.setTableSize}/>
        </BrowserRouter>
    );
    cy.get('a').each((link) => {
      const href = link.prop('href').toString();
      expect(href).to.match(/\/admin_manage_institutions\/institutions\/([12])/);
    });
  });
});
