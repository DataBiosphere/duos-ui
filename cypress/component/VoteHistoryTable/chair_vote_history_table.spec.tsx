import { mount } from 'cypress/react';
import ChairVoteHistoryTable from 'src/components/vote_history_table/ChairVoteHistoryTable';
import { VoteHistoryRow } from 'src/types/model';

describe('ChairVoteHistoryTable Component - Tests', () => {
    const testData: VoteHistoryRow[] = [
        {
            voteId: 1,
            userId: 101,
            createDate: '2023-01-03',
            electionId: 201,
            displayName: 'Alice Johnson',
            type: 'Chair',
            darTitle: 'DAR Title 1',
            progressReport: true,
            electionDate: '2023-01-03',
            vote: true,
            updateDate: '2023-01-04',
            rationale: 'Approved',
        },
        {
            voteId: 2,
            userId: 102,
            createDate: '2023-01-01',
            electionId: 202,
            displayName: 'Bob Smith',
            type: 'Chair',
            darTitle: 'DAR Title 2',
            progressReport: false,
            electionDate: '2023-01-01',
            vote: false,
            updateDate: '2023-01-02',
            rationale: 'Rejected',
        },
        {
            voteId: 3,
            userId: 103,
            createDate: '2023-01-02',
            electionId: 203,
            displayName: 'Charlie Brown',
            type: 'Chair',
            darTitle: 'DAR Title 3',
            progressReport: true,
            electionDate: '2023-01-02',
            vote: false,
            updateDate: '2023-01-03',
        },
    ];

    it('should render the table with specific headers', () => {
        mount(<ChairVoteHistoryTable voteHistory={testData} />);
        cy.get('.column-header').should('have.length', 8);
            cy.get(':nth-child(1) > .cell-sort').contains('Request Type');
            cy.get(':nth-child(2) > .cell-sort').contains('DAR Title');
            cy.get(':nth-child(3) > .cell-sort').contains('Election Date');
            cy.get(':nth-child(4) > .cell-sort').contains('Vote');
            cy.get(':nth-child(5) > .cell-sort').contains('Name');
            cy.get(':nth-child(6) > .cell-sort').contains('Vote Date');
            cy.get(':nth-child(7) > .cell-sort').contains('Vote Type');
            cy.get(':nth-child(8) > .cell-sort').contains('Rationale');
    });

    it('should render rows with correct default sort (by election date descending)', () => {
        mount(<ChairVoteHistoryTable voteHistory={testData} />);
        cy.get('.row-data-0 > :nth-child(1)').contains('Progress Report');
        cy.get('.row-data-0 > :nth-child(2)').contains('DAR Title 1');
        cy.get('.row-data-0 > :nth-child(3)').contains('2023-01-03');
        cy.get('.row-data-0 > :nth-child(4)').contains('Yes');
        cy.get('.row-data-0 > :nth-child(5)').contains('Alice Johnson');
        cy.get('.row-data-0 > :nth-child(6)').contains('2023-01-04');
        cy.get('.row-data-0 > :nth-child(7)').contains('Chair');
        cy.get('.row-data-0 > :nth-child(8)').contains('Approved');

        cy.get('.row-data-1 > :nth-child(1)').contains('Progress Report');
        cy.get('.row-data-1 > :nth-child(2)').contains('DAR Title 3');
        cy.get('.row-data-1 > :nth-child(3)').contains('2023-01-02');
        cy.get('.row-data-1 > :nth-child(4)').contains('No');
        cy.get('.row-data-1 > :nth-child(5)').contains('Charlie Brown');
        cy.get('.row-data-1 > :nth-child(6)').contains('2023-01-03');
        cy.get('.row-data-1 > :nth-child(7)').contains('Chair');
        cy.get('.row-data-1 > :nth-child(8)').contains('--');

        cy.get('.row-data-2 > :nth-child(1)').contains('Initial Dar');
        cy.get('.row-data-2 > :nth-child(2)').contains('DAR Title 2');
        cy.get('.row-data-2 > :nth-child(3)').contains('2023-01-01');
        cy.get('.row-data-2 > :nth-child(4)').contains('No');
        cy.get('.row-data-2 > :nth-child(5)').contains('Bob Smith');
        cy.get('.row-data-2 > :nth-child(6)').contains('2023-01-02');
        cy.get('.row-data-2 > :nth-child(7)').contains('Chair');
        cy.get('.row-data-2 > :nth-child(8)').contains('Rejected');
    });
});