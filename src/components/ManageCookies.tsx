import React, { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import { CookeUtils } from 'src/utils/CookieUtils'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Link } from 'react-router-dom'

export default function ManageCookies() {
  const [gaAllowed, setGaAllowed] = useState(false)

  useEffect(() => {
    const allowed = CookeUtils.getAnalyticsControl()
    setGaAllowed(allowed)
  })

  const setAnalyticsCookie = (val: boolean) => {
    setGaAllowed(val)
    CookeUtils.setAnalyticsControl(val)
  }

  return (
    <div>
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="cookie-preferences-content"
          id="cookie-preferences-header"
        >
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 600 }}>Cookie Preferences</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ fontSize: '1.5rem' }} component="span">
            DUOS uses cookies to enable the proper functioning and security of our website, and to improve your
            experience. You can choose not to allow some types of cookies. Not allowing strictly necessary cookies
            means that the DUOS site won&#39;t be able to operate and you won&#39;t be able to use it. Expand the
            different categories to learn more about each category of cookies. We do not sell your data to
            third-parties. To find out more, <Link to="/privacy">read our privacy policy</Link>.
          </Typography>
          <Typography sx={{ fontSize: '1.5rem' }} component="span">

            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="strictly-necessary-content"
                id="strictly-necessary-header"
              >
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, width: '100%' }} component="span">
                  Strictly Necessary
                </Typography>
                <Switch checked disabled size="small" sx={{ float: 'right' }} />
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ fontSize: '1.5rem' }} component="span">
                  These cookies make the DUOS website usable by enabling basic functions like page navigation, access
                  to secure areas, authenticating logins, and enhanced functionality, for instance. This category of
                  cookies cannot be disabled. You can set your browser to block or alert you about these cookies, but
                  some parts of the DUOS website will not then work.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="performance-content"
                id="performance-content-header"
              >
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, width: '100%' }} component="span">
                  Performance
                </Typography>
                <Switch
                  checked={gaAllowed}
                  size="small"
                  sx={{ float: 'right' }}
                  onFocus={(e) => {
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    setAnalyticsCookie(!gaAllowed)
                    e.stopPropagation()
                  }}
                />
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ fontSize: '1.5rem' }} component="span">
                  These cookies allow us to count visits and traffic sources, so we can measure and improve the
                  performance of the DUOS site. They help us know which pages are the most and least popular and
                  see how visitors move around the site.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Typography>

          <div style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              sx={{ width: '45%', fontSize: '1.25rem', textTransform: 'capitalize' }}
              onClick={() => setAnalyticsCookie(false)}
            >Essential Only
            </Button>
            <Button
              variant="contained"
              sx={{ width: '45%', fontSize: '1.25rem', textTransform: 'capitalize' }}
              onClick={() => setAnalyticsCookie(true)}
            >Accept All
            </Button>
          </div>

        </AccordionDetails>
      </Accordion>
    </div>
  )
}
