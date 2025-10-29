import { SelectOptionWithKeyNameAndAbbreviation } from './SelectOptionInterface'

export class StudyType {
  static readonly OBS: SelectOptionWithKeyNameAndAbbreviation = { key: 'OBS', name: 'Observational' }
  static readonly INT: SelectOptionWithKeyNameAndAbbreviation = { key: 'INT', name: 'Interventional' }
  static readonly DES: SelectOptionWithKeyNameAndAbbreviation = { key: 'DES', name: 'Descriptive' }
  static readonly ANA: SelectOptionWithKeyNameAndAbbreviation = { key: 'ANA', name: 'Analytical' }
  static readonly PRO: SelectOptionWithKeyNameAndAbbreviation = { key: 'PRO', name: 'Prospective' }
  static readonly RET: SelectOptionWithKeyNameAndAbbreviation = { key: 'RET', name: 'Retrospective' }
  static readonly CAR: SelectOptionWithKeyNameAndAbbreviation = { key: 'CAR', name: 'Case report' }
  static readonly CAS: SelectOptionWithKeyNameAndAbbreviation = { key: 'CAS', name: 'Case series' }
  static readonly CRS: SelectOptionWithKeyNameAndAbbreviation = { key: 'CRS', name: 'Cross-sectional' }
  static readonly COS: SelectOptionWithKeyNameAndAbbreviation = { key: 'COS', name: 'Cohort study' }
  static readonly VALUES: SelectOptionWithKeyNameAndAbbreviation[] = [
    StudyType.OBS,
    StudyType.INT,
    StudyType.DES,
    StudyType.ANA,
    StudyType.PRO,
    StudyType.RET,
    StudyType.CAR,
    StudyType.CAS,
    StudyType.CRS,
    StudyType.COS,
  ]

  static readonly NAME_VALUES: string[] = StudyType.VALUES.map(val => val.name)
}
