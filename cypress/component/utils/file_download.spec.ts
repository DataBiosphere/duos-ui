import { fileDownload } from "../../../src/utils/FileDownload";

describe('FileDownload', () => {
    it('should create and trigger download with correct attributes', () => {
        const testData = 'test content';
        const filename = 'test.txt';
        const mime = 'text/plain';

        cy.window().then((win) => {
            const createObjectURLSpy = cy.spy(win.URL, 'createObjectURL');
            const revokeObjectURLSpy = cy.spy(win.URL, 'revokeObjectURL');

            fileDownload(testData, filename, mime);

            // verify blob creation
            cy.wrap(createObjectURLSpy).should('be.calledOnce');
            const blob = createObjectURLSpy.firstCall.args[0];
            cy.wrap(blob).should('be.instanceOf', Blob);
            cy.wrap(blob.type).should('equal', mime);

            // verify anchor element
            const anchor = win.document.querySelector('a');
            cy.wrap(anchor).should('not.be.null');
            cy.wrap(anchor).should('have.attr', 'download', filename);
            cy.wrap(anchor?.style.display).should('equal', 'none');

            // verify cleanup
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(200).then(() => {
                cy.wrap(revokeObjectURLSpy).should('be.calledOnce');
                cy.wrap(win.document.querySelector('a')).should('be.null');
            });
        });
    });

    it('should use default mime type if none provided', () => {
        const testData = 'test content';
        const filename = 'test.txt';

        cy.window().then((win) => {
            const createObjectURLSpy = cy.spy(win.URL, 'createObjectURL');

            fileDownload(testData, filename, '');

            const blob = createObjectURLSpy.firstCall.args[0];
            cy.wrap(blob.type).should('be.equal', 'application/octet-stream');
        });
    });
});
