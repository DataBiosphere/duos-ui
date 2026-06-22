import { Config } from '../config'
import { fetchGet, fetchPost, fetchPut, fetchPatch, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { InstitutionInterface } from 'src/types/model'

export const Institution = {
  /**
   * Retrieve the full list of institutions.
   * @returns Promise resolving to an array of InstitutionInterface objects
   */
  list: async (): Promise<InstitutionInterface[]> => {
    const url = `${await Config.getApiUrl()}/api/institutions`
    const res = await fetchGet<InstitutionInterface[]>(url, Config.authOpts())
    return res.data
  },

  /**
   * Retrieve a single institution by its ID.
   * @param id The numeric institution ID
   * @returns Promise resolving to the matching InstitutionInterface
   */
  getById: async (id: number): Promise<InstitutionInterface> => {
    const url = `${await Config.getApiUrl()}/api/institutions/${id}`
    const res = await fetchGet<InstitutionInterface>(url, Config.authOpts())
    return res.data
  },

  /**
   * Create a new institution.
   * @param institution The institution data to create
   * @returns Promise resolving to the created InstitutionInterface
   */
  postInstitution: async (institution: Partial<InstitutionInterface>): Promise<InstitutionInterface> => {
    const url = `${await Config.getApiUrl()}/api/institutions`
    const res = await fetchPost<InstitutionInterface, Partial<InstitutionInterface>>(url, institution, Config.authOpts())
    return res.data
  },

  /**
   * Replace an existing institution by ID.
   * @param id The numeric institution ID
   * @param institution The replacement institution data
   * @returns Promise resolving to the updated InstitutionInterface
   */
  putInstitution: async (id: number, institution: Partial<InstitutionInterface>): Promise<InstitutionInterface> => {
    const url = `${await Config.getApiUrl()}/api/institutions/${id}`
    const res = await fetchPut<InstitutionInterface, Partial<InstitutionInterface>>(url, institution, Config.authOpts())
    return res.data
  },

  /**
   * Partially update an existing institution by ID.
   * @param id The numeric institution ID
   * @param institution The partial institution data to patch
   * @returns Promise resolving to the updated InstitutionInterface
   */
  patchInstitution: async (id: number, institution: Partial<InstitutionInterface>): Promise<InstitutionInterface> => {
    const url = `${await Config.getApiUrl()}/api/institutions/${id}`
    const res = await fetchPatch<InstitutionInterface, Partial<InstitutionInterface>>(url, institution, Config.authOpts())
    return res.data
  },

  /**
   * Delete an institution by ID.
   * @param id The numeric institution ID
   * @returns Promise resolving to the deleted InstitutionInterface
   */
  deleteInstitution: async (id: number): Promise<InstitutionInterface> => {
    const url = `${await Config.getApiUrl()}/api/institutions/${id}`
    const res = await fetchDelete<InstitutionInterface>(url, Config.authOpts())
    return res.data
  },
}
