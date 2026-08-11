import { Config } from 'src/libs/config'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { LibraryCard as LibraryCardModel } from 'src/types/model'

export const LibraryCard = {
  /**
   * Retrieve all library cards.
   * @returns Promise resolving to an array of LibraryCard records
   */
  getAllLibraryCards: async (): Promise<LibraryCardModel[]> => {
    const url = `${await Config.getApiUrl()}/api/libraryCards`
    const res = await fetchGet<LibraryCardModel[]>(url)
    return res.data
  },

  /**
   * Create a new library card.
   * @param card The library card data to create
   * @returns Promise resolving to the created LibraryCard record
   */
  createLibraryCard: async (card: LibraryCardModel): Promise<LibraryCardModel> => {
    const url = `${await Config.getApiUrl()}/api/libraryCards`
    const res = await fetchPost<LibraryCardModel, LibraryCardModel>(url, card)
    return res.data
  },

  /**
   * Delete a library card by ID.
   * @param id The ID of the library card to delete
   * @returns Promise resolving to the deleted LibraryCard record
   */
  deleteLibraryCard: async (id: number): Promise<LibraryCardModel> => {
    const url = `${await Config.getApiUrl()}/api/libraryCards/${id}`
    const res = await fetchDelete<LibraryCardModel>(url)
    return res.data
  },
}
