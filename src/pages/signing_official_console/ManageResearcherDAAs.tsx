import React, { useEffect, useState } from 'react'
import { Tabs, Tab, Box } from '@mui/material'

import ResearcherView from 'src/pages/signing_official_console/ResearcherView'
import { User } from 'src/libs/ajax/User'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { DAA } from 'src/libs/ajax/DAA'
import { DAAObject, DuosUser } from 'src/types/model'
import { extractError } from 'src/utils/ErrorUtils'
import TableHeaderSection from 'src/components/TableHeaderSection'

type DAAObjectWithBroadFlag = DAAObject & { broadDaa?: boolean }

export default function ManageResearcherDAAs(): React.JSX.Element {
  const [researchers, setResearchers] = useState<DuosUser[]>([])
  const [daas, setDaas] = useState<DAAObject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        const researcherList = await User.list(USER_ROLES.signingOfficial)
        setResearchers(researcherList)
        const daaList: DAAObjectWithBroadFlag[] = await DAA.getDaas()
        // There are DAAs that are not mapped to any DAC so we can ignore those.
        const filteredDAAList = daaList.filter((daa) => {
          const hasMappedDac = Array.isArray(daa.dacs) && daa.dacs.length > 0
          return Boolean(daa.broadDaa) || hasMappedDac
        })
        setDaas(filteredDAAList)
      }
      catch (error) {
        console.error('Failed to load ManageResearcherDAAs page data', error)
        Notifications.showError({
          text: `Error: Unable to retrieve current user from server: ${extractError(error)}`,
        })
      }
      finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  return (
    <div>
      <div style={{ paddingLeft: '4rem', maxWidth: '40%', marginBottom: '2rem' }}>
        <TableHeaderSection
          title="Pre-Authorize Researchers"
          description="Review and approve researchers at your institution for access under each Pre-Auth DAA. Researchers must be approved on a per-DAA basis — authorization for one Pre-Auth DAA does not automatically grant access under another."
        />
      </div>
      <Box
        sx={{
          borderTop: 1,
          borderBottom: 1,
          borderColor: 'divider',
          paddingLeft: '5rem',
          paddingRight: '5rem',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_event, newValue) => setActiveTab(newValue)}
          aria-label="library view tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          slotProps={{
            indicator: {
              style: { backgroundColor: '#00609f' },
            },
          }}
        >
          <Tab
            key="researcherView"
            value={0}
            label="Researcher View"
            sx={{
              textTransform: 'none',
              fontSize: '15px',
              fontFamily: 'Montserrat, sans-serif',
              color: '#00609f',
              fontWeight: 'bold',
              marginLeft: '2rem',
              padding: '0 25px',
            }}
          />
        </Tabs>
      </Box>
      {activeTab === 0 && (
        <Box sx={{
          backgroundColor: '#f5f5f5',
          paddingLeft: '7rem',
          paddingRight: '5rem',
          paddingTop: '2rem',
          paddingBottom: '2rem',
        }}
        >
          <ResearcherView
            researchers={researchers}
            daas={daas}
            isLoading={isLoading}
            onResearchersRefresh={setResearchers}
          />
        </Box>
      )}
    </div>
  )
}
