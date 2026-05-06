import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import DeleteIcon from '@mui/icons-material/Delete'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'
import { DAR } from 'src/libs/ajax/DAR'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'
import { DownloadLink } from 'src/components/DownloadLink'

const NO_SNAPSHOT_MESSAGE = 'The DUOS Library Card Agreements in effect at the time this request was made apply.'

const getSnapshotDatasetId = (snapshot) => {
  const value = snapshot?.datasetId ?? snapshot?.dataset?.datasetId
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const getSnapshotDatasetIdentifier = (snapshot) => {
  const value = snapshot?.datasetIdentifier ?? snapshot?.dataset?.datasetIdentifier
  return (typeof value === 'string' && value.trim().length > 0) ? value : undefined
}

const getSnapshotDaaId = (snapshot) => {
  const value = snapshot?.daaId ?? snapshot?.daa?.daaId
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const getSnapshotDaaFileName = (snapshot, daaId, daaFileNameByDaaId) => {
  return daaFileNameByDaaId[daaId]
    || snapshot?.daaFileName
    || snapshot?.fileName
    || snapshot?.daaFile?.fileName
    || snapshot?.daa?.file?.fileName
    || (daaId ? `daa-${daaId}` : '')
}

const buildDaaMapsFromSnapshots = (snapshotList, daaFileNameByDaaId) => {
  const nextDaaByDatasetId = {}
  const nextDaaByDatasetIdentifier = {}

  for (const snapshot of snapshotList) {
    const datasetId = getSnapshotDatasetId(snapshot)
    const datasetIdentifier = getSnapshotDatasetIdentifier(snapshot)

    const daaId = getSnapshotDaaId(snapshot)
    if (!daaId) {
      continue
    }

    const daaDetails = {
      daaId,
      fileName: getSnapshotDaaFileName(snapshot, daaId, daaFileNameByDaaId),
    }

    if (datasetId && !nextDaaByDatasetId[datasetId]) {
      nextDaaByDatasetId[datasetId] = daaDetails
    }

    if (datasetIdentifier && !nextDaaByDatasetIdentifier[datasetIdentifier]) {
      nextDaaByDatasetIdentifier[datasetIdentifier] = daaDetails
    }
  }

  return {
    byDatasetId: nextDaaByDatasetId,
    byDatasetIdentifier: nextDaaByDatasetIdentifier,
  }
}

const buildDaaFileNameByDaaId = (daaList) => {
  const nextFileNameByDaaId = {}

  for (const daa of daaList) {
    if (!daa?.daaId) {
      continue
    }

    const rawFileName = daa.file?.fileName || ''
    nextFileNameByDaaId[daa.daaId] = rawFileName || `daa-${daa.daaId}`
  }

  return nextFileNameByDaaId
}

const buildSnapshotList = (response) => {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.datasetDaaSnapshots)) {
    return response.datasetDaaSnapshots
  }

  // Some snapshot endpoints return a map keyed by datasetId string:
  // { "1969": { daaId: 36, capturedAt: ... } }
  if (response && typeof response === 'object') {
    const entries = Object.entries(response)
    const mappedEntries = []

    for (const [datasetIdKey, snapshotValue] of entries) {
      if (!snapshotValue || typeof snapshotValue !== 'object') {
        continue
      }

      const parsedDatasetId = Number(datasetIdKey)
      mappedEntries.push({
        datasetId: Number.isInteger(parsedDatasetId) && parsedDatasetId > 0
          ? parsedDatasetId
          : undefined,
        ...snapshotValue,
      })
    }

    return mappedEntries
  }

  return []
}

const buildDaaByDacId = (daaList) => {
  const nextDaaByDacId = {}

  for (const daa of daaList) {
    if (!daa?.daaId || !Array.isArray(daa.dacs)) {
      continue
    }

    for (const dac of daa.dacs) {
      if (!dac?.dacId || nextDaaByDacId[dac.dacId]) {
        continue
      }

      const rawFileName = daa.file?.fileName || ''
      nextDaaByDacId[dac.dacId] = {
        daaId: daa.daaId,
        fileName: rawFileName || `daa-${daa.daaId}`,
      }
    }
  }

  return nextDaaByDacId
}

export default function SelectableDatasets(props) {
  const { datasets, setSelectedDatasets, disabled, referenceId } = props
  const [removedIds, setRemovedIds] = useState([])
  const [daaByDacId, setDaaByDacId] = useState({})
  const [daaByDatasetId, setDaaByDatasetId] = useState({})
  const [daaByDatasetIdentifier, setDaaByDatasetIdentifier] = useState({})
  const [snapshotNotFound, setSnapshotNotFound] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadCurrentDaas = async () => {
      try {
        if (!disabled) {
          setSnapshotNotFound(false)
        }
        const daaList = await DAA.getDaas()
        if (!isMounted) {
          return {}
        }
        setDaaByDacId(buildDaaByDacId(daaList))
        return buildDaaFileNameByDaaId(daaList)
      }
      catch (error) {
        if (error?.response?.status === 404) {
          setDaaByDacId({})
          if (disabled) {
            setSnapshotNotFound(true)
          }
          return {}
        }

        Notifications.showError({
          text: 'Unable to load data access agreements: ' + extractError(error),
        })
        return {}
      }
    }

    const loadSnapshotDaas = async (fileNameByDaaId = {}) => {
      if (!referenceId) {
        setDaaByDatasetId({})
        setDaaByDatasetIdentifier({})
        setSnapshotNotFound(false)
        return
      }

      try {
        setSnapshotNotFound(false)
        const response = await DAR.getDatasetDaaSnapshots(referenceId)
        if (!isMounted) {
          return
        }

        const snapshotList = buildSnapshotList(response)

        const snapshotMaps = buildDaaMapsFromSnapshots(snapshotList, fileNameByDaaId)
        setDaaByDatasetId(snapshotMaps.byDatasetId)
        setDaaByDatasetIdentifier(snapshotMaps.byDatasetIdentifier)
      }
      catch (error) {
        if (error?.response?.status === 404) {
          setDaaByDatasetId({})
          setDaaByDatasetIdentifier({})
          setSnapshotNotFound(true)
          return
        }

        Notifications.showError({
          text: 'Unable to load dataset and DAA snapshot relationships: ' + extractError(error),
        })
      }
    }

    if (disabled) {
      ;(async () => {
        const fileNameByDaaId = await loadCurrentDaas()
        if (!isMounted) {
          return
        }
        await loadSnapshotDaas(fileNameByDaaId)
      })()
    }
    else {
      loadCurrentDaas()
    }

    return () => {
      isMounted = false
    }
  }, [disabled, referenceId])

  const updateLocalState = (ds) => {
    let newRemovedIds = []
    if (removedIds.includes(ds.datasetId)) {
      newRemovedIds = removedIds.toSpliced(removedIds.indexOf(ds.datasetId), 1)
    }
    else {
      newRemovedIds = removedIds.concat(ds.datasetId)
    }
    setRemovedIds(newRemovedIds)
    // Populate parent state with the current state of datasets to be saved to the DAR
    const newSelectedDatasets = datasets.filter(ds => !newRemovedIds.includes(ds.datasetId))
    setSelectedDatasets(newSelectedDatasets)
  }

  const onDaaLinkClick = async (event, daaId, fileName) => {
    event.preventDefault()
    event.stopPropagation()
    if (!daaId) {
      return
    }

    try {
      await DAA.getDaaFileById(daaId, fileName)
    }
    catch (error) {
      Notifications.showError({
        text: 'Unable to download data access agreement: ' + extractError(error),
      })
    }
  }

  const datasetDescriptionDiv = (ds) => {
    let daaForDataset
    if (disabled) {
      daaForDataset = (ds.datasetId ? daaByDatasetId[ds.datasetId] : undefined)
        || (ds.datasetIdentifier ? daaByDatasetIdentifier[ds.datasetIdentifier] : undefined)
    }
    else {
      daaForDataset = ds.dacId ? daaByDacId[ds.dacId] : undefined
    }

    let daaText = '-'
    if (disabled && snapshotNotFound) {
      daaText = NO_SNAPSHOT_MESSAGE
    }

    return (
      <div
        id={ds.datasetIdentifier + '_name'}
        style={{ display: 'flex', alignItems: 'center', flex: '1 1 100%', marginRight: '1.5rem' }}
      >
        <div style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{ds.datasetIdentifier}</div>
        <div>|</div>
        <div style={{ marginLeft: '0.5rem' }}>{ds.datasetName}</div>
        <div style={{ marginLeft: '1rem' }}>|</div>
        <div style={{ marginLeft: '1rem' }}>
          {daaForDataset
            ? (
                <DownloadLink
                  label={daaForDataset.fileName}
                  onDownload={event => onDaaLinkClick(event, daaForDataset.daaId, daaForDataset.fileName)}
                />
              )
            : daaText}
        </div>
      </div>
    )
  }

  const deletableStyled = (ds) => {
    const isDeletable = removedIds.length < datasets.length - 1
    const clickable = isDeletable && !disabled
    return (
      <div
        key={'selectable_dataset_' + ds.datasetId}
        id={ds.datasetIdentifier + '_summary'}
        className="collaborator-summary-card"
        style={disabled ? {} : { cursor: 'pointer' }}
        {...(clickable ? { onClick: () => updateLocalState(ds) } : {})}
      >
        {datasetDescriptionDiv(ds)}
        <span id={'remove_dataset_' + ds.datasetId} style={{ marginLeft: 10 }}>
          {!disabled && (
            <DeleteIcon
              data-tip="Delete dataset"
              data-for={removedIds.length === (datasets.length - 1) && !removedIds.includes(ds.datasetId) ? 'tip_last' : ''}
              style={{
                color: '#0948B7',
                fontSize: '2.3rem',
                verticalAlign: 'middle',
                opacity: removedIds.length === (datasets.length - 1) && !removedIds.includes(ds.datasetId) ? 0.5 : 1,
              }}
            />
          )}
          {!isDeletable
            && (
              <ReactTooltip id="tip_last" place="right">
                The last dataset can not be deleted
              </ReactTooltip>
            )}
          <span style={{ marginLeft: '1rem' }}></span>
        </span>
      </div>
    )
  }

  const unDeletableStyled = (ds) => {
    const style = disabled
      ? { backgroundColor: 'lightgray', opacity: 0.5 }
      : { backgroundColor: 'lightgray', opacity: 0.5, cursor: 'pointer' }
    return (
      <div
        key={'selectable_dataset_' + ds.datasetId}
        id={ds.datasetIdentifier + '_summary'}
        className="collaborator-summary-card"
        style={style}
        {...(disabled ? {} : { onClick: () => updateLocalState(ds) })}
      >
        {datasetDescriptionDiv(ds)}
        <span id={'restore_dataset_' + ds.datasetId} style={{ marginLeft: 10 }}>
          {!disabled && <RestoreFromTrashIcon style={{ color: '#0948B7', fontSize: '2.3rem', verticalAlign: 'middle' }} />}
          <span style={{ marginLeft: '1rem' }}></span>
        </span>
      </div>
    )
  }

  const datasetList = () => {
    return datasets.map((ds) => {
      return removedIds.includes(ds.datasetId)
        ? unDeletableStyled(ds)
        : deletableStyled(ds)
    })
  }

  return (
    <div data-cy="selectable-datasets">
      {datasetList()}
    </div>
  )
}

SelectableDatasets.propTypes = {
  datasets: PropTypes.arrayOf(PropTypes.shape({
    datasetId: PropTypes.number,
    datasetIdentifier: PropTypes.string,
    datasetName: PropTypes.string,
    dacId: PropTypes.number,
  })).isRequired,
  setSelectedDatasets: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  referenceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}
