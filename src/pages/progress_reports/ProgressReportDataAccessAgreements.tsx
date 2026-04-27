import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Notifications } from 'src/libs/utils'
import { DAA } from 'src/libs/ajax/DAA'
import RequiredDAAs from 'src/pages/dar_application/RequiredDAAs'
import { DAAObject, Dataset } from 'src/types/model'
import { FormFieldTitle } from 'src/components/forms/forms'
import { isEqual } from 'lodash'

interface ProgressReportDataAccessAgreementsProps {
  datasets: Dataset[]
  onDaaIdsChange: (daaIds: number[]) => void
}

const getRequiredDaaIds = (datasets: Dataset[], daas: DAAObject[]): number[] => {
  const ids = new Set<number>()
  datasets.forEach((dataset) => {
    if (!dataset.dacId) {
      return
    }
    const daa = daas.find(daaItem => daaItem.dacs?.some(d => d.dacId === dataset.dacId))
    if (daa) {
      ids.add(daa.daaId)
    }
  })
  return Array.from(ids).sort((a, b) => a - b)
}

export default function ProgressReportDataAccessAgreements({ datasets, onDaaIdsChange }: Readonly<ProgressReportDataAccessAgreementsProps>) {
  const [daas, setDaas] = useState<DAAObject[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const previousDaaIds = useRef<number[]>([])

  useEffect(() => {
    const init = async () => {
      try {
        const daaList = await DAA.getDaas()
        setDaas(daaList)
      }
      catch (caughtError) {
        const message = String(caughtError)
        setError('Unable to retrieve required data access agreements: ' + message)
        Notifications.showError({ text: 'Error: ' + message })
      }
      finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const requiredDaaIds = useMemo(() => getRequiredDaaIds(datasets, daas), [datasets, daas])

  useEffect(() => {
    if (!isEqual(previousDaaIds.current, requiredDaaIds)) {
      previousDaaIds.current = requiredDaaIds
      onDaaIdsChange(requiredDaaIds)
    }
  }, [requiredDaaIds, onDaaIdsChange])

  return (
    <div className="data-use-acknowledgements">
      <FormFieldTitle
        id="progressReportDataAccessAgreements"
        formId="progressReportDataAccessAgreements"
        title="Step 2.1: Required Data Access Agreements"
        description="The datasets in this progress report may require the following data access agreements."
      />
      {loading && <p>Loading required data access agreements…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && (
        <RequiredDAAs
          datasets={datasets}
          daas={daas}
          agreementText="By submitting this progress report and in accordance with your Institution’s issuance of Library Cards to you for the agreement(s) below."
        />
      )}
    </div>
  )
}
