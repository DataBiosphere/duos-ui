import React, { useMemo, useState } from 'react'
import { filter, includes } from 'src/utils/NodashUtil'
import { DacTerm, Dataset } from 'src/types/model'
import SectionHeading from 'src/components/collection_voting_slab/SectionHeading'
import DatasetList from 'src/components/collection_voting_slab/DatasetList'
import CollapseExpandLink from 'src/components/collection_voting_slab/CollapsibleExpandLink'

type DatasetsRequestedPanelProps = {
  readonly bucketDatasets: Dataset[]
  readonly dacs?: DacTerm[]
  readonly dacDatasetIds?: number[]
  readonly isLoading: boolean
  readonly adminPage: boolean
}

export default function DatasetsRequestedPanel(props: DatasetsRequestedPanelProps) {
  const [expanded, setExpanded] = useState<boolean>(false)
  const collapsedDatasetCapacity = 5
  const { bucketDatasets, dacs, dacDatasetIds, isLoading, adminPage } = props

  const filteredDatasets = useMemo(() => {
    return adminPage
      ? bucketDatasets
      : filter(bucketDatasets, (dataset: Dataset) => {
          const { datasetId } = dataset
          return includes(dacDatasetIds, datasetId)
        })
  }, [adminPage, bucketDatasets, dacDatasetIds])

  const datasetCount = filteredDatasets.length
  const visibleDatasets = expanded
    ? filteredDatasets
    : filteredDatasets.slice(0, collapsedDatasetCapacity)

  const expandDatasetList = () => setExpanded(true)
  const collapseDatasetList = () => setExpanded(false)

  return (
    <div style={{
      fontFamily: 'Montserrat',
      fontSize: '1.4rem',
      fontWeight: '500',
      color: '#333F52',
      padding: '15px 25px',
      display: 'flex',
      flexDirection: 'column',
      rowGap: '1.5rem',
    }}
    >
      <SectionHeading isLoading={isLoading} datasetCount={datasetCount} />
      <DatasetList
        visibleDatasets={visibleDatasets}
        isLoading={isLoading}
        dacs={dacs}
      />
      <CollapseExpandLink
        hiddenDatasetCount={datasetCount - collapsedDatasetCapacity}
        expanded={expanded}
        onExpand={expandDatasetList}
        onCollapse={collapseDatasetList}
      />
    </div>
  )
}
