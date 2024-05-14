import * as fp from 'lodash/fp';
import { cloneDeep, flow, unset } from 'lodash/fp';
import { Config } from '../config';
import axios from 'axios';
import { getApiUrl, fetchOk, fetchAny } from '../ajax';
import { CreateDuosUserResponse, DuosUserResponse, UpdateDuosUserResponse } from 'src/types/responseTypes';
import { CreateDuosUserRequest, UpdateDuosUserRequestV1, UpdateDuosUserRequestV2 } from 'src/types/requestTypes';
import { AcknowledgementMap, ApprovedDataset, Dataset, DuosUser, SimplifiedDuosUser } from 'src/types/model';

export const User = {
  getMe: async (): Promise<DuosUserResponse> => {
    const url = `${await getApiUrl()}/api/user/me`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  getById: async (id: number): Promise<DuosUserResponse> => {
    const url = `${await getApiUrl()}/api/user/${id}`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  list: async (roleName: 'Admin' | 'SigningOfficial'): Promise<DuosUserResponse[]> => {
    const url = `${await getApiUrl()}/api/user/role/${roleName}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async (request: CreateDuosUserRequest): Promise<CreateDuosUserResponse> => {
    const url = `${await getApiUrl()}/api/dacuser`;
    try {
      const res = await fetchOk(
        url,
        fp.mergeAll([
          Config.authOpts(),
          Config.jsonBody(request),
          { method: 'POST' },
        ])
      );
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      return false;
    }
  },

  updateSelf: async (payload: UpdateDuosUserRequestV1): Promise<UpdateDuosUserResponse> => {
    const url = `${await getApiUrl()}/api/user`;
    // We should not be updating the user's create date, associated institution, or library cards
    try {
      const res = await fetchOk(
        url,
        fp.mergeAll([
          Config.authOpts(),
          Config.jsonBody(payload),
          { method: 'PUT' },
        ])
      );
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      return false;
    }
  },

  update: async (user: UpdateDuosUserRequestV2, userId: number)/*: Promise<UpdateDuosUserResponse>*/ => {
    const url = `${await getApiUrl()}/api/user/${userId}`;
    // We should not be updating the user's create date, associated institution, or library cards
    // This below code does not seem to work at all and
    // does not seem appropriate for this request anyway.
    // The UpdateDuosUserRequestV2 is not the same shape as a DuosUser
    // like this flow suggests.
    const filteredUser = flow(
      cloneDeep,
      unset('updatedUser.createDate'),
      unset('updatedUser.institution'),
      unset('updatedUser.libraryCards')
    )(user);
    try {
      const res = await fetchOk(
        url,
        fp.mergeAll([
          Config.authOpts(),
          Config.jsonBody(filteredUser),
          { method: 'PUT' },
        ])
      );
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      return false;
    }
  },

  registerUser: async (): Promise<DuosUser> => {
    const url = `${await getApiUrl()}/api/user`;
    const res = await fetchOk(
      url,
      fp.mergeAll([Config.authOpts(), { method: 'POST' }])
    );
    return res.json();
  },

  getSOsForCurrentUser: async (): Promise<SimplifiedDuosUser[]> => {
    const url = `${await getApiUrl()}/api/user/signing-officials`;
    const res = await fetchOk(
      url,
      fp.mergeAll([Config.authOpts(), { method: 'GET' }])
    );
    return res.json();
  },

  getUnassignedUsers: async (): Promise<DuosUserResponse[]> => {
    const url = `${await getApiUrl()}/api/user/institution/unassigned`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  addRoleToUser: async (userId: number, roleId: number): Promise<DuosUserResponse> => {
    const url = `${await getApiUrl()}/api/user/${userId}/${roleId}`;
    const res = await fetchAny(
      url,
      fp.mergeAll([Config.authOpts(), { method: 'PUT' }])
    );
    return res.json();
  },

  deleteRoleFromUser: async (userId: number, roleId: number): Promise<DuosUserResponse> => {
    const url = `${await getApiUrl()}/api/user/${userId}/${roleId}`;
    const res = await fetchAny(
      url,
      fp.mergeAll([Config.authOpts(), { method: 'DELETE' }])
    );
    return res.json();
  },


  getUserRelevantDatasets: async (): Promise<Dataset[]> => {
    const url = `${await getApiUrl()}/api/user/me/dac/datasets`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  getAcknowledgements: async (): Promise<AcknowledgementMap> => {
    const url = `${await getApiUrl()}/api/user/acknowledgements`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  acceptAcknowledgments: async (...keys: string[]): Promise<AcknowledgementMap> => {
    if (keys.length === 0) {
      return {};
    }

    const url = `${await getApiUrl()}/api/user/acknowledgements`;
    const res = await axios.post(url, keys, Config.authOpts());
    return res.data;
  },

  getApprovedDatasets: async (): Promise<ApprovedDataset[]> => {
    const url = `${await getApiUrl()}/api/user/me/researcher/datasets`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
};
