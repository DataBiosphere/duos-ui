import React from 'react';
import { mount } from 'cypress/react';
import MultiDatasetVoteSlab from 'src/components/collection_voting_slab/MultiDatasetVoteSlab';
import {Storage} from 'src/libs/storage';
import { Votes } from 'src/libs/ajax/Votes';
import { votingColors } from 'src/libs/VotingColors.ts'
import {ControlledAccessType} from 'src/libs/dataUseTranslation';

const openElection1 = {datasetId: 10, electionId: 101, status: 'Open', electionType: 'DataAccess'};

const openElection2 = {datasetId: 20, electionId: 102, status: 'Open', electionType: 'DataAccess'};

const closedElection = {datasetId: 30, electionId: 103, status: 'Closed', electionType: 'DataAccess'};

const votesForOpenElection1 = {
  dataAccess: {
    finalVotes: [
      {userId: 200, displayName: 'Sarah', vote: true, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1, electionStatus: 'Open'},
    ],
    chairpersonVotes: [
      {userId: 200, displayName: 'Sarah', vote: true, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1, electionStatus: 'Open'},
    ],
    memberVotes: [
      {userId: 100, displayName: 'Joe', rationale: 'test1', electionId: 101, voteId: 1, createDate: 1, electionStatus: 'Open'},
      {userId: 200, displayName: 'Sarah', vote: false, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1, electionStatus: 'Open'},
      {userId: 300, displayName: 'Matt', vote: true, electionId: 101, voteId: 3, createDate: 1, electionStatus: 'Open'}
    ]
  }
};

const votesForOpenElection2 = {
  dataAccess: {
    finalVotes: [
      {userId: 200, displayName: 'Sarah',  vote: true, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1, electionStatus: 'Open'},
    ],
    chairpersonVotes: [
      {userId: 200, displayName: 'Sarah',  vote: false, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1, electionStatus: 'Open'},
    ],
    memberVotes: [
      {userId: 100, displayName: 'Joe', rationale: 'test2', electionId: 102, voteId: 4, createDate: 2, electionStatus: 'Open'},
      {userId: 200, displayName: 'Sarah',  vote: false, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1, electionStatus: 'Open'},
      {userId: 300, displayName: 'Matt', vote: false, electionId: 102, voteId: 6, electionStatus: 'Open'}
    ]
  }
};

const votesForClosedElection = {
  dataAccess: {
    finalVotes: [
      {userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7, electionStatus: 'Closed'},
    ],
    chairpersonVotes: [
      {userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7, electionStatus: 'Closed'},
    ],
    memberVotes: [
      {userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7, electionStatus: 'Closed'},
      {userId: 300, displayName: 'Matt', vote: true, rationale: 'test3', electionId: 103, voteId: 8, electionStatus: 'Closed'}
    ]
  }
};

const collection = {
  darCollectionId: 638,
  darCode: 'DAR-705',
  createDate: 1750783085180,
  dars: {
    '77dc615b-08fb-42b1-8c43-3d48d13aaee0': {
      id: 1938,
      referenceId: '77dc615b-08fb-42b1-8c43-3d48d13aaee0',
      collectionId: 638,
      data: {
        referenceId: '77dc615b-08fb-42b1-8c43-3d48d13aaee0',
        projectTitle: 'Multi DAC Testing Part 2',
        rus: 'Multi DAC Testing Part 2',
        nonTechRus: 'Multi DAC Testing Part 2',
        datasetIds: [
          2170,
          1981
        ],
        anvilUse: true,
      },
      draft: false,
      progressReport: false,
      expired: false,
      expiresAt: 1782319085180,
      userId: 3351,
      createDate: 1750783027276,
      sortDate: 1750783085180,
      submissionDate: 1750783085180,
      updateDate: 1750783085180,
      datasetIds: [
        2170,
        1981
      ],
      eraCommonsId: 'eraCommonsId',
    },
    '1644d72e-9d85-4897-a52a-015387da2d52': {
      id: 1942,
      referenceId: '1644d72e-9d85-4897-a52a-015387da2d52',
      collectionId: 638,
      parentId: 1938,
      data: {
        referenceId: '1644d72e-9d85-4897-a52a-015387da2d52',
        projectTitle: 'Multi DAC Testing Part 2',
        rus: 'Multi DAC Testing Part 2',
        nonTechRus: 'Multi DAC Testing Part 2',
        hmb: true,
        datasetIds: [
          2170,
          1981
        ],
        progressReportSummary: 'Multi DAC Testing Part 2: PR Creation',
        anvilUse: true,
      },
      draft: false,
      progressReport: true,
      expired: false,
      expiresAt: 1782323548285,
      userId: 3351,
      createDate: 1750787548285,
      sortDate: 1750787548285,
      submissionDate: 1750787548285,
      updateDate: 1750787548285,
      datasetIds: [
        1981,
        2170
      ],
    },
    '5326fd77-84be-4f72-9743-ddbca1940a8c': {
      id: 2064,
      referenceId: '5326fd77-84be-4f72-9743-ddbca1940a8c',
      collectionId: 638,
      parentId: 1942,
      data: {
        referenceId: '5326fd77-84be-4f72-9743-ddbca1940a8c',
        projectTitle: 'Multi DAC Testing Part 2',
        rus: 'Multi DAC Testing Part 2',
        nonTechRus: 'Multi DAC Testing Part 2',
        hmb: true,
        datasetIds: [
          2170,
          1981
        ],
        progressReportSummary: 'DMI Testing',
        dmi: {
          incidents: [
            'dmiCombination',
            'dmiPublication',
            'dmiOther'
          ],
          description: 'DMI Testing'
        },
        anvilUse: true,
      },
      draft: false,
      progressReport: true,
      expired: false,
      expiresAt: 1784753184281,
      userId: 3351,
      createDate: 1753217184281,
      sortDate: 1753217184281,
      submissionDate: 1753217184281,
      updateDate: 1753217184281,
      datasetIds: [
        1981,
        2170
      ],
      eraCommonsId: 'eraCommonsId'
    }
  },
  datasets: [
    {
      datasetId: 2170,
      name: 'ANVIL_ccdg_asc_ndd_daly_talkowski_control_NIMH_asd_exome_20221201_ANV5_202304211741',
      datasetName: 'ANVIL_ccdg_asc_ndd_daly_talkowski_control_NIMH_asd_exome_20221201_ANV5_202304211741',
      createDate: 'Dec 14, 2023',
      createUserId: 5100,
      updateDate: 1702589568232,
      updateUserId: 3396,
      alias: 712,
      datasetIdentifier: 'DUOS-000712',
      dataUse: {
        generalUse: true,
      },
      dacId: 3,
      deletable: false,
      properties: [
        {
          propertyId: 10467,
          datasetId: 2170,
          propertyName: 'Access Management',
          propertyValue: 'controlled',
          schemaProperty: 'accessManagement',
          propertyType: 'String'
        },
      ],
      dacApproval: true,
      studyId: 5932,
      indexedDate: 1751050056779
    },
    {
      datasetId: 1981,
      name: 'consent group 1 disease specific',
      datasetName: 'consent group 1 disease specific',
      createDate: 'Nov 17, 2023',
      createUserId: 5101,
      updateDate: 1714390043729,
      updateUserId: 3351,
      alias: 688,
      datasetIdentifier: 'DUOS-000688',
      dataUse: {
        diseaseRestrictions: [
          'https://purl.obolibrary.org/obo/DOID_11249'
        ],
      },
      dacId: 4,
      deletable: false,
      properties: [
        {
          propertyId: 9340,
          datasetId: 1981,
          propertyName: 'Access Management',
          propertyValue: 'controlled',
          schemaProperty: 'accessManagement',
          propertyType: 'String'
        }
      ],
      dacApproval: true,
      studyId: 5856,
      indexedDate: 1753200001810
    }
  ]
};

describe('MultiDatasetVoteSlab - Tests', function() {
  it('Renders data use pills', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          dataUses: [
            {code: 'GRU', description: 'Use is permitted for any research purpose', type: ControlledAccessType.permissions},
            {code: 'HMB', description: 'Use is permitted for a health, medical, or biomedical research purpose', type: ControlledAccessType.permissions},
            {code: 'NCU', description: 'The dataset will be used in a study related to a commercial purpose.', type: ControlledAccessType.modifiers}
          ],
          elections: []
        }}
        collection={collection}
        dacDatasetIds={[10, 20]}
        isChair={true}
      />
    );

    cy.contains('GRU');
    cy.contains('Use is permitted for any research purpose');
    cy.contains('HMB');
    cy.contains('Use is permitted for a health, medical, or biomedical research purpose');
    cy.contains(ControlledAccessType.modifiers);
    cy.contains('NCU');
    cy.contains('The dataset will be used in a study related to a commercial purpose.');
  });

  it('Renders a selected vote button when all current user votes match (Member)', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        collection={collection}
        dacDatasetIds={[10, 20]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.no);
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('textarea').should('not.be.disabled');
  });

  it('Replaces vote buttons with vote result text when all current user votes match (Chair)', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1],
          votes: [votesForOpenElection1]
        }}
        collection={collection}
        dacDatasetIds={[10]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'YES');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });

  it('Renders vote button unselected when not all current user votes match (Member)', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        collection={collection}
        dacDatasetIds={[10, 20]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('textarea').should('not.be.disabled');
  });

  it('Renders vote button unselected when not all current user votes match (Chair)', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        collection={collection}
        dacDatasetIds={[10, 20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('textarea').should('not.be.disabled');
    cy.get('[datacy=no-collection-vote-button]').click();
    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NO');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });

  it('Renders NOT SELECTED vote result text if no votes for current user in bucket', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [closedElection],
          votes: [votesForClosedElection]
        }}
        collection={collection}
        dacDatasetIds={[30]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NOT SELECTED');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });

  it('Renders vote button if any election is open', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection2, closedElection],
          votes: [votesForOpenElection2, votesForClosedElection]
        }}
        collection={collection}
        dacDatasetIds={[20, 30]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.no);
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('textarea').should('not.be.disabled');
  });

  it('Replaces vote buttons with vote result text when readOnly is true', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        collection={collection}
        dacDatasetIds={[10, 20]}
        isChair={false}
        readOnly={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NO');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });

  it('Does not render pie chart or vote summary table when current user is not chairperson', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [closedElection],
          votes: [votesForClosedElection]
        }}
        collection={collection}
        dacDatasetIds={[30]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});

    cy.get('[data-cy=chair-vote-info]').should('not.exist');
  });

  it('Does not render pie chart or table when current user is chairperson but no votes for dac in this bucket', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [closedElection],
          votes: [votesForClosedElection]
        }}
        collection={collection}
        dacDatasetIds={[30]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('[data-cy=chair-vote-info]').should('not.exist');
  });

  it('Renders a pie chart with votes for dac of user when current user is chairperson', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [closedElection],
          votes: [votesForClosedElection]
        }}
        collection={collection}
        dacDatasetIds={[30]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});

    cy.get('[data-cy=chair-vote-info]').should('exist');
  });

  it('Does not render rows of vote summary table for votes outside of dac for current user', function() {
    // workaround so that notifications don't overlap the clicked buttons and cause an error
    cy.viewport(1024, 768);
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, closedElection],
          votes: [votesForOpenElection2, votesForClosedElection]
        }}
        collection={collection}
        dacDatasetIds={[10, 30]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data')
        .should('exist')
        .should('contain', 'test1')
        .should('contain', 'test2')
        .should('not.contain', 'test3');
  });

  it('Renders collapsed row of vote summary table when the same user has same vote for multiple elections', function() {
    // workaround so that notifications don't overlap the clicked buttons and cause an error
    cy.viewport(1024, 768);
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection2, votesForOpenElection2]
        }}
        collection={collection}
        dacDatasetIds={[10, 20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-1').should('contain.text', 'Sarah').should('contain.text', 'test1');
  });

  it('Renders collapsed row with appended rationales when the same user has same vote but different rationales for multiple elections', function() {
    cy.viewport(1024, 768);
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        collection={collection}
        dacDatasetIds={[10, 20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', 'test1\ntest2');
  });

  it('Does not append rationale values when properties are undefined', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection2, closedElection],
          votes: [votesForOpenElection2, votesForClosedElection]
        }}
        collection={collection}
        dacDatasetIds={[10, 30]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist').should('not.contain', 'undefined');
    cy.get('.row-data-1').should('contain.text', 'Sarah').should('contain.text', 'test1');
  });

  it('Renders separate row with when the same user has different vote for multiple elections', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        collection={collection}
        dacDatasetIds={[10, 20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', 'No');
    cy.get('.row-data-3').should('contain.text', 'Matt').should('contain.text', 'Yes');
  });


  it('Renders filler text when some fields of vote are empty', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection2],
          votes: [votesForOpenElection2]
        }}
        collection={collection}
        dacDatasetIds={[20]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', '- -');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', '- -');
  });

  it('Renders send reminder button when user is chair and no vote', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection2],
          votes: [votesForOpenElection2]
        }}
        collection={collection}
        dacDatasetIds={[20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', 'Send Reminder');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', '- -');
  });

  it('Renders the algorithm decision when the latest dar does not have a DMI', function() {
    // The first dar in the list is the original parent DAR, which does not have a DMI.
    const newDar = Object.values(collection.dars).shift();
    const collectionWithoutDMI = {...collection, dars: {[newDar.referenceId]: newDar}};
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection2],
          votes: [votesForOpenElection2],
          algorithmResult: {
            createDate: new Date(),
            id: 1,
            result: 'Yes',
            rationales: [],
          }
        }}
        collection={collectionWithoutDMI}
        dacDatasetIds={[20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});
    cy.get('[data-cy="collection-algorithm-decision"]').should('exist');
  });

  it('Does not render the algorithm decision when the latest dar has a DMI', function() {
    // The first dar in the list is the original parent DAR, which does not have a DMI.
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection2],
          votes: [votesForOpenElection2],
          algorithmResult: {
            createDate: new Date(),
            id: 1,
            result: 'Yes',
            rationales: [],
          }
        }}
        collection={collection}
        dacDatasetIds={[20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});
    cy.get('[data-cy="collection-algorithm-decision"]').should('not.exist');
  });

});
