import { fileDownload } from 'src/utils/FileDownload';

describe('FileDownload', () => {
    it('should create and trigger download with correct attributes', () => {
        const testData = 'test content';
        const filename = 'test.txt';
        const mime = 'text/plain';

        cy.window().then((win) => {
            const createObjectURLSpy = cy.spy(win.URL, 'createObjectURL');
            const revokeObjectURLSpy = cy.spy(win.URL, 'revokeObjectURL');
            const clickSpy = cy.spy(HTMLAnchorElement.prototype, 'click');

            fileDownload(testData, filename, mime);

            // verify blob creation
            cy.wrap(createObjectURLSpy).should('be.calledOnce');
            const blob = createObjectURLSpy.firstCall.args[0];
            cy.wrap(blob).should('be.instanceOf', Blob);
            cy.wrap(blob.type).should('equal', mime);

            // verify anchor element
            cy.get('a').should('exist')
                .and('have.attr', 'download', filename)
                .and('have.css', 'display', 'none')
                .then(() => {
                    cy.wrap(clickSpy).should('be.calledOnce');
                });

            // verify cleanup
            cy.wrap(clickSpy).then(() => {
                cy.wrap(revokeObjectURLSpy).should('be.calledOnce');
                cy.get('a').should('not.exist');
            });
        });
    });

    it('should use default mime type if none provided', () => {
        const testData = 'test content';
        const filename = 'test.txt';

        cy.window().then((win) => {
            const createObjectURLSpy = cy.spy(win.URL, 'createObjectURL');

            fileDownload(testData, filename);

            const blob = createObjectURLSpy.firstCall.args[0];
            cy.wrap(blob.type).should('be.equal', 'application/octet-stream');
        });
    });

    it('should handle different input types', () => {
        const testCases = [
            { data: new Uint8Array([1, 2, 3]), type: 'ArrayBufferView' },
            { data: new Blob(['test']), type: 'Blob' },
            { data: new ArrayBuffer(8), type: 'ArrayBuffer' }
        ];

        cy.window().then((win) => {
            const createObjectURLSpy = cy.spy(win.URL, 'createObjectURL');

            testCases.forEach(({ data, type }, index) => {
                fileDownload(data, `test.${type}`);

                const blob = createObjectURLSpy.getCall(index).args[0];
                cy.wrap(blob).should('be.instanceOf', Blob);
            });

            cy.wrap(createObjectURLSpy).should('have.callCount', testCases.length);
        });
    });
});
