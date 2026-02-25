import React from 'react'
import { Biospecimen } from 'src/types/model'

interface BiospecimenAddEditProps {
  readonly id: number
  readonly biospecimen?: Biospecimen
  readonly biospecimens: Biospecimen[]
  readonly closeAction: () => void
  readonly onBiospecimensChange: (models: Biospecimen[]) => void
  readonly readOnly?: boolean
}

export default function BiospecimenAddEdit(_props: BiospecimenAddEditProps): React.JSX.Element | null {
  return null
}
