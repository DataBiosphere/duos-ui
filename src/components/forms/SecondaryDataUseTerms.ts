import {SelectOptionWithKeyNameAndAbbreviation} from './SelectOptionInterface';

export class SecondaryDataUseTerms {

    static NMDS: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'NMDS',
        name: 'No methods development or validation studies',
        abbreviation: 'NMDS'
    };
    static GSO: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'GSO',
        name: 'Genetic studies only',
        abbreviation: 'GSO'
    };
    static PUB: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'PUB',
        name: 'Publication Required',
        abbreviation: 'PUB'
    };
    static COL: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'COL',
        name: 'Collaboration Required',
        abbreviation: 'COL'
    };
    static IRB: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'IRB',
        name: 'Ethics Approval Required',
        abbreviation: 'IRB'
    };
    static GSMINUS: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'GS-',
        name: 'Geographic Restriction',
        abbreviation: 'GS-'
    };
    static MOR: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'MOR',
        name: 'Publication Moratorium',
        abbreviation: 'MOR'
    };
    static NPU: SelectOptionWithKeyNameAndAbbreviation = {key: 'NPU', name: 'Non-profit Use Only', abbreviation: 'NPU'};
    static OTH: SelectOptionWithKeyNameAndAbbreviation = {key: 'OTH', name: 'Other'};

    static VALUES:SelectOptionWithKeyNameAndAbbreviation[] = [
        SecondaryDataUseTerms.NMDS,
        SecondaryDataUseTerms.GSO,
        SecondaryDataUseTerms.PUB,
        SecondaryDataUseTerms.COL,
        SecondaryDataUseTerms.IRB,
        SecondaryDataUseTerms.GSMINUS,
        SecondaryDataUseTerms.MOR,
        SecondaryDataUseTerms.NPU,
        SecondaryDataUseTerms.OTH
    ];
}
