import HighlightText from '../../src/components/HighlightText';
import { mount } from 'cypress/react';

describe('HighlightText - Tests', function() {
  it('Renders text with no highlighting if no matches', function() {
    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

    mount(
      <HighlightText
        highlight={[
          {
            bgColor: 'black',
            textColor: 'black',
            words: ['unrelated', 'unused', 'words'],
          }
        ]}
        text={lorem}
      />
    );
    // first highlight chunk is entire text
    cy.get('[data-cy="highlight-0"]').contains(lorem);
    // no further chunks
    cy.get('[data-cy="highlight-1"]').should('not.exist');
  });

  it('Highlights with the correct color, irrelevant of casing.', function() {
    const text = (
      'The quick brown fox jumps over the lazy log.'
    );

    mount(
      <HighlightText
        highlight={[
          {
            bgColor: 'rgb(0, 0, 0)',
            textColor: 'rgb(255, 255, 255)',
            words: ['the', 'jumps'],
          }
        ]}
        text={text}
      />
    );
    // first highlight chunk; regex allows us to ensure there is no extra text
    cy.get('[data-cy="highlight-0"]').contains(/^The$/);
    // highlighted CSS props
    cy.get('[data-cy="highlight-0"]').should('have.css', 'background-color', 'rgb(0, 0, 0)');
    cy.get('[data-cy="highlight-0"]').should('have.css', 'color', 'rgb(255, 255, 255)');

    cy.get('[data-cy="highlight-1"]').contains(/^ quick brown fox $/);
    // default, unchanged CSS props
    cy.get('[data-cy="highlight-1"]').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');
    cy.get('[data-cy="highlight-1"]').should('have.css', 'color', 'rgb(0, 0, 0)');

    cy.get('[data-cy="highlight-2"]').contains(/^jumps$/);
    // highlighted CSS props
    cy.get('[data-cy="highlight-2"]').should('have.css', 'background-color', 'rgb(0, 0, 0)');
    cy.get('[data-cy="highlight-2"]').should('have.css', 'color', 'rgb(255, 255, 255)');

    cy.get('[data-cy="highlight-3"]').contains(/^ over $/);
    // default, unchanged CSS props
    cy.get('[data-cy="highlight-3"]').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');
    cy.get('[data-cy="highlight-3"]').should('have.css', 'color', 'rgb(0, 0, 0)');

    cy.get('[data-cy="highlight-4"]').contains(/^the$/);
    // highlighted CSS props
    cy.get('[data-cy="highlight-4"]').should('have.css', 'background-color', 'rgb(0, 0, 0)');
    cy.get('[data-cy="highlight-4"]').should('have.css', 'color', 'rgb(255, 255, 255)');

    cy.get('[data-cy="highlight-5"]').contains(/^ lazy log.$/);
    // default, unchanged CSS props
    cy.get('[data-cy="highlight-5"]').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');
    cy.get('[data-cy="highlight-5"]').should('have.css', 'color', 'rgb(0, 0, 0)');
  });

  it('Highlights with the multiple colors.', function() {
    const text = (
      'Example text. Test'
    );

    mount(
      <HighlightText
        highlight={[
          // black bg, white text
          {
            bgColor: 'rgb(0, 0, 0)',
            textColor: 'rgb(255, 255, 255)',
            words: ['example', 'test'],
          },

          // blue bg, red text
          {
            bgColor: 'rgb(0, 255, 0)',
            textColor: 'rgb(255, 0, 0)',
            words: ['text'],
          }
        ]}
        text={text}
      />
    );

    cy.get('[data-cy="highlight-0"]').contains(/^Example$/);
    // black highlighted CSS props
    cy.get('[data-cy="highlight-0"]').should('have.css', 'background-color', 'rgb(0, 0, 0)');
    cy.get('[data-cy="highlight-0"]').should('have.css', 'color', 'rgb(255, 255, 255)');

    cy.get('[data-cy="highlight-1"]').contains(/^ $/);
    // default, unchanged CSS props
    cy.get('[data-cy="highlight-1"]').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');
    cy.get('[data-cy="highlight-1"]').should('have.css', 'color', 'rgb(0, 0, 0)');

    cy.get('[data-cy="highlight-2"]').contains(/^text$/);
    // blue highlighted CSS props
    cy.get('[data-cy="highlight-2"]').should('have.css', 'background-color', 'rgb(0, 255, 0)');
    cy.get('[data-cy="highlight-2"]').should('have.css', 'color', 'rgb(255, 0, 0)');


    cy.get('[data-cy="highlight-3"]').contains(/^. $/);
    // default, unchanged CSS props
    cy.get('[data-cy="highlight-3"]').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');
    cy.get('[data-cy="highlight-3"]').should('have.css', 'color', 'rgb(0, 0, 0)');


    cy.get('[data-cy="highlight-4"]').contains(/^Test$/);
    // black highlighted CSS props
    cy.get('[data-cy="highlight-4"]').should('have.css', 'background-color', 'rgb(0, 0, 0)');
    cy.get('[data-cy="highlight-4"]').should('have.css', 'color', 'rgb(255, 255, 255)');
  });


  it('Does not highlight word if it isn\'t surrounded by whitespace or punctuation.', function() {
    const text = (
      'Example; asdfexample exampleasdf Words. multiple words. ahhhhmultiple words'
    );

    mount(
      <HighlightText
        highlight={[
          // black bg, white text
          {
            bgColor: 'rgb(0, 0, 0)',
            textColor: 'rgb(255, 255, 255)',
            words: ['example', 'multiple words'],
          },
        ]}
        text={text}
      />
    );

    cy.get('[data-cy="highlight-0"]').contains(/^Example$/);
    // black highlighted CSS props
    cy.get('[data-cy="highlight-0"]').should('have.css', 'background-color', 'rgb(0, 0, 0)');
    cy.get('[data-cy="highlight-0"]').should('have.css', 'color', 'rgb(255, 255, 255)');


    cy.get('[data-cy="highlight-1"]').contains(/^; asdfexample exampleasdf Words. $/);
    // default, unchanged CSS props
    cy.get('[data-cy="highlight-1"]').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');
    cy.get('[data-cy="highlight-1"]').should('have.css', 'color', 'rgb(0, 0, 0)');

    cy.get('[data-cy="highlight-2"]').contains(/^multiple words$/);
    // black highlighted CSS props
    cy.get('[data-cy="highlight-2"]').should('have.css', 'background-color', 'rgb(0, 0, 0)');
    cy.get('[data-cy="highlight-2"]').should('have.css', 'color', 'rgb(255, 255, 255)');


    cy.get('[data-cy="highlight-3"]').contains(/^. ahhhhmultiple words$/);
    // default, unchanged CSS props
    cy.get('[data-cy="highlight-3"]').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');
    cy.get('[data-cy="highlight-3"]').should('have.css', 'color', 'rgb(0, 0, 0)');

  });
});