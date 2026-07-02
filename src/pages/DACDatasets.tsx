import React, { useCallback, useEffect, useState } from 'react'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Storage } from 'src/libs/storage'
import { Styles } from 'src/libs/theme'
import SearchBar from 'src/components/SearchBar'
import { DACDatasetsTable } from 'src/components/dac_dataset_table/DACDatasetsTable'
import { DACDatasetTableColumnOptions } from 'src/components/dac_dataset_table/DACDatasetConstants.js'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList } from 'src/libs/utils'
import { consoleTypes } from 'src/components/dac_dataset_table/DACDatasetTableCellData'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import { DatasetTerm } from 'src/types/model'
import { ElasticsearchQuery } from 'src/types/elastic'

export default function DACDatasets() {
  usePageTitle('My DAC\'s Datasets')
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState<DatasetTerm[]>([])
  const [filteredList, setFilteredList] = useState<DatasetTerm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleSearchChange = useCallback(
    (searchTerms: string) => searchOnFilteredList(
      searchTerms,
      datasets,
      getSearchFilterFunctions().datasetTerms,
      setFilteredList,
    ),
    [datasets],
  )

  useEffect(() => {
    const init = async () => {
      try {
        const user = Storage.getCurrentUser()
        const dacIds = user.roles?.map(r => r.dacId).filter(id => id !== undefined) ?? []
        const query = {
          from: 0,
          size: 10000,
          query: {
            terms: {
              dacId: dacIds,
            },
          },
        } as unknown as ElasticsearchQuery
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
        catch {
          Notifications.showError({ text: 'Failed to load Elasticsearch index' })
        }
        setIsLoading(false)
      }
      catch {
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
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar
          handleSearchChange={handleSearchChange}
        />
        <AddObjectButton
          id="add-dataset-btn"
          label="ADD DATASET"
          onClick={() => navigate('/data_submission_form')}
          icon={<AddCircleOutlineOutlinedIcon />}
          className="button button-blue"
        />
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
