import React from 'react'
import { Biospecimen } from 'src/types/model'
import { useNavigate } from 'react-router-dom'

interface BiospecimenAddEditProps {
  readonly id: number
  readonly biospecimen?: Biospecimen
  readonly biospecimens: Biospecimen[]
  readonly closeAction: () => void
  readonly onBiospecimensChange: (models: Biospecimen[]) => void
  readonly readOnly?: boolean
}

export default function BiospecimenAddEdit(_props: BiospecimenAddEditProps): React.JSX.Element | null {
  const navigate = useNavigate()
  React.useEffect(() => {
    // Redirect to biospecimen library page
    navigate('/datalibrary/?tab=biospecimens')
  }, [navigate])
  return null
}
