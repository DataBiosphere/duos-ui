import { DAR } from 'src/libs/ajax/DAR'
import { Notifications } from 'src/libs/utils'
import ReactMarkdown from 'react-markdown'
import * as React from 'react'
import { NavigateFunction } from 'react-router-dom'
import { extractError } from 'src/utils/ErrorUtils'

export const applyForAccess = async (selected: number[], navigate: NavigateFunction) => {
  try {
    const draftResponse = await DAR.postDarDraft({ datasetId: selected })
    if (draftResponse.referenceId) {
      navigate(`/dar_application/${draftResponse.referenceId}`)
    }
    else if (draftResponse.code && draftResponse.message) {
      Notifications.showError(
        {
          text: <ReactMarkdown>{draftResponse.message}</ReactMarkdown>,
          timeout: 6000,
        })
    }
    else {
      Notifications.showError({ text: 'Error: Unable to create a Draft Data Access Request' })
    }
  }
  catch (error) {
    const errorMessage = extractError(error)
    if (errorMessage !== 'Unknown error') {
      Notifications.showError({ text: <ReactMarkdown>{errorMessage}</ReactMarkdown>, timeout: 6000 })
    }
    else {
      Notifications.showError({ text: 'Error: Unable to create a Draft Data Access Request' })
    }
  }
}
