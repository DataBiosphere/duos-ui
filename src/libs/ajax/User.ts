import { cloneDeep, flow, unset } from 'lodash/fp'
import { Config } from 'src/libs/config'
import { getApiUrl } from 'src/libs/ajax'
import { fetchGet, fetchPost, fetchPut, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { CreateDuosUserRequest, UpdateDuosUserRequestV1, UpdateDuosUserRequestV2 } from 'src/types/requestTypes'
import {
  Acknowledgement,
  AcknowledgementMap,
  ApprovedDataset,
  Dataset,
  DuosUser,
  SimplifiedDuosUser,
} from 'src/types/model'

export const User = {
  getMe: async (): Promise<DuosUser> => {
    const url = `${await getApiUrl()}/api/user/me`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  getById: async (id: number): Promise<DuosUser> => {
    const url = `${await getApiUrl()}/api/user/${id}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  list: async (roleName: 'Admin' | 'SigningOfficial'): Promise<DuosUser[]> => {
    const url = `${await getApiUrl()}/api/user/role/${roleName}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  create: async (request: CreateDuosUserRequest): Promise<DuosUser | false | undefined> => {
    const url = `${await getApiUrl()}/api/dacuser`
    try {
      const res = await fetchPost(url, request, Config.authOpts())
      return res.data
    }
    catch {
      return false
    }
  },

  updateSelf: async (payload: UpdateDuosUserRequestV1): Promise<DuosUser | false | undefined> => {
    const url = `${await getApiUrl()}/api/user`
    // We should not be updating the user's create date, associated institution, or library cards
    try {
      const res = await fetchPut(url, payload, Config.authOpts())
      return res.data
    }
    catch {
      return false
    }
  },

  update: async (user: UpdateDuosUserRequestV2, userId: number)/* : Promise<UpdateDuosUserResponse> */ => {
    const url = `${await getApiUrl()}/api/user/${userId}`
    // We should not be updating the user's create date, associated institution, or library card
    // This below code does not seem to work at all and
    // does not seem appropriate for this request anyway.
    // The UpdateDuosUserRequestV2 is not the same shape as a DuosUser
    // like this flow suggests.
    const filteredUser = flow(
      cloneDeep,
      unset('updatedUser.createDate'),
      unset('updatedUser.institution'),
      unset('updatedUser.libraryCard'),
    )(user)
    try {
      const res = await fetchPut(url, filteredUser, Config.authOpts())
      return res.data
    }
    catch {
      return false
    }
  },

  registerUser: async (): Promise<DuosUser> => {
    const url = `${await getApiUrl()}/api/user`
    const res = await fetchPost(url, undefined, Config.authOpts())
    return res.data
  },

  getSOsForCurrentUser: async (): Promise<SimplifiedDuosUser[]> => {
    const url = `${await getApiUrl()}/api/user/signing-officials`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  getUnassignedUsers: async (): Promise<DuosUser[]> => {
    const url = `${await getApiUrl()}/api/user/institution/unassigned`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  addRoleToUser: async (userId: number, roleId: number): Promise<DuosUser> => {
    const url = `${await getApiUrl()}/api/user/${userId}/${roleId}`
    const res = await fetchPut(url, null, Config.authOpts())
    return res.data
  },

  deleteRoleFromUser: async (userId: number, roleId: number): Promise<DuosUser> => {
    const url = `${await getApiUrl()}/api/user/${userId}/${roleId}`
    const res = await fetchDelete(url, Config.authOpts())
    return res.data
  },

  getUserRelevantDatasets: async (): Promise<Dataset[]> => {
    const url = `${await getApiUrl()}/api/user/me/dac/datasets/v2`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  getAcknowledgements: async (): Promise<AcknowledgementMap> => {
    const url = `${await getApiUrl()}/api/user/acknowledgements`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  getAcknowledgement: async (key: string): Promise<Acknowledgement> => {
    const url = `${await getApiUrl()}/api/user/acknowledgements/${key}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  acceptAcknowledgments: async (...keys: string[]): Promise<AcknowledgementMap> => {
    if (keys.length === 0) {
      return {}
    }
    const url = `${await getApiUrl()}/api/user/acknowledgements`
    const res = await fetchPost(url, keys, Config.authOpts())
    return res.data
  },

  getApprovedDatasets: async (): Promise<ApprovedDataset[]> => {
    const url = `${await getApiUrl()}/api/user/me/researcher/datasets`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
}
