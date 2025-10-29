import React from 'react'
import { PageHeading } from '../components/PageHeading'
import { Link, useLocation, Navigate } from 'react-router-dom'

export default function NotFound() {
  const location = useLocation()

  const calculateRedirect = () => {
    const identifier = location.pathname.split('/').pop()
    // StudyDetails expects a database ID without the 'DUOS-S' prefix
    if (location.pathname.startsWith('/DUOS-S')) {
      const studyId = identifier?.replace('DUOS-S', '')
      return <Navigate to={`/studies/${studyId}`} />
    }
    // DatasetStatistics can handle either a DUOS-Dxxx or a DUOS-000xxx identifier
    else if (location.pathname.startsWith('/DUOS-')) {
      return <Navigate to={`/dataset/${identifier}`} />
    }
    else {
      return (
        <div className="container container-wide">
          <div className="row no-margin">
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
              <PageHeading
                id="notFound"
                color="common"
                title="Sorry, the page you were looking for was not found."
              />
            </div>
            <Link id="btn_back" className="btn-primary btn-back f-left" style={{ marginTop: '15px' }} to="/home">
              Back to Home
            </Link>
          </div>
        </div>
      )
    }
  }

  return (calculateRedirect())
}
