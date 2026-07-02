import React, { Fragment, useCallback, useEffect, useState } from 'react'
import { Styles } from 'src/libs/theme'
import SimpleTable, { CellData, ColumnHeader, TableStyles } from 'src/components/SimpleTable'
import 'src/pages/dar_application/dar_application.css'
import { binCollectionToBuckets, Bucket } from 'src/utils/BucketUtils'
import { flatten, isEmpty } from 'src/utils/NodashUtil'
import { Notifications } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'
import { DacTerm, Dataset } from 'src/types/model'

const commonStyles: TableStyles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    borderWidth: '1px 0 1px 0',
  },
  columnStyle: {
    ...Styles.TABLE.HEADER_ROW, justifyContent: 'space-between',
    color: '#7B7B7B',
    fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    border: 'none',
    margin: 0,
  },
  containerOverride: {
    width: '100%',
    border: '1px solid black',
    borderWidth: '1px 1px 0 1px',
  },
}

const headerStyles = {
  ...commonStyles,
  cellWidth: {
    dataUseCodes: '20%',
    dataUseSummary: '80%',
  },
}

const columnStyles = {
  ...commonStyles,
  cellWidth: {
    datasetId: '20%',
    datasetName: '30%',
    whichDac: '20%',
    acknowledgment: '30%',
  },
}

const columnConfig: Record<string, ColumnHeader> = {
  datasetId: {
    label: 'Dataset ID',
    cellStyle: { width: columnStyles.cellWidth.datasetId },
    sortable: false,
  },
  datasetName: {
    label: 'Dataset Name',
    cellStyle: { width: columnStyles.cellWidth.datasetName },
    sortable: false,
  },
  whichDac: {
    label: 'DAC',
    cellStyle: { width: columnStyles.cellWidth.whichDac },
    sortable: false,
  },
  acknowledgment: {
    label: 'Acknowledgment',
    cellStyle: { width: columnStyles.cellWidth.acknowledgment },
    sortable: false,
  },
}

const columnHeaderData = (columns: Record<string, ColumnHeader>): ColumnHeader[] => {
  return Object.values(columns)
}

export interface DucAddendumProps {
  datasets: Dataset[]
  isLoading: boolean
  save: () => void
  doSubmit: () => void
}

export default function DucAddendum(props: Readonly<DucAddendumProps>) {
  const { datasets, isLoading, save, doSubmit } = props

  const [dacs, setDacs] = useState<DacTerm[]>([])
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [ducAddendumTable, setDucAddendumTable] = useState<React.ReactNode[]>([])

  const getBuckets = useCallback(async () => {
    if (isEmpty(datasets)) {
      setBuckets([])
      return
    }
    try {
      const fetchedBuckets = await binCollectionToBuckets({ datasets })
      const dataAccessBuckets = fetchedBuckets.filter(
        bucket => bucket.isRP !== true,
      )
      setBuckets(dataAccessBuckets)
      setDacs(dataAccessBuckets.flatMap(bucket => bucket.dacs ?? []))
    }
    catch (error) {
      const errorMessage = extractError(error)
      Notifications.showError({ text: 'Error retrieving datasets for addendum table: ' + errorMessage })
    }
  }, [datasets])

  useEffect(() => {
    const init = async () => {
      await getBuckets()
    }
    void init()
  }, [getBuckets])

  const buildDucAddendumTable = useCallback(async () => {
    const getDacName = (dacId: number): string => {
      const dac = dacs.find(candidate => candidate.dacId === dacId)
      return dac?.dacName ?? 'N/A'
    }

    const tableChunks = buckets.map((bucket) => {
      const dataUseCodes = bucket.label
      const dataUseSummary = (bucket.dataUses ?? []).map(dataUse => dataUse.description).join('. ')

      const headerConfig: Record<string, ColumnHeader> = {
        dataUseCodes: {
          label: dataUseCodes,
          cellStyle: { width: headerStyles.cellWidth.dataUseCodes, color: '#337ab7', fontSize: '1.6rem', margin: '1rem' },
          sortable: false,
        },
        dataUseSummary: {
          label: dataUseSummary,
          cellStyle: { width: headerStyles.cellWidth.dataUseSummary, color: '#000000' },
          sortable: false,
        },
      }

      const datasetData: CellData[][] = bucket.datasets.map((dataset) => {
        return [
          {
            data: dataset.datasetIdentifier,
            id: dataset.datasetId,
            style: columnStyles.baseStyle,
          },
          {
            data: dataset.datasetName?.replaceAll('_', '_\u200b'),
            id: dataset.datasetId,
            style: columnStyles.baseStyle,
          },
          {
            data: getDacName(dataset.dacId),
            id: dataset.datasetId,
            style: columnStyles.baseStyle,
          },
          {
            data: '',
            id: dataset.datasetId,
            style: columnStyles.baseStyle,
          },
        ]
      })

      return (
        <Fragment key={`duc-addendum-bucket-${dataUseCodes}`}>
          <Fragment key="duc-addendum-column-headers">
            <SimpleTable
              isLoading={isLoading}
              columnHeaders={columnHeaderData(headerConfig)}
              rowData={[]}
              styles={headerStyles}
            />
          </Fragment>
          <Fragment key="duc-addendum-table-data">
            <SimpleTable
              isLoading={false}
              columnHeaders={columnHeaderData(columnConfig)}
              rowData={datasetData}
              styles={columnStyles}
            />
          </Fragment>
        </Fragment>
      )
    })

    tableChunks.push(
      <div
        key="duc-addendum-table-divider"
        style={{
          borderTop: '1px solid black',
          borderWidth: '1px 0 0 0',
        }}
      />,
    )
    const fullTable = flatten<React.ReactNode>(tableChunks)
    setDucAddendumTable(fullTable)
  }, [buckets, isLoading, dacs])

  useEffect(() => {
    const init = async () => {
      await buildDucAddendumTable()
    }
    void init()
  }, [buildDucAddendumTable])

  return (
    <div className="dar-step-card">
      <h2>Addendum</h2>
      <h3 style={{ marginBottom: '2rem' }}>Please review the datasets you requested grouped by their data use terms below, and click &quot;Submit&quot; below to send your data access request to the DAC(s).</h3>

      <div className="table-container">{ducAddendumTable}</div>

      <div className="flex flex-row" style={{ justifyContent: 'flex-start', paddingTop: '4rem' }}>
        <button type="button" id="btn_openSubmitModal" onClick={() => doSubmit()} className="button button-blue" style={{ marginRight: '2rem' }}>Submit</button>
        <button type="button" id="btn_save" onClick={() => save()} className="button button-white">Save</button>
      </div>
    </div>
  )
}
