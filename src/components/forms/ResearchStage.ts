import { SelectOptionWithKeyNameAndAbbreviation } from './SelectOptionInterface'

export class ResearchStage {
  static readonly PRA: SelectOptionWithKeyNameAndAbbreviation = { key: 'PRA', name: 'Pre-analysis' }
  static readonly POA: SelectOptionWithKeyNameAndAbbreviation = { key: 'POA', name: 'Post-analysis' }
  static readonly INA: SelectOptionWithKeyNameAndAbbreviation = { key: 'INA', name: 'Intra-analysis' }
  static readonly VALUES: SelectOptionWithKeyNameAndAbbreviation[] = [
    ResearchStage.PRA,
    ResearchStage.POA,
    ResearchStage.INA,
  ]
}
