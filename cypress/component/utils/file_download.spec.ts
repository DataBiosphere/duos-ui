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
            expect(createObjectURLSpy).to.be.calledOnce;
            const blob = createObjectURLSpy.firstCall.args[0];
            expect(blob).to.be.instanceOf(Blob);
            expect(blob.type).to.equal(mime);

            // verify anchor element
            const anchor = win.document.querySelector('a');
            expect(anchor).to.have.attr('download', filename);
            expect(anchor?.style.display).to.equal('none');

            // verify cleanup
            cy.wait(200).then(() => {
                expect(revokeObjectURLSpy).to.be.calledOnce;
                expect(win.document.querySelector('a')).to.be.null;
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
            expect(blob.type).to.equal('application/octet-stream');
        });
    });
});
