import React, { useEffect, useState } from 'react'
import { Notifications } from 'src/libs/utils'
import { DAA } from 'src/libs/ajax/DAA'
import RequiredDAAs from './RequiredDAAs'
import { extractError } from 'src/utils/ErrorUtils'
import 'src/pages/dar_application/dar_application.css'
import { DataAccessAgreement, Dataset } from 'src/types/model'

interface DataAccessAgreementsProps {
  save: () => void
  attest: () => void
  isDraft: boolean
  isAttested: boolean
  cancelAttest: () => void
  datasets: Dataset[]
  onDaaIdsChange?: (daaIds: number[]) => void
}

export const DataAccessAgreements = ({
  save,
  attest,
  isDraft,
  isAttested,
  cancelAttest,
  datasets,
  onDaaIdsChange,
}: DataAccessAgreementsProps) => {
  const [daas, setDaas] = useState<DataAccessAgreement[]>([])

  const getDisplayedDaaIds = (availableDatasets: Dataset[], availableDaas: DataAccessAgreement[]): number[] => {
    const seenFileNames = new Set<string>()
    const displayedIds: number[] = []

    availableDatasets.forEach((dataset) => {
      if (!dataset.dacId) {
        return
      }

      const matchingDaa = availableDaas.find(daa => daa.dacs?.some(d => d.dacId === dataset.dacId))
      if (!matchingDaa) {
        return
      }

      const rawFileName = matchingDaa.file?.fileName
      if (!rawFileName) {
        return
      }

      const baseFileName = rawFileName.split('.')[0]
      if (seenFileNames.has(baseFileName)) {
        return
      }

      seenFileNames.add(baseFileName)
      displayedIds.push(matchingDaa.daaId)
    })

    return displayedIds
  }

  useEffect(() => {
    const init = async () => {
      try {
        const daaList = await DAA.getDaas()
        setDaas(daaList)
      }
      catch (error) {
        const message = extractError(error)
        Notifications.showError({
          text: 'Error: Unable to retrieve DAAs from server: ' + message,
        })
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (onDaaIdsChange) {
      onDaaIdsChange(getDisplayedDaaIds(datasets, daas))
    }
  }, [datasets, daas, onDaaIdsChange])

  return (
    <div className="dar-step-card">
      <h2>Data Access Agreements (DAA)</h2>

      <div className="form-group">
        <h3>DUOS Code of Conduct</h3>

        <p className="data-use-paragraph">
          Failure to abide by any term within this Code of Conduct may result in revocation of approved access to
          datasets obtained through these repositories. Investigators who are approved to access data agree to:
        </p>

        <ol className="data-use-list">
          <li>
            Use datasets solely in connection with the research project described in the approved Data Access
            Request for each dataset;
          </li>
          <li>
            Make no attempt to identify or contact individual participants or groups from whom data were collected,
            or generate information that could allow participants’ identities to be readily ascertained, without
            appropriate approvals from the submitting institution;
          </li>
          <li>
            Maintain the confidentiality of the data and not distribute them to any entity or individual beyond
            those specified in the approved Data Access Request;
          </li>
          <li>
            Adhere to the security best practices for controlled-access data subject to the genomic data sharing
            policy/policies listed below and ensure that only approved users can gain access to data files;
          </li>
          <li>
            Acknowledge the Intellectual property terms as specified in the Data Access Agreements and data use
            certification;
          </li>
          <li>
            Provide appropriate acknowledgement in any dissemination of research findings including the
            investigator(s) who generated the data, the funding source, accession numbers of the dataset, and the data
            repository from which the data were accessed; and,
          </li>
          <li>
            Report any inadvertent data release, break of data security, or other data management incidents in
            accordance with the terms specified in the Data Use Agreements below and data use certification.
          </li>
        </ol>
      </div>

      <RequiredDAAs
        datasets={datasets}
        daas={daas}
        agreementText="By submitting this data access request and in accordance with your Institution’s issuance of Library Cards to you for the agreement(s) below."
      />

      <div className="flex flex-row" style={{ justifyContent: 'around', paddingTop: '4rem' }}>
        <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
          {isDraft && (
            <button
              data-cy="attest-button"
              type="button"
              id="btn_attest"
              onClick={attest}
              className="button button-blue"
              disabled={isAttested}
              style={{ marginRight: '2rem' }}
            >
              Attest
            </button>
          )}
          {isDraft && (
            <button
              data-cy="save-button"
              type="button"
              id="btn_saveDar"
              onClick={save}
              className="button button-white"
              disabled={isAttested}
            >
              Save Draft
            </button>
          )}
        </div>
        {isDraft && isAttested && (
          <button
            data-cy="cancel-button"
            id="btn_cancelAttest"
            onClick={cancelAttest}
            style={{ float: 'right' }}
            className="button button-white"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
