import React, { useCallback, useEffect, useState } from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { findIndex } from 'lodash/fp'

type ApplicationTab = {
  id: string
  name: string
  showStep?: boolean
}

type ScrollableTabsProps = {
  applicationTabs: ApplicationTab[]
  formSelectedTabId?: string
}

export const ScrollableTabs = ({ applicationTabs, formSelectedTabId }: ScrollableTabsProps) => {
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(1)

  const goToStep = useCallback((tabId: string) => {
    window.scrollTo({
      top: document.getElementById(tabId)?.offsetTop,
      behavior: 'smooth',
    })
  }, [])

  // CASE 1 - the form scrolls to a new tab based on validation errors
  useEffect(() => {
    if (formSelectedTabId !== undefined) {
      setSelectedStepNumber(findIndex(tab => tab.id === formSelectedTabId, applicationTabs) + 1)
      goToStep(formSelectedTabId)
    }
  }, [goToStep, formSelectedTabId, applicationTabs])

  // CASE 2 - the user scrolls on the page, so we auto-select a new tab
  // but, we don't adjust the scroll position
  const onScroll = () => {
    const scrollPos = window.scrollY
    const scrollBuffer = window.innerHeight * 0.5

    // Find the section that is currently most visible
    let currentSectionIndex = 1 // Start with 1 since MUI Tabs expects 1-based indexing

    for (let i = 0; i < applicationTabs.length; i++) {
      const element = document.getElementById(applicationTabs[i].id)
      if (!element) continue

      const elementTop = element.offsetTop
      const elementHeight = element.offsetHeight
      const elementBottom = elementTop + elementHeight

      // Check if this section is in the viewport with the scroll buffer
      if (scrollPos + scrollBuffer >= elementTop && scrollPos + scrollBuffer < elementBottom) {
        currentSectionIndex = i + 1
        break
      }
      // If we've scrolled past the current section, check if we should move to the next one
      else if (scrollPos + scrollBuffer >= elementTop) {
        currentSectionIndex = i + 1
      }
    }

    // Ensure the index is within valid bounds for MUI Tabs (1 to applicationTabs.length)
    currentSectionIndex = Math.max(1, Math.min(currentSectionIndex, applicationTabs.length))

    setSelectedStepNumber(currentSectionIndex)
  }

  useEffect(() => {
    window.addEventListener('scroll', onScroll)

    return () => {
      // Cleanup listener on unmount
      window.removeEventListener('scroll', onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="multi-step-buttons-container">
      <Tabs
        value={selectedStepNumber}
        variant="scrollable"
        scrollButtons="auto"
        orientation="vertical"
        TabIndicatorProps={{
          style: { background: '#2BBD9B' },
        }}
        // CASE 3 - the user selects a new tab by clicking on it
        onChange={(_event, step) => {
          setSelectedStepNumber(step)
          goToStep(applicationTabs[step - 1].id)
        }}
      >
        {
          applicationTabs.map((tabConfig, index) => {
            const { name, showStep = true } = tabConfig
            return (
              <Tab
                key={`step-${index}-${name}`}
                label={(
                  <div>
                    {showStep && <div className="step">{`Step ${index + 1}`}</div>}
                    <div className="title">{name}</div>
                  </div>
                )}
                value={index + 1}
              />
            )
          })
        }
      </Tabs>
    </div>
  )
}
