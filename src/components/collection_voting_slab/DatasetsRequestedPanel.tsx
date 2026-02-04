import React, { useCallback, useEffect, useState } from 'react'
import { filter, includes } from 'lodash'
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
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([])
  const [visibleDatasets, setVisibleDatasets] = useState<Dataset[]>([])
  const [datasetCount, setDatasetCount] = useState<number>(0)
  const [expanded, setExpanded] = useState<boolean>(false)
  const collapsedDatasetCapacity = 5
  const { bucketDatasets, dacs, dacDatasetIds, isLoading, adminPage } = props

  const collapseView = useCallback((datasets: Dataset[]) => {
    const datasetsHiddenWhenCollapsed = datasets.length > collapsedDatasetCapacity

    const collapsedViewDatasets = datasetsHiddenWhenCollapsed
      ? datasets.slice(0, collapsedDatasetCapacity)
      : datasets

    setVisibleDatasets(collapsedViewDatasets)
  }, [collapsedDatasetCapacity])

  useEffect(() => {
    const datasets = adminPage
      ? bucketDatasets
      : filter(bucketDatasets, (dataset: Dataset) => {
          const { datasetId } = dataset
          return includes(dacDatasetIds, datasetId)
        })

    setFilteredDatasets(datasets)
    setDatasetCount(datasets.length)
    collapseView(datasets)
  }, [adminPage, bucketDatasets, dacDatasetIds, collapseView])

  const expandDatasetList = () => {
    setExpanded(true)
    setVisibleDatasets(filteredDatasets)
  }

  const collapseDatasetList = () => {
    setExpanded(false)
    setVisibleDatasets(filteredDatasets.slice(0, collapsedDatasetCapacity))
  }

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
