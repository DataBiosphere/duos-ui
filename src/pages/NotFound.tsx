import React, { useEffect, useState } from 'react'
import { Alert } from '@mui/material'
import { PageHeading } from '../components/PageHeading'
import { Link, useLocation, Navigate } from 'react-router'
import { AssetCatalog } from 'src/libs/ajax/AssetCatalog'
import { useUserIsLogged } from 'src/hooks/useSession'
import { AssetLookup, AssetType } from 'src/types/library'

const ASSET_PATH = /^\/DUOS-[MWB]-/
const ASSET_IDENTIFIER = /^DUOS-[MWB]-\d{6,}$/

const LIBRARY_TAB: Partial<Record<AssetLookup['type'], AssetType>> = {
  MODEL: AssetType.MODELS,
  WORKSPACE: AssetType.WORKSPACES,
  BIOSPECIMEN: AssetType.BIOSPECIMENS,
}

const BackToHome = () => (
  <Link id="btn_back" className="btn-primary btn-back f-left" style={{ marginTop: '15px' }} to="/home">
    Back to Home
  </Link>
)

const PageNotFound = () => (
  <div className="container container-wide" data-cy="not-found">
    <div className="row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
        <PageHeading
          id="notFound"
          color="common"
          title="Sorry, the page you were looking for was not found."
        />
      </div>
      <BackToHome />
    </div>
  </div>
)

const AssetStatus = ({ severity = 'info', message }: { severity?: 'info' | 'warning', message: string }) => (
  <div className="container container-wide">
    <div className="row no-margin">
      <Alert severity={severity} sx={{ mt: 2, width: '100%' }}>{message}</Alert>
      <BackToHome />
    </div>
  </div>
)

type LookupOutcome = { result: AssetLookup } | { status?: number }

const AssetIdentifierLookup = ({ identifier }: { identifier: string }) => {
  const { pathname } = useLocation()
  const isLogged = useUserIsLogged()
  const [outcome, setOutcome] = useState<LookupOutcome>()

  useEffect(() => {
    if (!isLogged) return
    let cancelled = false
    AssetCatalog.lookup(identifier)
      .then((result) => { if (!cancelled) setOutcome({ result }) })
      .catch((error: { response?: { status?: number } }) => { if (!cancelled) setOutcome({ status: error?.response?.status }) })
    return () => {
      cancelled = true
    }
  }, [identifier, isLogged])

  if (isLogged === undefined) {
    return null
  }
  if (!isLogged) {
    return <Navigate to={`/?redirectTo=${pathname}`} replace />
  }
  if (!outcome) {
    return null
  }
  if (!('result' in outcome)) {
    return outcome.status === 404
      ? <PageNotFound />
      : <AssetStatus severity="warning" message={`${identifier} could not be looked up right now. Please try again later.`} />
  }

  const { result } = outcome
  const tab = LIBRARY_TAB[result.type]
  if (!tab) {
    return <PageNotFound />
  }
  switch (result.status) {
    case 'LIVE':
      return result.listed
        ? <Navigate to={`/datalibrary?tab=${tab}&query=${encodeURIComponent(identifier)}`} replace />
        : <AssetStatus message={`${identifier} is not currently listed in the Data Library.`} />
    case 'RETIRED':
      return <AssetStatus message={`${identifier} has been retired.`} />
    case 'REMOVED':
      return <AssetStatus message={`${identifier} has been removed.`} />
    default:
      return <PageNotFound />
  }
}

const withoutTrailingSlashes = (path: string) => {
  let end = path.length
  while (end > 1 && path[end - 1] === '/') end--
  return path.slice(0, end)
}

export default function NotFound() {
  // Downstream checks, such as DatasetStatistics.getMatchPhrase, are case-sensitive.
  const path = withoutTrailingSlashes(useLocation().pathname.toUpperCase())
  const identifier = path.split('/').pop() ?? ''

  // StudyDetails expects a database ID without the 'DUOS-S' prefix
  if (path.startsWith('/DUOS-S')) {
    return <Navigate to={`/studies/${identifier.replace('DUOS-S', '')}`} replace />
  }
  if (ASSET_PATH.test(path)) {
    const asset = path.slice(1)
    // Keyed so a new identifier starts from an empty lookup rather than the last one's answer.
    return ASSET_IDENTIFIER.test(asset) ? <AssetIdentifierLookup key={asset} identifier={asset} /> : <PageNotFound />
  }
  // DatasetStatistics can handle either a DUOS-Dxxx or a DUOS-000xxx identifier
  if (path.startsWith('/DUOS-')) {
    return <Navigate to={`/dataset/${identifier}`} replace />
  }
  return <PageNotFound />
}
