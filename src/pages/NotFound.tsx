import React, { useEffect, useState } from 'react'
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

const MessagePage = ({ title, notFound = false }: { title: string, notFound?: boolean }) => (
  <div className="container container-wide" data-cy={notFound ? 'not-found' : undefined}>
    <div className="row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
        <PageHeading
          id="notFound"
          color="common"
          title={title}
        />
      </div>
      <Link id="btn_back" className="btn-primary btn-back f-left" style={{ marginTop: '15px' }} to="/home">
        Back to Home
      </Link>
    </div>
  </div>
)

const PageNotFound = () => <MessagePage title="Sorry, the page you were looking for was not found." notFound />

type LookupState = { identifier: string, result?: AssetLookup }

const AssetIdentifierLookup = ({ identifier }: { identifier: string }) => {
  const { pathname } = useLocation()
  const isLogged = useUserIsLogged()
  const [lookup, setLookup] = useState<LookupState>()

  useEffect(() => {
    if (!isLogged) return
    let cancelled = false
    AssetCatalog.lookup(identifier)
      .then((result) => { if (!cancelled) setLookup({ identifier, result }) })
      .catch(() => { if (!cancelled) setLookup({ identifier }) })
    return () => {
      cancelled = true
    }
  }, [identifier, isLogged])

  if (isLogged === undefined) {
    return null
  }
  if (!isLogged) {
    return <Navigate to={`/?redirectTo=${pathname}`} />
  }
  if (lookup?.identifier !== identifier) {
    return null
  }

  const tab = lookup.result && LIBRARY_TAB[lookup.result.type]
  if (!lookup.result || !tab) {
    return <PageNotFound />
  }
  switch (lookup.result.status) {
    case 'REMOVED':
      return <MessagePage title={`${identifier} has been removed.`} />
    case 'RETIRED':
      return <MessagePage title={`${identifier} has been retired.`} />
    default:
      return lookup.result.listed
        ? <Navigate to={`/datalibrary?tab=${tab}&query=${encodeURIComponent(identifier)}`} />
        : <MessagePage title={`${identifier} is not currently listed in the Data Library.`} />
  }
}

export default function NotFound() {
  // Downstream checks, such as DatasetStatistics.getMatchPhrase, are case-sensitive.
  const path = useLocation().pathname.toUpperCase()
  const identifier = path.split('/').pop() ?? ''

  // StudyDetails expects a database ID without the 'DUOS-S' prefix
  if (path.startsWith('/DUOS-S')) {
    return <Navigate to={`/studies/${identifier.replace('DUOS-S', '')}`} />
  }
  if (ASSET_PATH.test(path)) {
    const asset = path.slice(1)
    return ASSET_IDENTIFIER.test(asset) ? <AssetIdentifierLookup identifier={asset} /> : <PageNotFound />
  }
  // DatasetStatistics can handle either a DUOS-Dxxx or a DUOS-000xxx identifier
  if (path.startsWith('/DUOS-')) {
    return <Navigate to={`/dataset/${identifier}`} />
  }
  return <PageNotFound />
}
