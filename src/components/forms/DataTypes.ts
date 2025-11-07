import { SelectOptionWithKeyNameAndAbbreviation } from './SelectOptionInterface'

export class DataTypes {
  static readonly CITE: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'CITE',
    name: 'CITE-seq',
  }

  static readonly HYB: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'HYB',
    name: 'Hybrid Capture',
  }

  static readonly RNA: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'RNA',
    name: 'RNA-Seq',
  }

  static readonly SCRNA: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'scRNA',
    name: 'scRNA-Seq',
  }

  static readonly SPT: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'SPT',
    name: 'Spatial Transcriptomics',
  }

  static readonly SNRNA: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'snRNA',
    name: 'snRNA-Seq',
  }

  static readonly WGS: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'WGS',
    abbreviation: 'WGS',
    name: 'Whole Genome',
  }

  static readonly WES: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'WES',
    abbreviation: 'WES',
    name: 'Whole Exome',
  }

  static readonly VALUES: SelectOptionWithKeyNameAndAbbreviation[] = [DataTypes.CITE,
    DataTypes.HYB,
    DataTypes.RNA,
    DataTypes.SCRNA,
    DataTypes.SPT,
    DataTypes.SNRNA,
    DataTypes.WGS,
    DataTypes.WES]
}
