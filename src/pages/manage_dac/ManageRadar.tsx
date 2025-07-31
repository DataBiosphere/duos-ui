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
  match: any
  dacId: number
}

const ManageRadar = (props: ManageRadarProps) => {
  const dacId = props.match.params.dacId

  const [fetchedDac, setFetchedDac] = useState<{ name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedDac = await DAC.get(dacId)
        setFetchedDac(fetchedDac)
      }
      catch (_e) {
        Notifications.showError({ text: 'Error: Unable to retrieve current DAC from server' })
      }
    }
    fetchData()
    setIsLoading(false)
  }, [dacId])

  return (
    isLoading
      ? <Spinner />
      : (
        <div style={{padding: '0 2.5%'}}>
          <div className="left-header-section" style={{ ...Styles.LEFT_HEADER_SECTION, flexDirection: 'row' }}>
            <Link
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
            <div style={Styles.HEADER_CONTAINER}>
              <div
                className="common-color"
                style={{ fontFamily: 'Montserrat', fontSize: '1.4rem', textDecoration: 'underline' }}
              >
                Manage Rule Automation for DARs (RADAR)
              </div>
              <div style={{
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
            <DACBotComponent dacId={dacId} />
          </div>
        </div>
      )
  )
}

export default ManageRadar
