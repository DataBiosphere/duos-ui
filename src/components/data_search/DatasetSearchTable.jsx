import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import * as React from 'react'
import { Box, Button } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { isArray, isEmpty, chain, intersection, clone, capitalize, debounce, isEqual } from 'lodash'
import { applyForAccess } from 'src/utils/accessUtils.js'
import { defaultFilters } from 'src/components/data_search/DatasetFilterConstants'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { DatasetSearchTableDisplay } from 'src/components/data_search/DatasetSearchTableDisplay'
import { datasetSearchTableTabs } from 'src/components/data_search/DatasetSearchTableConstants'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DataSet } from 'src/libs/ajax/DataSet'
import DatasetFilterList from 'src/components/data_search/DatasetFilterList'
import { Notifications } from 'src/libs/utils'
import { DatasetSearchFooter } from 'src/components/data_search/DatasetSearchFooter'
import { useNavigate } from 'react-router-dom'
import SearchBar from 'src/components/SearchBar'
import { Styles } from 'src/libs/theme.js'
import PropTypes from 'prop-types'

const styles = {
  subTab: {
    padding: '0 25px',
    fontSize: '15px',
    textTransform: 'none',
    fontFamily: 'Montserrat, sans-serif',
    color: '#00609f',
  },
  subTabActive: {
    fontWeight: 'bold',
    borderBottom: `5px solid #00609f`,
  },
}

export const DatasetSearchTable = (props) => {
  const navigate = useNavigate()
  const { datasets, icon, title, assembleFullQuery: assembleBaseQuery, isSigningOfficial, isInstitutionQuery } = props
  const [exportableDatasets, setExportableDatasets] = useState({})
  const [filters, setFilters] = useState(defaultFilters(datasets))
  const [filtered, setFiltered] = useState(datasets)
  const [selected, setSelected] = useState([])
  const [selectedTable, setSelectedTable] = useState(datasetSearchTableTabs.dataset)
  const [searchTerm, setSearchTerm] = useState('')
  const searchRef = useRef('')
  const hasRunInitialSearch = useRef(false)

  const isFilteredArray = (filter, category) => (filters[category]).indexOf(filter) > -1

  const anyFiltersSelected = filters =>
    Object.values(filters).some((filter) => {
      return isArray(filter) ? filter.length > 0 : filter !== null
    })

  const getExportableDatasets = async (datasets) => {
    // Note the dataset identifier is in each sub-table row.
    const datasetIdentifiers = datasets.map(row => row.datasetIdentifier)
    const snapshots = await TerraDataRepo.listSnapshotsByDatasetIds(datasetIdentifiers)
    if (snapshots.filteredTotal > 0) {
      const datasetIdToSnapshot = chain(snapshots.items)
        // Ignore any snapshots that a user does not have export (steward or reader) to
        .filter(snapshot => intersection(snapshots.roleMap[snapshot.id], ['steward', 'reader']).length > 0)
        .groupBy('duosId')
        .value()
      setExportableDatasets(datasetIdToSnapshot)
    }
  }

  const assembleFullQuery = useCallback(() => {
    let searchModifier = null

    // do not apply search modifier if there is no search term
    if (searchTerm.length > 0) {
      searchModifier = {
        multi_match: {
          query: searchTerm,
          type: 'phrase_prefix',
          fields: [
            'datasetName',
            'dataLocation',
            'study.description',
            'study.studyName',
            'study.species',
            'study.piName',
            'study.dataCustodianEmail',
            'study.dataTypes',
            'dataUse.primary.code',
            'dataUse.secondary.code',
            'dac.dacName',
            'datasetIdentifier',
          ],
        },
      }
    }

    // Get base query with visibility modifiers from parent
    const baseQuery = assembleBaseQuery(isSigningOfficial, isInstitutionQuery, searchModifier)

    // Add filter layer if any filters are selected
    let filterQuery = {}
    if (anyFiltersSelected(filters)) {
      const filterTerms = []

      filterTerms.push({
        bool: {
          should:
              filters.accessManagement.map(term => ({
                term: {
                  accessManagement: term,
                },
              })),
        },
      })

      filterTerms.push({
        bool: {
          should:
              filters.dataUse.map(term => ({
                match: {
                  'dataUse.primary.code': term,
                },
              })),
        },
      })

      filterTerms.push({
        bool: {
          should:
              filters.dataType.map(term => ({
                match: {
                  'study.dataTypes': term,
                },
              })),
        },
      })

      filterTerms.push({
        bool: {
          should:
              filters.dac.map(term => ({
                match_phrase: {
                  'dac.dacName': term,
                },
              })),
        },
      })

      filterTerms.push({
        range: {
          participantCount: {
            gte: filters.participantCountMin,
            lte: filters.participantCountMax,
          },
        },
      })

      if (filterTerms.length > 0) {
        filterQuery = [
          {
            bool: {
              must: filterTerms,
            },
          },
        ]
      }
    }

    // Add filter layer to base query if filters are present
    if (Object.keys(filterQuery).length > 0) {
      return {
        ...baseQuery,
        query: {
          ...baseQuery.query,
          bool: {
            ...baseQuery.query.bool,
            filter: filterQuery,
          },
        },
      }
    }
  }, [searchTerm, filters, assembleBaseQuery, isSigningOfficial, isInstitutionQuery])

  const filterHandler = (category, filter) => {
    let newFilter
    if (isArray(filters[category])) {
      if (!isFilteredArray(filter, category) && filter !== '') {
        newFilter = filters[category].concat(filter)
      }
      else {
        newFilter = filters[category].filter(f => f !== filter)
      }
    }
    else {
      newFilter = filter
    }
    const newFilters = clone(filters)
    newFilters[category] = newFilter
    setFilters(newFilters)
  }

  useEffect(() => {
    if (isEmpty(datasets)) {
      return
    }
    // Calling setState inside this effect is intentional: it updates
    // derived state from `datasets` when they arrive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getExportableDatasets(datasets)
  }, [datasets])

  const abortControllerRef = useRef(null)

  const searchAndFilter = useCallback((fullQuery) => {
    // Cancel any pending debounced calls
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    DataSet.searchDatasetIndex(fullQuery, { signal })
      .then((filteredDatasets) => {
        if (!signal.aborted) {
          const newFiltered = datasets.filter(value => filteredDatasets.some(item => isEqual(item, value)))
          setFiltered(newFiltered)
        }
      })
      .catch((error) => {
        // Don't show error for aborted requests
        if (error.name !== 'AbortError' && !signal.aborted) {
          Notifications.showError({ text: 'Failed to load Elasticsearch index' })
        }
      })
  }, [datasets])

  const handleSearchChange = useCallback(searchTerms => setSearchTerm(searchTerms), [])

  // Create a ref for the debounced function
  const debouncedSearchAndFilter = useRef()

  // Update the debounced function when searchAndFilter changes
  useEffect(() => {
    debouncedSearchAndFilter.current = debounce((fullQuery) => {
      searchAndFilter(fullQuery)
    }, 150)
    return () => {
      debouncedSearchAndFilter.current.cancel()
    }
  }, [searchAndFilter])

  // Use debounced function in effect
  useEffect(() => {
    if (!hasRunInitialSearch.current) {
      hasRunInitialSearch.current = true
      // Intentionally setting initial filtered state from datasets.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiltered(datasets)
      return
    }

    const fullQuery = assembleFullQuery()
    try {
      debouncedSearchAndFilter.current(fullQuery)
    }
    catch (_error) {
      Notifications.showError({ text: 'Failed to load Elasticsearch index' })
    }

    // Cleanup: abort request if component unmounts or dependencies change
    return () => {
      if (debouncedSearchAndFilter.current) debouncedSearchAndFilter.current.cancel()
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [filters, searchTerm, searchAndFilter, assembleFullQuery, datasets])

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <TableHeaderSection
          icon={{ src: icon }}
          title={title}
          description={
  <>
    Search and filter datasets. For controlled access, select the dataset(s) you desire then click 'Apply for Access.' Open access data does 
    <br />
    not require access requests. External data requires an access request in the host repository (which is linked on the dataset page).
  </>
}
        />
        <Box sx={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
          <SearchBar
            handleSearchChange={handleSearchChange}
            searchRef={searchRef}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', padding: '0 5rem', marginTop: '1rem', borderBottom: '1px solid black' }}>
          <Tabs
            value={false}
            orientation="horizontal"
            TabIndicatorProps={{ style: { background: '#00609f' } }}
          >
            {Object.values(datasetSearchTableTabs).map(tab => (
              <Tab
                key={tab.key}
                label={`View By ${capitalize(tab.plural)}`}
                style={{
                  ...styles.subTab,
                  ...(tab.key === selectedTable.key ? styles.subTabActive : {}),
                }}
                onClick={() => setSelectedTable(tab)}
                component={Button}
              />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', paddingTop: '2em' }}>
          <Box sx={{ width: '14%', padding: '0 1em' }}>
            <DatasetFilterList datasets={datasets} filterHandler={filterHandler} filters={filters} isFiltered={isFilteredArray} onClear={() => setFilters(defaultFilters(datasets))} />
          </Box>
          <Box sx={{ width: '85%', padding: '0 1em' }}>
            {(() => {
              if (isEmpty(datasets)) {
                return (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}
                  >
                    <h1>No datasets registered for this library.</h1>
                  </Box>
                )
              }
              else {
                return <DatasetSearchTableDisplay key={selectedTable.key} tab={selectedTable} onSelect={setSelected} filteredData={filtered} selected={selected} exportableDatasets={exportableDatasets} />
              }
            })()}
          </Box>
        </Box>
        <Box sx={{ padding: '1em' }} />
        {!isEmpty(selected) && <DatasetSearchFooter selectedDatasets={selected} datasets={datasets} onClick={() => applyForAccess(selected, navigate)} />}
      </Box>
    </>
  )
}

DatasetSearchTable.propTypes = {
  datasets: PropTypes.array.isRequired,
  icon: PropTypes.string,
  title: PropTypes.string,
}

export default DatasetSearchTable
