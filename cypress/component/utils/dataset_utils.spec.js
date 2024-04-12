import { firstNonEmptyPropertyValue } from '../../../src/utils/DatasetUtils';

describe('firstNonEmptyPropertyValue', () => {
    it('ensure no errors when no study properties', async () => {
        const dataset = { id: 1, study: { id: 2 }};
        const result = firstNonEmptyPropertyValue(dataset, [ 'test' ]);
        expect(result).to.be.empty;
    });
    it('ensure no errors when no dataset properties', async () => {
        const dataset = { id: 1 };
        const result = firstNonEmptyPropertyValue(dataset, [ 'test' ]);
        expect(result).to.be.empty;
    });
    it('ensure no errors when incorrect properties', async () => {
        const dataset = { id: 1, study: { id: 2, properties: [ { key: 'hello', value: 'goodbye' } ]}};
        const result = firstNonEmptyPropertyValue(dataset, [ 'test' ]);
        expect(result).to.be.empty;
    });
    it('ensure no errors when empty study property values', async () => {
        const dataset = { id: 1, study: { id: 2, properties: [ { key: 'hello' } ]}};
        const result = firstNonEmptyPropertyValue(dataset, [ 'hello' ]);
        expect(result).to.be.empty;
    });
    it('ensure no errors when empty dataset property values', async () => {
        const dataset = { id: 1, properties: [ { propertyName: 'hello' } ]};
        const result = firstNonEmptyPropertyValue(dataset, [ 'hello' ]);
        expect(result).to.be.empty;
    });
    it('extract hello property from study', async () => {
        const dataset = { id: 1, study: { id: 2, properties: [ { key: 'hello', value: 'goodbye' } ]}};
        const result = firstNonEmptyPropertyValue(dataset, [ 'hello' ]);
        expect(result).to.equal('goodbye');
    });
    it('extract hello property from dataset', async () => {
        const dataset = { id: 1, properties: [ { propertyName: 'hello', propertyValue: 'goodbye' } ]};
        const result = firstNonEmptyPropertyValue(dataset, [ 'hello' ]);
        expect(result).to.equal('goodbye');
    });
    it('prioritize study property over dataset property', async () => {
        const dataset = { id: 1, properties: [ { propertyName: 'hello', propertyValue: 'goodbye' } ], study: { id: 2, properties: [ { key: 'hello', value: 'world' } ]}};
        const result = firstNonEmptyPropertyValue(dataset, [ 'hello' ]);
        expect(result).to.equal('world');
    });
    it('extract first available property from study', async () => {
        const dataset = { id: 1, study: { id: 2, properties: [ { key: 'hello', value: 'goodbye' }, { key: 'world', value: 'hello' } ]}};
        const result = firstNonEmptyPropertyValue(dataset, [ 'hello', 'world' ]);
        expect(result).to.equal('goodbye');
    });
    it('extract first available property from dataset', async () => {
        const dataset = { id: 1, properties: [ { propertyName: 'hello', propertyValue: 'goodbye' }, { propertyName: 'world', propertyValue: 'hello' } ]};
        const result = firstNonEmptyPropertyValue(dataset, [ 'hello', 'world' ]);
        expect(result).to.equal('goodbye');
    });
    it('extract mix of properties from study and dataset', async () => {
        const dataset = { id: 1, properties: [ { propertyName: 'hello', propertyValue: 'goodbye' } ], study: { id: 2, properties: [ { key: 'world', value: 'hello' } ]}};
        const result = firstNonEmptyPropertyValue(dataset, [ 'world', 'hello' ]);
        expect(result).to.equal('hello');
    });
});
