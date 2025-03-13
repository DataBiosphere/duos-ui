import {SelectOptionWithKeyNameAndAbbreviation} from './SelectOptionInterface';


export class DataTypes {
    static CITE: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'CITE',
        name: 'CITE-seq'
    };
    static HYB: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'HYB',
        name: 'Hybrid Capture'
    };
    static RNA: SelectOptionWithKeyNameAndAbbreviation = {
        key:'RNA',
        name: 'RNA-Seq'
    }
    static SCRNA: SelectOptionWithKeyNameAndAbbreviation = {
        key:'scRNA',
        name: 'scRNA-Seq'
    }
    static SPT: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'SPT',
        name: 'Spatial Transcriptomics'
    }
    static SNRNA: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'snRNA',
        name: 'snRNA-Seq'
    }
    static WGS: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'WGS',
        abbreviation:'WGS',
        name: 'Whole Genome'
    }
    static WES: SelectOptionWithKeyNameAndAbbreviation = {
        key: 'WES',
        abbreviation: 'WES',
        name: 'Whole Exome'
    }

    static dataTypesList:SelectOptionWithKeyNameAndAbbreviation[] = [DataTypes.CITE,
    DataTypes.HYB,
    DataTypes.RNA,
    DataTypes.SCRNA,
    DataTypes.SPT,
    DataTypes.SNRNA,
    DataTypes.WGS,
    DataTypes.WES]
}