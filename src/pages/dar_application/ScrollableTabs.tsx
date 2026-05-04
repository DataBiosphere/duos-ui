import React, { useCallback, useEffect, useRef } from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { findIndex } from 'lodash'

type ApplicationTab = {
  id: string
  name: string
  showStep?: boolean
}

type ScrollableTabsProps = {
  applicationTabs: ApplicationTab[]
  formSelectedTabId?: string
  onTabChange?: (tabId: string) => void
}

export const ScrollableTabs = ({ applicationTabs, formSelectedTabId, onTabChange }: ScrollableTabsProps) => {
  // Use positive check for clarity (suggested improvement)
  const selectedStepNumber
    = typeof formSelectedTabId === 'string'
      ? findIndex(applicationTabs, tab => tab.id === formSelectedTabId) + 1
      : 1

  const goToStep = useCallback((tabId: string) => {
    const el = document.getElementById(tabId)
    if (el) {
      window.scrollTo({
        top: el.offsetTop,
        behavior: 'smooth',
      })
    }
  }, [])

  // Track pending tab selection after click
  const pendingTabId = useRef<string | null>(null)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Flag to indicate the tab change was driven by the scroll handler itself (CASE 2),
  // so CASE 1 should not also trigger a programmatic scroll (which would cause a feedback loop).
  const scrollHandlerUpdatedTab = useRef(false)

  // CASE 1 - the form scrolls to a new tab based on validation errors
  useEffect(() => {
    if (typeof formSelectedTabId === 'string') {
      if (!scrollHandlerUpdatedTab.current) {
        goToStep(formSelectedTabId)
      }
      scrollHandlerUpdatedTab.current = false
    }
  }, [goToStep, formSelectedTabId])

  // CASE 2 - the user scrolls on the page, so we auto-select a new tab
  useEffect(() => {
    const onScroll = () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
      scrollTimeout.current = setTimeout(() => {
        const scrollPos = window.scrollY
        const scrollBuffer = window.innerHeight * 0.5
        let currentSectionIndex = 1

        for (let i = 0; i < applicationTabs.length; i++) {
          const element = document.getElementById(applicationTabs[i].id)
          if (!element) continue
          const elementTop = element.offsetTop
          const elementHeight = element.offsetHeight
          const elementBottom = elementTop + elementHeight
          if (scrollPos + scrollBuffer >= elementTop && scrollPos + scrollBuffer < elementBottom) {
            currentSectionIndex = i + 1
            break
          }
        }

        // If buffer is past the last section's top, select the last tab
        const lastTabId = applicationTabs.at(-1)?.id
        const lastElement = lastTabId ? document.getElementById(lastTabId) : null
        if (lastElement && scrollPos + scrollBuffer >= lastElement.offsetTop) {
          currentSectionIndex = applicationTabs.length
        }

        currentSectionIndex = Math.max(1, Math.min(currentSectionIndex, applicationTabs.length))
        const tabId = applicationTabs[currentSectionIndex - 1]?.id

        if (pendingTabId.current) {
          if (tabId === pendingTabId.current) {
            pendingTabId.current = null
            if (pendingTimeout.current) clearTimeout(pendingTimeout.current)
          }
          return
        }

        if (tabId && tabId !== formSelectedTabId && onTabChange) {
          // Mark that this tab change originated from scrolling so CASE 1
          // does not also trigger a programmatic scroll-to, creating a loop.
          scrollHandlerUpdatedTab.current = true
          onTabChange(tabId)
        }
      }, 80)
    }

    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
      if (pendingTimeout.current) clearTimeout(pendingTimeout.current)
    }
  }, [applicationTabs, formSelectedTabId, onTabChange])

  return (
    <div className="multi-step-buttons-container">
      <Tabs
        value={selectedStepNumber}
        variant="scrollable"
        scrollButtons="auto"
        orientation="vertical"
        slotProps={{
          indicator: { style: { background: '#2BBD9B' } },
        }}
        // CASE 3 - the user selects a new tab by clicking on it
        onChange={(_event, step) => {
          const tabId = applicationTabs[step - 1].id
          if (onTabChange) onTabChange(tabId)
          goToStep(tabId)
          pendingTabId.current = tabId
          if (pendingTimeout.current) clearTimeout(pendingTimeout.current)
          // Fallback: clear pending after 1s if scroll never lands
          pendingTimeout.current = setTimeout(() => {
            pendingTabId.current = null
          }, 1000)
        }}
      >
        {applicationTabs.map((tabConfig, index) => {
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
        })}
      </Tabs>
    </div>
  )
}
