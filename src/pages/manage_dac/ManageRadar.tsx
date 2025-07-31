import React, { useState, useEffect } from 'react'
import backArrowIcon from '../../images/back_arrow.svg'
import { DACBotComponent } from 'src/components/dac_bot/DACBotComponent'
import { DAC } from '../../libs/ajax/DAC'
import { Link } from 'react-router-dom'
import { Styles } from '../../libs/theme'
import { Notifications } from '../../libs/utils'
import radarIcon from '../../images/google-svg/radar.svg'
import { Spinner } from 'src/components/Spinner'

export type ManageRadarProps = {
  match: { params: { dacId: string } }
  dacId: number
}

const ManageRadar = (props: ManageRadarProps) => {
  const dacIdParam = props.match.params.dacId
  const dacId = parseInt(dacIdParam, 10)

  const [fetchedDac, setFetchedDac] = useState<{ name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!dacIdParam || isNaN(dacId)) {
          setHasError(true)
          setIsLoading(false)
          return
        }
        const fetchedDac = await DAC.get(dacId)
        setFetchedDac(fetchedDac)
        setHasError(false)
      }
      catch (_e) {
        setHasError(true)
        Notifications.showError({ text: 'Error: Unable to retrieve current DAC from server' })
      }
      setIsLoading(false)
    }
    fetchData()
  }, [dacIdParam, dacId])

  if (isLoading) {
    return <div data-cy="loading-spinner"><Spinner /></div>
  }

  if (hasError) {
    return (
      <div data-cy="error-container" style={{ padding: '0 2.5%' }}>
        <div data-cy="page-header" className="left-header-section" style={{ ...Styles.LEFT_HEADER_SECTION, flexDirection: 'row' }}>
          <Link
            data-cy="back-button"
            id="link_manage_dac"
            to="/manage_dac"
            className="navbar-brand"
            style={{ paddingRight: '16px' }}
          >
            <img id="back-arrow-icon" src={backArrowIcon} style={{ ...Styles.HEADER_IMG, width: '30px' }} alt="Back" />
          </Link>
          <div style={Styles.ICON_CONTAINER}>
            <img id="radar-icon" src={radarIcon} style={Styles.HEADER_IMG} alt="Edit rule automation" />
          </div>
          <div style={Styles.HEADER_CONTAINER as React.CSSProperties}>
            <div
              className="common-color"
              style={{ fontFamily: 'Montserrat', fontSize: '1.4rem', textDecoration: 'underline' }}
            >
              Manage Rule Automation for DARs (RADAR)
            </div>
          </div>
        </div>
        <div
          data-cy="error-message"
          style={{
            padding: '20px',
            textAlign: 'center',
            fontSize: '1.2rem',
            color: '#d32f2f',
          }}
        >
          {(!dacIdParam || isNaN(dacId)) ? 'Invalid DAC ID' : 'Error loading DAC information'}
        </div>
      </div>
    )
  }

  return (
    <div data-cy="manage-radar-container" style={{ padding: '0 2.5%' }}>
      <div data-cy="page-header" className="left-header-section" style={{ ...Styles.LEFT_HEADER_SECTION, flexDirection: 'row' }}>
        <Link
          data-cy="back-button"
          id="link_manage_dac"
          to="/manage_dac"
          className="navbar-brand"
          style={{ paddingRight: '16px' }}
        >
          <img id="back-arrow-icon" src={backArrowIcon} style={{ ...Styles.HEADER_IMG, width: '30px' }} alt="Back" />
        </Link>
        <div style={Styles.ICON_CONTAINER}>
          <img id="radar-icon" src={radarIcon} style={Styles.HEADER_IMG} alt="Edit rule automation" />
        </div>
        <div style={Styles.HEADER_CONTAINER as React.CSSProperties}>
          <div
            className="common-color"
            style={{ fontFamily: 'Montserrat', fontSize: '1.4rem', textDecoration: 'underline' }}
          >
            Manage Rule Automation for DARs (RADAR)
          </div>
          <div
            data-cy="dac-name"
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontSize: '2.8rem',
            }}
          >
            {fetchedDac ? fetchedDac.name : ''}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '60%' }}>
        <DACBotComponent data-cy="dac-bot-component" dacId={dacId} />
      </div>
    </div>
  )
}

export default ManageRadar
