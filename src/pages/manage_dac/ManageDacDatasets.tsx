import React, { useEffect, useState, useMemo } from 'react'
import find from 'lodash/find'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { DataUseTranslation } from 'src/libs/dataUseTranslation'
import { Link, useLocation } from 'react-router-dom'
import { Dataset, DatasetProperty } from 'src/types/model'
import SimpleTable from 'src/components/SimpleTable'
import PaginationBar from 'src/components/PaginationBar'
import SearchBar from 'src/components/SearchBar'
import { Styles } from 'src/libs/theme'
import TableHeaderSection from 'src/components/TableHeaderSection'

const PAGE_SIZE = 10

export const ManageDacDatasets: React.FC = () => {
  const location = useLocation()
  const { datasets = [], dac = {} } = location.state || {}

  const [translatedDatasetRestrictions, setTranslatedDatasetRestrictions] = useState<[][]>([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState({ colIndex: 0, dir: 1 })

  useEffect(() => {
    const init = async () => {
      const translationPromises = datasets.map((dataset: Dataset) =>
        DataUseTranslation.translateDataUseRestrictions(dataset.dataUse))
      const datasetTranslations = await Promise.all(translationPromises)
      setTranslatedDatasetRestrictions(datasetTranslations)
    }
    init()
  }, [datasets])

  const getProperty = (properties: DatasetProperty[], propName: string) => {
    return find(properties, p => p.propertyName.toLowerCase() === propName.toLowerCase())
  }

  const getPropertyValue = (properties: DatasetProperty[], propName: string, defaultValue: string) => {
    const prop = getProperty(properties, propName)
    const val = get(prop, 'propertyValue', '')
    return isEmpty(val) ? <span className="disabled">{defaultValue}</span> : val
  }

  const getDbGapLinkValue = (properties: DatasetProperty[]) => {
    const href = getPropertyValue(properties, 'url', '')
    return typeof href === 'string' && href.length > 0
      ? <a href={href} target="_blank" className="enabled" rel="noreferrer">Link</a>
      : <span className="disabled">---</span>
  }

  const getStructuredUseRestrictionLink = (index: number) => {
    if (translatedDatasetRestrictions[index]) {
      const translatedDataUse = translatedDatasetRestrictions[index]
        .map((translations: { description: string }) => translations.description)
        .join('\n')
      const shortenedDataUse = translatedDataUse.length >= 75
        ? translatedDataUse.slice(0, 75) + '...'
        : translatedDataUse
      if (isEmpty(translatedDataUse)) {
        return <span className="disabled">---</span>
      }
      return <span title={translatedDataUse}>{shortenedDataUse}</span>
    }
    return <span className="disabled">---</span>
  }

  const columnHeaders = useMemo(() => {
    const headerStyle = {
      fontWeight: 600,
      fontSize: '1.1rem',
      background: '#f5f7fa',
      color: '#2a3b4d',
      padding: '8px 0',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
    }
    return [
      { label: 'Dataset ID', cellStyle: { ...headerStyle, width: 120 }, sortable: true },
      { label: 'Dataset Name', cellStyle: { ...headerStyle, width: 180 }, sortable: true },
      { label: 'URL', cellStyle: { ...headerStyle, width: 100 } },
      { label: 'Structured Data Use Limitations', cellStyle: { ...headerStyle, width: 200 } },
      { label: 'Data Type', cellStyle: { ...headerStyle, width: 120 }, sortable: true },
      { label: 'Phenotype/Indication', cellStyle: { ...headerStyle, width: 180 } },
      { label: 'Principal Investigator(PI)', cellStyle: { ...headerStyle, width: 180 } },
      { label: '# of participants', cellStyle: { ...headerStyle, width: 120 }, sortable: true },
      { label: 'Description', cellStyle: { ...headerStyle, width: 200 } },
      { label: 'Species', cellStyle: { ...headerStyle, width: 120 } },
      { label: 'Data Depositor', cellStyle: { ...headerStyle, width: 180 } },
    ]
  }, [])

  const cellWrapStyle = {
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  }

  const styles = {
    baseStyle: { display: 'flex', alignItems: 'center', minHeight: 40, ...cellWrapStyle },
    columnStyle: { display: 'flex', background: '#f5f7fa', ...cellWrapStyle },
    containerOverride: { width: '100%', overflowX: 'visible' },
  }

  // Filter and sort datasets
  const filteredDatasets = useMemo(() => {
    let filtered = datasets
    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter((dataset: Dataset) =>
        dataset.datasetIdentifier?.toLowerCase().includes(lowerSearch)
        || dataset.name?.toLowerCase().includes(lowerSearch),
      )
    }
    if (columnHeaders[sort.colIndex]?.sortable) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = ''
        let bValue = ''
        switch (sort.colIndex) {
          case 0: // Dataset ID
            aValue = a.datasetIdentifier
            bValue = b.datasetIdentifier
            break
          case 1: // Dataset Name
            aValue = a.name
            bValue = b.name
            break
          case 4: // Data Type
            aValue = getProperty(a.properties, 'Data Type')?.propertyValue || ''
            bValue = getProperty(b.properties, 'Data Type')?.propertyValue || ''
            break
          case 7: // # of participants
            aValue = getProperty(a.properties, '# of participants')?.propertyValue || ''
            bValue = getProperty(b.properties, '# of participants')?.propertyValue || ''
            break
          default:
            return 0
        }
        return sort.dir * aValue.localeCompare(bValue)
      })
    }
    return filtered
  }, [datasets, search, sort, columnHeaders])

  // Pagination
  const pageCount = Math.ceil(filteredDatasets.length / PAGE_SIZE)
  const pagedDatasets = filteredDatasets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const rowData = pagedDatasets.map((dataset: Dataset, index: number) => [
    { data: <Link to={`/dataset/${dataset.datasetIdentifier}`}>{dataset.datasetIdentifier}</Link> },
    { data: dataset.name },
    { data: getDbGapLinkValue(dataset.properties) },
    { data: getStructuredUseRestrictionLink(index) },
    { data: getPropertyValue(dataset.properties, 'Data Type', '---') },
    { data: getPropertyValue(dataset.properties, 'Phenotype/Indication', '---') },
    { data: dataset?.study?.piName || getPropertyValue(dataset.properties, 'Principal Investigator(PI)', '---') },
    { data: getPropertyValue(dataset.properties, '# of participants', '---') },
    { data: getPropertyValue(dataset.properties, 'Description', '---') },
    { data: getPropertyValue(dataset.properties, 'Species', '---') },
    { data: getPropertyValue(dataset.properties, 'Data Depositor', '---') },
  ])

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title={`DAC Datasets associated with DAC: ${dac.name}`}
          description={undefined}
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar
          placeholder="Search by Dataset ID or Name"
          handleSearchChange={(value: string) => {
            setSearch(value)
            setCurrentPage(1)
          }}
        />
      </div>
      <div style={{ marginTop: '3rem' }}>
        <SimpleTable
          rowData={rowData}
          columnHeaders={columnHeaders}
          styles={styles}
          tableSize={rowData.length}
          paginationBar={(
            <PaginationBar
              pageCount={pageCount}
              currentPage={currentPage}
              tableSize={PAGE_SIZE}
              goToPage={(page: number) => {
                const safePage = Math.max(1, Math.min(page, pageCount))
                setCurrentPage(safePage)
              }}
              changeTableSize={() => {}}
            />
          )}
          sort={sort}
          onSort={setSort}
          isLoading={false}
        />
      </div>
    </div>
  )
}
