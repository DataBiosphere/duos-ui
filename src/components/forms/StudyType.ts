import { SelectOptionWithKeyNameAndAbbreviation } from './SelectOptionInterface'

export class StudyType {
  static OBS: SelectOptionWithKeyNameAndAbbreviation = { key: 'OBS', name: 'Observational' }
  static INT: SelectOptionWithKeyNameAndAbbreviation = { key: 'INT', name: 'Interventional' }
  static DES: SelectOptionWithKeyNameAndAbbreviation = { key: 'DES', name: 'Descriptive' }
  static ANA: SelectOptionWithKeyNameAndAbbreviation = { key: 'ANA', name: 'Analytical' }
  static PRO: SelectOptionWithKeyNameAndAbbreviation = { key: 'PRO', name: 'Prospective' }
  static RET: SelectOptionWithKeyNameAndAbbreviation = { key: 'RET', name: 'Retrospective' }
  static CAR: SelectOptionWithKeyNameAndAbbreviation = { key: 'CAR', name: 'Case report' }
  static CAS: SelectOptionWithKeyNameAndAbbreviation = { key: 'CAS', name: 'Case series' }
  static CRS: SelectOptionWithKeyNameAndAbbreviation = { key: 'CRS', name: 'Cross-sectional' }
  static COS: SelectOptionWithKeyNameAndAbbreviation = { key: 'COS', name: 'Cohort study' }
  static VALUES: SelectOptionWithKeyNameAndAbbreviation[] = [
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
