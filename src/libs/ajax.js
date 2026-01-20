import { Auth } from './auth/auth'
import { spinnerService } from './spinner-service'
import { reportError } from './ajax/fetchAdapter'

// to log out user and redirect to home when response has 401 status
// return responses with statuses in the 200s and reject the rest
export const redirectOnLogout = () => {
  Auth.signOut()
  window.location.href = `/home?redirectTo=${window.location.pathname}`
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
