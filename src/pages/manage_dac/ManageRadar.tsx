import React, { useEffect, useState } from 'react'
import backArrowIcon from 'src/images/back_arrow.svg'
import { DACBotComponent } from 'src/components/dac_bot/DACBotComponent'
import { DAC } from 'src/libs/ajax/DAC'
import { Link, useParams } from 'react-router-dom'
import { Styles } from 'src/libs/theme'
import { Notifications } from 'src/libs/utils'
import radarIcon from 'src/images/google-svg/radar.svg'
import { Spinner } from 'src/components/Spinner'
import TableHeaderSection from 'src/components/TableHeaderSection'

const ManageRadar = () => {
  const params = useParams<{ dacId: string }>()
  const dacIdParam = params.dacId || ''
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
      <div data-cy="error-container" style={Styles.PAGE}>
        <div>
          <Link
            data-cy="back-button"
            id="link_manage_dac"
            to="/manage_dac"
            className="navbar-brand"
            style={{ paddingRight: '16px', marginTop: '3rem' }}
          >
            <img id="back-arrow-icon" src={backArrowIcon} style={{ ...Styles.HEADER_IMG, width: '30px' }} alt="Back" />
          </Link>
          <TableHeaderSection
            icon={{ src: radarIcon }}
            title="Manage Rule Automation for DARs (RADAR)"
            description={(
              <div
                data-cy="error-message"
                style={{
                  color: '#d32f2f',
                }}
              >
                {(!dacIdParam || isNaN(dacId)) ? 'Invalid DAC ID' : 'Error loading DAC information'}
              </div>
            )}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={Styles.PAGE} data-cy="manage-radar-container">
      <div>
        <Link
          data-cy="back-button"
          id="link_manage_dac"
          to="/manage_dac"
          className="navbar-brand"
          style={{ paddingRight: '16px' }}
        >
          <img id="back-arrow-icon" src={backArrowIcon} style={{ ...Styles.HEADER_IMG, width: '30px' }} alt="Back" />
        </Link>
        <TableHeaderSection
          title="DAC Configurations"
          description={fetchedDac ? fetchedDac.name : ''}
        />
      </div>
      <div>
        <DACBotComponent data-cy="dac-bot-component" dacId={dacId} />
      </div>
    </div>
  )
}

export default ManageRadar
