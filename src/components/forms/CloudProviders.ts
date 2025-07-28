import { SelectOptionWithKeyNameAndAbbreviation } from './SelectOptionInterface'

export class CloudProviders {
  static GCP: SelectOptionWithKeyNameAndAbbreviation = { key: 'GCP', name: 'GCP' }
  static AWS: SelectOptionWithKeyNameAndAbbreviation = { key: 'AWS', name: 'AWS' }
  static AZURE: SelectOptionWithKeyNameAndAbbreviation = { key: 'Azure', name: 'Azure' }
  static VALUES: SelectOptionWithKeyNameAndAbbreviation[] = [
    CloudProviders.GCP,
    CloudProviders.AWS,
    CloudProviders.AZURE,
  ]
}
