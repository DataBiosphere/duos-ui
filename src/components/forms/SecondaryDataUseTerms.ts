import { SelectOptionWithKeyNameAndAbbreviation } from './SelectOptionInterface'

export class SecondaryDataUseTerms {
  static readonly NMDS: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'NMDS',
    name: 'No methods development or validation studies',
    abbreviation: 'NMDS',
  }

  static readonly GSO: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'GSO',
    name: 'Genetic studies only',
    abbreviation: 'GSO',
  }

  static readonly PUB: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'PUB',
    name: 'Publication Required',
    abbreviation: 'PUB',
  }

  static readonly COL: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'COL',
    name: 'Collaboration Required',
    abbreviation: 'COL',
  }

  static readonly IRB: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'IRB',
    name: 'Ethics Approval Required',
    abbreviation: 'IRB',
  }

  /**
   * `GS`, not the `GS-` this previously carried: `consentTranslations` emits `GS` for
   * `dataUse.geographicalRestrictions`, so `GS` is the code a dataset is indexed under.
   * The dbGaP spelling appends the region (`GS-US`), which the data library still
   * recognizes — see `dataUseModifierLabel` — but no plain `GS-` is ever stored.
   */
  static readonly GS: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'GS',
    name: 'Geographic Restriction',
    abbreviation: 'GS',
  }

  static readonly MOR: SelectOptionWithKeyNameAndAbbreviation = {
    key: 'MOR',
    name: 'Publication Moratorium',
    abbreviation: 'MOR',
  }

  static readonly NPU: SelectOptionWithKeyNameAndAbbreviation = { key: 'NPU', name: 'Non-profit Use Only', abbreviation: 'NPU' }
  static readonly OTH: SelectOptionWithKeyNameAndAbbreviation = { key: 'OTH', name: 'Other' }

  static readonly VALUES: SelectOptionWithKeyNameAndAbbreviation[] = [
    SecondaryDataUseTerms.NMDS,
    SecondaryDataUseTerms.GSO,
    SecondaryDataUseTerms.PUB,
    SecondaryDataUseTerms.COL,
    SecondaryDataUseTerms.IRB,
    SecondaryDataUseTerms.GS,
    SecondaryDataUseTerms.MOR,
    SecondaryDataUseTerms.NPU,
    SecondaryDataUseTerms.OTH,
  ]
}
