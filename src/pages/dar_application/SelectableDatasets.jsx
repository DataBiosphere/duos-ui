import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import DeleteIcon from '@mui/icons-material/Delete'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'
import { DownloadLink } from 'src/components/DownloadLink'
import { DAAUtils } from 'src/utils/DAAUtils'

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
  const { datasets, setSelectedDatasets, disabled } = props
  const [removedIds, setRemovedIds] = useState([])
  const [daaByDacId, setDaaByDacId] = useState({})

  useEffect(() => {
    if (!DAAUtils.isEnabled()) {
      return
    }

    let isMounted = true

    const loadDaas = async () => {
      try {
        const daaList = await DAA.getDaas()
        if (!isMounted) {
          return
        }
        setDaaByDacId(buildDaaByDacId(daaList))
      }
      catch (error) {
        Notifications.showError({
          text: 'Unable to load data access agreements: ' + extractError(error),
        })
      }
    }

    loadDaas()

    return () => {
      isMounted = false
    }
  }, [])

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
    const daaForDataset = ds.dacId ? daaByDacId[ds.dacId] : undefined

    return (
      <div
        id={ds.datasetIdentifier + '_name'}
        style={{ display: 'flex', alignItems: 'center', flex: '1 1 100%', marginRight: '1.5rem' }}
      >
        <div style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{ds.datasetIdentifier}</div>
        <div>|</div>
        <div style={{ marginLeft: '0.5rem' }}>{ds.datasetName}</div>
        {DAAUtils.isEnabled() && (
          <>
            <div style={{ marginLeft: '1rem' }}>|</div>
            <div style={{ marginLeft: '1rem' }}>
              {daaForDataset
                ? (
                    <DownloadLink
                      label={daaForDataset.fileName}
                      onDownload={event => onDaaLinkClick(event, daaForDataset.daaId, daaForDataset.fileName)}
                    />
                  )
                : '-'}
            </div>
          </>
        )}
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
}
