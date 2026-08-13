import React from 'react'
import { Navigate, useParams } from 'react-router'
import { AssetType } from 'src/types/library'

/**
 * Deep link into the Data Library's Studies tab with the search pre-applied, e.g.
 * `/studies/name/Framingham%20Heart%20Study`. Used by outbound links (such as the
 * new-study digest email) that know a study name but not its id.
 *
 * The term is a splat rather than a single param so names containing a slash still
 * resolve, and it lives in the path rather than the query string so it survives the
 * sign-in redirect, which preserves only `location.pathname`.
 */
export const StudyNameSearch: React.FC = () => {
  const { '*': splat } = useParams()
  const searchTerm = splat?.trim()

  const searchParams = new URLSearchParams({ tab: AssetType.STUDIES })
  if (searchTerm) {
    searchParams.set('query', searchTerm)
  }

  return <Navigate to={`/datalibrary?${searchParams.toString()}`} replace />
}
