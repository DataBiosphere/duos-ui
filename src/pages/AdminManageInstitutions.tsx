import React, { useEffect, useState } from 'react'
import { Institution as InstitutionAPI } from 'src/libs/ajax/Institution'
import { InstitutionInterface } from 'src/types/model'
import { Styles } from '../libs/theme'
import { getSearchFilterFunctions, Notifications } from 'src/libs/utils'
import manageInstitutionsIcon from 'src/images/icon_manage_dac.png'
import SearchBar from 'src/components/SearchBar'
import InstitutionTable from 'src/components/institution_table/InstitutionTable'
import { tableHeaderTemplate, tableRowLoadingTemplate } from 'src/components/institution_table/InstitutionTableUtils'
import DarTableSkeletonLoader from 'src/components/TableSkeletonLoader'
import { useNavigate } from 'react-router-dom'
import { extractError } from 'src/utils/ErrorUtils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

export default function AdminManageInstitutions() {
  usePageTitle('Institutions')
  const [institutionList, setInstitutionList] = useState<InstitutionInterface[]>([])
  const [filteredList, setFilteredList] = useState<InstitutionInterface[]>([])
  const [tableSize, setTableSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')

  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        const listOfInstitutions = await InstitutionAPI.list()
        setInstitutionList(listOfInstitutions)
        setFilteredList(listOfInstitutions)
        setIsLoading(false)
      }
      catch (error) {
        const message = extractError(error)
        Notifications.showError({ text: 'Error: Unable to retrieve institutions from server: ' + message })
      }
      finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    setFilteredList(filter(institutionList, searchTerm))
  }, [searchTerm, institutionList])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setFilteredList(filter(institutionList, value))
  }

  const filter = (list: InstitutionInterface[], value: string): InstitutionInterface[] => {
    if (value) {
      return getSearchFilterFunctions().institutions(value, list)
    }
    return list
  }

  const addInstitution = () => {
    navigate('/admin_manage_institutions/create_new', {
      state: { institutionList },
    })
  }

  return (
    <div style={Styles.PAGE} data-cy="admin-manage-institutions">
      <div>
        <TableHeaderSection
          icon={{ src: manageInstitutionsIcon }}
          title="Manage Institutions"
          description="Select and manage Institutions"
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar
          handleSearchChange={handleSearchChange}
        />
        <AddObjectButton
          id="btn_addInstitution"
          label="ADD INSTITUTION"
          onClick={addInstitution}
          icon={<AddCircleOutlineIcon />}
          className="button button-blue"
        />
      </div>
      {!isLoading && (
        <InstitutionTable
          filteredList={filteredList}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          tableSize={tableSize}
          setTableSize={setTableSize}
        />
      )}
      {isLoading && (
        <DarTableSkeletonLoader
          tableHeaderTemplate={tableHeaderTemplate}
          tableRowLoadingTemplate={tableRowLoadingTemplate}
        />
      )}
    </div>
  )
}
