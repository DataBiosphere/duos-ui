import React from 'react'

type SectionHeadingProps = {
  readonly isLoading: boolean
  readonly datasetCount: number
}

export default function SectionHeading(props: SectionHeadingProps) {
  const { isLoading, datasetCount } = props
  return (
    <div style={{
      fontWeight: 'bold',
      display: 'flex',
      columnGap: '0.5rem',
      alignItems: 'center',
    }}
    >
      Datasets Requested
      {!isLoading && (
        <span
          style={{
            color: '#747474',
            fontSize: '1.2rem',
          }}
          data-cy="dataset-count"
        >
          ({datasetCount})
        </span>
      )}
    </div>
  )
}
