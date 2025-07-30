import React from 'react'
import { DACBotComponent } from 'src/components/dac_bot/DACBotComponent'

export type ManageRadarProps = {
  match: any
  dacId: number
}

const ManageRadar = (props: ManageRadarProps) => {
  const dacId = props.match.params.dacId

  return (
    <div style={{padding: '0 2.5%'}}>
      <h1>Manage Rule Automation for DARs (RADAR)</h1>
      <div style={{ maxWidth: '60%' }}>
        <DACBotComponent dacId={dacId} />
      </div>
    </div>
  )
}

export default ManageRadar
