import React, { useEffect, useState } from 'react'
import { filter, includes, isNil } from 'lodash/fp'
import { DacTerm, Dataset, DuosUser } from 'src/types/model'
import { Link } from 'react-router-dom'
import { Storage } from 'src/libs/storage'

type DatasetsRequestedPanelProps = {
  readonly bucketDatasets: Dataset[]
  readonly dacs?: DacTerm[]
  readonly dacDatasetIds?: number[]
  readonly isLoading: boolean
  readonly adminPage: boolean
}

type SectionHeadingProps = {
  isLoading: boolean
  datasetCount: number
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ isLoading, datasetCount }) => (
  <div style={styles.heading}>
    Datasets Requested
    {!isLoading && (
      <span style={styles.datasetCount} data-cy="dataset-count">
        ({datasetCount})
      </span>
    )}
  </div>
)

type DatasetListProps = {
  visibleDatasets: Dataset[]
  isLoading: boolean
  dacs?: DacTerm[]
  styles: typeof styles
}

const DatasetList: React.FC<DatasetListProps> = ({ visibleDatasets, isLoading, dacs, styles }) => {
  const datasetId = (dataset: Dataset) => !isNil(dataset.datasetIdentifier) ? dataset.datasetIdentifier : '- -'
  const datasetName = (dataset: Dataset) => !isNil(dataset.name) ? dataset.name : '- -'
  const user: DuosUser = Storage.getCurrentUser()
  const userIsChair: boolean = user.isChairPerson

  const datasetRows = visibleDatasets.map((dataset: Dataset) => {
    const dac = dacs?.find(dacItem => dacItem.dacId === dataset.dacId)
    const dacLink = userIsChair
      ? (
          <Link to={`/manage_edit_dac/${dac?.dacId}`}>
            {dac?.dacName}
          </Link>
        )
      : dac?.dacName
    const datasetLink = (
      <Link to={`/dataset/DUOS-D${dataset.datasetId}`}>
        {datasetId(dataset)}
      </Link>
    )
    return (
      <tr key={dataset.datasetId}>
        <td>{datasetLink}</td>
        <td>{datasetName(dataset)}</td>
        <td>{dacLink}</td>
      </tr>
    )
  })

  return isLoading
    ? (
        <div className="text-placeholder" style={styles.skeletonLoader} />
      )
    : (
        <div data-cy="dataset-list">
          <table style={{ width: '-webkit-fill-available' }}>
            <thead>
              <tr>
                <th>Dataset Identifier</th>
                <th>Dataset Name</th>
                <th>DAC</th>
              </tr>
            </thead>
            <tbody>
              {datasetRows}
            </tbody>
          </table>
        </div>
      )
}

type CollapseExpandLinkProps = {
  hiddenDatasetCount: number
  expanded: boolean
  onExpand: () => void
  onCollapse: () => void
  styles: typeof styles
}

const CollapseExpandLink: React.FC<CollapseExpandLinkProps> = ({
  hiddenDatasetCount,
  expanded,
  onExpand,
  onCollapse,
  styles,
}) => {
  if (hiddenDatasetCount <= 0) return null
  const linkMessage = expanded
    ? `- View ${hiddenDatasetCount} less`
    : `+ View ${hiddenDatasetCount} more`
  return (
    <button
      data-cy="collapse-expand-link"
      type="button"
      style={styles.expandList}
      onClick={expanded ? onCollapse : onExpand}
      aria-expanded={expanded}
    >
      {linkMessage}
    </button>
  )
}

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: '500',
    color: '#333F52',
    padding: '15px 25px',
    display: 'flex',
    flexDirection: 'column' as const,
    rowGap: '1.5rem',
  },
  heading: {
    fontWeight: 'bold',
    display: 'flex',
    columnGap: '0.5rem',
    alignItems: 'center',
  },
  datasetCount: {
    color: '#747474',
    fontSize: '1.2rem',
  },
  datasetList: {
    display: 'flex',
    flexDirection: 'column' as const,
    rowGap: '0.75rem',
  },
  expandList: {
    color: '#0948B7',
    fontWeight: '500',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    textAlign: 'left',
  },
  skeletonLoader: {
    height: '30px',
    width: '60%',
  },
}

export default function DatasetsRequestedPanel(props: DatasetsRequestedPanelProps) {
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([])
  const [visibleDatasets, setVisibleDatasets] = useState<Dataset[]>([])
  const [datasetCount, setDatasetCount] = useState<number>(0)
  const [expanded, setExpanded] = useState<boolean>(false)
  const collapsedDatasetCapacity = 5
  const { bucketDatasets, dacs, dacDatasetIds, isLoading, adminPage } = props

  useEffect(() => {
    const datasets = adminPage
      ? bucketDatasets
      : filter((dataset: Dataset) => {
          const { datasetId } = dataset
          return includes(datasetId)(dacDatasetIds)
        })(bucketDatasets)

    setFilteredDatasets(datasets)
    setDatasetCount(datasets.length)
    collapseView(datasets)
  }, [adminPage, bucketDatasets, dacDatasetIds])

  const collapseView = (datasets: Dataset[]) => {
    const datasetsHiddenWhenCollapsed = datasets.length > collapsedDatasetCapacity

    const collapsedViewDatasets = datasetsHiddenWhenCollapsed
      ? datasets.slice(0, collapsedDatasetCapacity)
      : datasets

    setVisibleDatasets(collapsedViewDatasets)
  }

  const expandDatasetList = () => {
    setExpanded(true)
    setVisibleDatasets(filteredDatasets)
  }

  const collapseDatasetList = () => {
    setExpanded(false)
    setVisibleDatasets(filteredDatasets.slice(0, collapsedDatasetCapacity))
  }

  return (
    <div style={styles.baseStyle}>
      <SectionHeading isLoading={isLoading} datasetCount={datasetCount} />
      <DatasetList
        visibleDatasets={visibleDatasets}
        isLoading={isLoading}
        dacs={dacs}
        styles={styles}
      />
      <CollapseExpandLink
        hiddenDatasetCount={datasetCount - collapsedDatasetCapacity}
        expanded={expanded}
        onExpand={expandDatasetList}
        onCollapse={collapseDatasetList}
        styles={styles}
      />
    </div>
  )
}
