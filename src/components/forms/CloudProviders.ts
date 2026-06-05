import { SelectOptionWithKeyNameAndAbbreviation } from './SelectOptionInterface'

export class CloudProviders {
  static readonly GCP: SelectOptionWithKeyNameAndAbbreviation = { key: 'GCP', name: 'GCP' }
  static readonly AWS: SelectOptionWithKeyNameAndAbbreviation = { key: 'AWS', name: 'AWS' }
  static readonly AZURE: SelectOptionWithKeyNameAndAbbreviation = { key: 'Azure', name: 'Azure' }
  static readonly ORACLE: SelectOptionWithKeyNameAndAbbreviation = { key: 'Oracle', name: 'Oracle' }
  static readonly VALUES: SelectOptionWithKeyNameAndAbbreviation[] = [
    CloudProviders.GCP,
    CloudProviders.AWS,
    CloudProviders.AZURE,
    CloudProviders.ORACLE,
  ]
}
