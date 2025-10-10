import { Auth } from './auth/auth'
import { Config } from './config'
import { spinnerService } from './spinner-service'
import { StackdriverReporter } from './stackdriverReporter'

// to log out user and redirect to home when response has 401 status
// return responses with statuses in the 200s and reject the rest
export const redirectOnLogout = () => {
  Auth.signOut()
  window.location.href = `/home?redirectTo=${window.location.pathname}`
}

export const getApiUrl = async () => {
  return await Config.getApiUrl()
}

export const getBardApiUrl = async () => {
  return await Config.getBardApiUrl()
}

export const getOntologyUrl = async () => {
  return await Config.getOntologyApiUrl()
}

export const getECMUrl = async () => {
  return await Config.getECMUrl()
}

export const fetchOk = async (...args) => {
  // TODO: Remove spinnerService calls
  spinnerService.showAll()
  const res = await fetch(...args)
  if (!res.ok && res.status === 401) {
    redirectOnLogout()
  }
  if (res.status >= 400) {
    await reportError(args[0], res.status)
  }
  spinnerService.hideAll()
  return res.ok ? res : Promise.reject(res)
}

export const quietFetchOk = async (...args) => {
  const res = await fetch(...args)
  if (!res.ok && res.status === 401) {
    redirectOnLogout()
  }
  if (res.status >= 400) {
    await reportError(args[0], res.status)
  }
  return res.ok ? res : Promise.reject(res)
}

export const fetchAny = async (...args) => {
  // TODO: Remove spinnerService calls
  spinnerService.showAll()
  const res = await fetch(...args)
  if (!res.ok && res.status === 401) {
    redirectOnLogout()
  }
  if (res.status >= 500) {
    await reportError(args[0], res.status)
  }
  spinnerService.hideAll()
  return res
}

export const reportError = async (url, status) => {
  const msg = 'Error fetching response: '
    .concat(JSON.stringify(url))
    .concat('Status: ')
    .concat(status)
  await StackdriverReporter.report(msg)
}
