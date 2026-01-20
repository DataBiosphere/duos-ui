import { redirectOnLogout } from './auth/auth'
import { spinnerService } from './spinner-service'
import { reportError } from './ajax/fetchAdapter'

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
