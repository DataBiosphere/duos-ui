import React, { useEffect, useMemo, useState } from 'react'
import { DAR } from 'src/libs/ajax/DAR'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'

type SnapshotRecord = {
  [key: string]: unknown
}

type DatasetDaaRow = {
  datasetId?: number
  datasetIdentifier?: string
  datasetName: string
  daaId?: number
  daaName: string
  daaFileName: string
}

interface DatasetDaaSnapshotRelationshipsProps {
  referenceId?: string | number
  title?: string
}

const getStringValue = (...values: unknown[]): string => {
  const value = values.find(v => typeof v === 'string' && v.trim().length > 0)
  return typeof value === 'string' ? value : ''
}

const getNumberValue = (...values: unknown[]): number | undefined => {
  const value = values.find(v => Number.isInteger(Number(v)) && Number(v) > 0)
  return value === undefined ? undefined : Number(value)
}

const normalizeSnapshot = (snapshot: SnapshotRecord): DatasetDaaRow => {
  const dataset = (snapshot.dataset ?? {}) as SnapshotRecord
  const daa = (snapshot.daa ?? {}) as SnapshotRecord
  const daaFile = (daa.file ?? {}) as SnapshotRecord
  const snapshotDaaFile = (snapshot.daaFile ?? {}) as SnapshotRecord

  const datasetId = getNumberValue(snapshot.datasetId, dataset.datasetId)
  const datasetIdentifier = getStringValue(snapshot.datasetIdentifier, dataset.datasetIdentifier)
  const datasetName = getStringValue(
    snapshot.datasetName,
    snapshot.name,
    dataset.name,
    dataset.datasetName,
    datasetIdentifier,
    datasetId ? `Dataset ${datasetId}` : '',
    'Dataset',
  )

  const daaId = getNumberValue(snapshot.daaId, daa.daaId)
  const daaName = getStringValue(snapshot.daaName, daa.name)
  const daaFileName = getStringValue(
    snapshot.daaFileName,
    snapshot.fileName,
    snapshotDaaFile.fileName,
    daaFile.fileName,
    daaName,
    daaId ? `DAA ${daaId}` : '',
    'DAA',
  )

  return {
    datasetId,
    datasetIdentifier,
    datasetName,
    daaId,
    daaName,
    daaFileName,
  }
}

export const DatasetDaaSnapshotRelationships = ({
  referenceId,
  title = 'Dataset and Data Access Agreement Relationships',
}: Readonly<DatasetDaaSnapshotRelationshipsProps>) => {
  const [rows, setRows] = useState<DatasetDaaRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [downloadingDaaId, setDownloadingDaaId] = useState<number | null>(null)

  useEffect(() => {
    if (!referenceId) {
      setRows([])
      setLoading(false)
      return
    }

    const fetchSnapshots = async () => {
      try {
        setLoading(true)
        const response = await DAR.getDatasetDaaSnapshots(referenceId)
        let snapshotList: SnapshotRecord[] = []
        if (Array.isArray(response)) {
          snapshotList = response as SnapshotRecord[]
        }
        else if (Array.isArray(response?.datasetDaaSnapshots)) {
          snapshotList = response.datasetDaaSnapshots as SnapshotRecord[]
        }

        const normalizedRows = snapshotList.map((snapshot: SnapshotRecord) => normalizeSnapshot(snapshot))
        setRows(normalizedRows)
      }
      catch (error) {
        setRows([])
        Notifications.showError({
          text: 'Unable to load dataset and DAA relationships: ' + extractError(error),
        })
      }
      finally {
        setLoading(false)
      }
    }

    fetchSnapshots()
  }, [referenceId])

  const hasRows = useMemo(() => rows.length > 0, [rows])

  const onDownloadAndViewDaa = async (daaId?: number, daaFileName?: string) => {
    if (!daaId) {
      return
    }

    try {
      setDownloadingDaaId(daaId)
      const blob = await DAA.getDaaFileBlob(daaId)
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      const name = daaFileName || `daa-${daaId}`
      const downloadLink = document.createElement('a')
      downloadLink.href = blobUrl
      downloadLink.download = name
      document.body.appendChild(downloadLink)
      downloadLink.click()
      downloadLink.remove()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    }
    catch (error) {
      Notifications.showError({
        text: 'Unable to download data access agreement: ' + extractError(error),
      })
    }
    finally {
      setDownloadingDaaId(null)
    }
  }

  if (!referenceId) {
    return null
  }

  return (
    <div className="dar-step-card dataset-daa-relationship-card">
      <h2>{title}</h2>
      {loading && <p>Loading dataset and DAA relationships…</p>}
      {!loading && !hasRows && <p>No dataset and data access agreement relationships are available for this submission.</p>}
      {!loading && hasRows && (
        <div className="table-responsive">
          <table className="table table-striped table-hover" aria-label="dataset and data access agreement relationships">
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Dataset Identifier</th>
                <th>Data Access Agreement</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.datasetId ?? row.datasetIdentifier ?? row.datasetName}-${row.daaId ?? row.daaFileName}-${index}`}>
                  <td>{row.datasetName}</td>
                  <td>{row.datasetIdentifier || '-'}</td>
                  <td>{row.daaName || row.daaFileName || '-'}</td>
                  <td>
                    {row.daaId
                      ? (
                          <button
                            type="button"
                            className="button-link"
                            onClick={() => onDownloadAndViewDaa(row.daaId, row.daaFileName)}
                            disabled={downloadingDaaId === row.daaId}
                          >
                            {downloadingDaaId === row.daaId ? 'Preparing file…' : 'Download and view'}
                          </button>
                        )
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
