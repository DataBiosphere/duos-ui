import React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DataSet } from '../libs/ajax/DataSet'
import { Storage } from '../libs/storage'
import { Styles } from '../libs/theme'
import SearchBar from '../components/SearchBar'
import { DACDatasetsTable } from '../components/dac_dataset_table/DACDatasetsTable'
import { DACDatasetTableColumnOptions } from '../components/dac_dataset_table/DACDatasetConstants.js'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList } from '../libs/utils'
import { consoleTypes } from '../components/dac_dataset_table/DACDatasetTableCellData'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton.tsx'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

export default function DACDatasets() {
  usePageTitle('My DAC\'s Datasets')
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const searchRef = useRef('')

  const handleSearchChange = useCallback(searchTerms => searchOnFilteredList(
    searchTerms,
    datasets,
    getSearchFilterFunctions().datasets,
    setFilteredList,
  ), [datasets])

  useEffect(() => {
    const init = async () => {
      try {
        const user = Storage.getCurrentUser()
        const dacIds = user.roles?.map(r => r.dacId).filter(id => id !== undefined)
        const query = {
          from: 0,
          size: 10000,
          query: {
            terms: {
              dacId: dacIds,
            },
          },
        }
        setIsLoading(true)
        try {
          if (dacIds.length === 0) {
            Notifications.showError({ text: 'User does not have any DAC associations' })
          }
          else {
            const datasetTerms = await DataSet.searchDatasetIndex(query)
            setDatasets(datasetTerms)
            setFilteredList(datasetTerms)
          }
        }
        catch (_error) {
          Notifications.showError({ text: 'Failed to load Elasticsearch index' })
        }
        setIsLoading(false)
      }
      catch (_error) {
        Notifications.showError({ text: 'Error initializing datasets table' })
      }
    }
    init()
  }, [])

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="My DAC's Datasets"
          description="View the status of datasets submitted to your Data Access Committee"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', margin: '1rem -5rem 0 2rem' }}>
          <SearchBar
            handleSearchChange={handleSearchChange}
            searchRef={searchRef}
          />
          <AddObjectButton
            id="add-dataset-btn"
            label="ADD DATASET"
            onClick={() => navigate('/data_submission_form')}
            icon={<AddCircleOutlineIcon />}
            className="button button-blue"
          />
        </div>
      </div>
      <DACDatasetsTable
        datasets={filteredList}
        columns={[
          DACDatasetTableColumnOptions.DUOS_ID,
          DACDatasetTableColumnOptions.PHS_ID,
          DACDatasetTableColumnOptions.DATASET_NAME,
          DACDatasetTableColumnOptions.STUDY_NAME,
          DACDatasetTableColumnOptions.DATA_SUBMITTER,
          DACDatasetTableColumnOptions.DATA_CUSTODIAN,
          DACDatasetTableColumnOptions.DATA_USE,
          DACDatasetTableColumnOptions.CERTIFICATION_LINK,
          DACDatasetTableColumnOptions.STATUS,
        ]}
        isLoading={isLoading}
        consoleType={consoleTypes.CHAIR}
      />
    </div>
  )
}
