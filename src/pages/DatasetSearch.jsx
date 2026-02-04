import React, { useEffect, useState, useMemo } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { toLower } from 'lodash'
import { Notifications } from 'src/libs/utils'
import { DataSet } from 'src/libs/ajax/DataSet'
import DatasetSearchTable from 'src/components/data_search/DatasetSearchTable'
import { getLibraryVersions } from 'src/libs/libraryVersions'
import { Storage } from 'src/libs/storage'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList from 'src/libs/events'
import { useParams, useNavigate } from 'react-router-dom'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { getFlagNhgriDacId } from 'src/libs/ajax/FeatureFlag.ts'

const assembleFullQuery = (isSigningOfficial, isInstitutionQuery, subQuery, nhgriDacId) => {
  const queryChunks = [
    {
      match: {
        _type: 'dataset',
      },
    },
    {
      exists: {
        field: 'study',
      },
    },
  ]

  // do not apply modifier if user is signing official and viewing their own institution
  if (!isSigningOfficial || !isInstitutionQuery) {
    const visibilityModifier = [
      {
        term: {
          'study.publicVisibility': true,
        },
      },
      {
        bool: {
          should: [
            {
              term: {
                dacApproval: true,
              },
            },
            {
              term: {
                accessManagement: 'open',
              },
            },
            {
              term: {
                accessManagement: 'external',
              },
            },
          ],
        },
      },
    ]
    queryChunks.push(...visibilityModifier)
  }

  if (subQuery !== null) {
    queryChunks.push(subQuery)
  }

  return {
    from: 0,
    size: 10000,
    query: {
      bool: {
        must: queryChunks,
        must_not: nhgriDacId
          ? {
              bool: {
                must: [
                  { term: { dacId: nhgriDacId } },
                  { term: { accessManagement: 'controlled' } },
                ],
              },
            }
          : [],
      },
    },
  }
}

export const DatasetSearch = (props) => {
  usePageTitle('Data Library')
  const navigate = useNavigate()
  const params = useParams()
  const query = params.query
  const [datasets, setDatasets] = useState([])
  const [queryState, setQueryState] = useState(query)
  const [loading, setLoading] = useState(true)
  const [nhgriDacId, setNhgriDacId] = useState(null)
  const user = Storage.getCurrentUser()

  const isSigningOfficial = user.isSigningOfficial
  const institutionId = user.institution?.id
  const institutionName = user.institution?.name

  const key = query === undefined ? '/datalibrary' : toLower(query)

  // Memoize versions to prevent recreation on every render
  const versions = useMemo(
    () => getLibraryVersions(institutionId, institutionName, query),
    [institutionId, institutionName, query],
  )

  const version = versions[key] === undefined ? versions['/custom'] : versions[key]
  const isInstitutionQuery = key === 'myinstitution'

  // Memoize fullQuery to prevent recreation on every render
  const fullQuery = useMemo(
    () => assembleFullQuery(isSigningOfficial, isInstitutionQuery, version.query, nhgriDacId),
    [isSigningOfficial, isInstitutionQuery, version.query, nhgriDacId],
  )

  const isInstitutionSet = institutionId === undefined && isInstitutionQuery

  const hasChangedPage = query !== queryState

  useEffect(() => {
    const init = async () => {
      if (key === '/datalibrary') {
        // noinspection ES6MissingAwait
        Metrics.captureEvent(eventList.dataLibrary)
      }
      else {
        const brand = key.replaceAll('/', '').toLowerCase()
        // noinspection ES6MissingAwait
        Metrics.captureEvent(eventList.dataLibrary, { brand: brand })
      }
    }
    init()
  }, [key])

  useEffect(() => {
    const init = async () => {
      if (loading || hasChangedPage) {
        if (isInstitutionSet) {
          Notifications.showError({ text: 'You must set an institution in your profile to view the `myinstitution` data library' })
          navigate('/profile')
          return
        }

        // Fetch NHGRI DAC ID flag
        getFlagNhgriDacId().then((value) => {
          setNhgriDacId(value ?? null)
        })

        try {
          await DataSet.searchDatasetIndex(fullQuery).then((datasets) => {
            setDatasets(datasets)
            setLoading(false)
            setQueryState(query)
          })
        }
        catch {
          Notifications.showError({ text: 'Failed to load Elasticsearch index' })
        }
      }
    }
    init()
  }, [loading, isInstitutionSet, fullQuery, navigate, hasChangedPage, query])

  return (
    loading
      ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        )
      : (
          <DatasetSearchTable
            {...props}
            datasets={datasets}
            icon={version.icon}
            title={version.title}
            assembleFullQuery={assembleFullQuery}
            isSigningOfficial={isSigningOfficial}
            isInstitutionQuery={isInstitutionQuery}
          />
        )
  )
}

export default DatasetSearch
