import {
    asIdAndDisplayText, getFormattedName,
    SelectOptionWithKeyNameAndAbbreviation
} from '../../../src/components/forms/SelectOptionInterface';

describe('SelectOptions tests', () => {
    describe('getFormattedName tests',()=>{
        it('should render expected name when key, name are present ',()=>{
        const entry: SelectOptionWithKeyNameAndAbbreviation = {key: 'en', name: 'Entry'};
        expect(getFormattedName(entry)).to.be.equal('Entry');
        });
        it('should render expected name when key, name, and abbreviation are present ',()=>{
            const entry: SelectOptionWithKeyNameAndAbbreviation = {key: 'en', name: 'Entry', abbreviation:'EN'};
            expect(getFormattedName(entry)).to.be.equal('Entry (EN)');
        });
    });

    describe('asIdAndDisplayText tests', ()=>{
        it('test single entry in list',()=>{
            const entry: SelectOptionWithKeyNameAndAbbreviation = {key: 'en', name: 'Entry', abbreviation:'EN'};
            const entryList = asIdAndDisplayText([entry]);
            expect(entryList.length).to.be.equal(1);
            expect(entryList[0].displayText).to.be.equal('Entry (EN)');
        });

        it('test empty entry list',()=>{
            const entryList = asIdAndDisplayText([]);
            expect(entryList.length).to.be.equal(0);
        });
    });
})
