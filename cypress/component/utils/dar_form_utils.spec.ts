import {newIrbDocumentExpirationDate} from "src/utils/darFormUtils";

describe('DarFormUtils', () => {
    it('newIrbDocumentExpirationDate', () => {
        const result = newIrbDocumentExpirationDate();
        expect(result).to.match(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });
});
