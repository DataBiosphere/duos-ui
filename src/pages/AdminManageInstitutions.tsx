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
import { Link } from 'react-router-dom'
import { extractError } from 'src/utils/ErrorUtils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'

export default function AdminManageInstitutions() {
  usePageTitle('Institutions')
  const [institutionList, setInstitutionList] = useState<InstitutionInterface[]>([])
  const [filteredList, setFilteredList] = useState<InstitutionInterface[]>([])
  const [tableSize, setTableSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')

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

  const handleSearchChange = (query: { current: { value: string } }) => {
    setSearchTerm(query.current.value)
    setFilteredList(filter(institutionList, query.current.value))
  }

  const filter = (list: InstitutionInterface[], value: string): InstitutionInterface[] => {
    if (value) {
      return getSearchFilterFunctions().institutions(value, list)
    }
    return list
  }
  return (
    <div style={Styles.PAGE} data-cy="admin-manage-institutions">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <TableHeaderSection
          icon={manageInstitutionsIcon}
          title="Manage Institutions"
          description="Select and manage Institutions"
        />
        <SearchBar
          handleSearchChange={handleSearchChange}
          currentPage={currentPage}
          style={{ width: '60%', margin: '0 3% 0 0' }}
          button={(
            <div>
              <Link
                id="btn_addInstitution"
                to="/admin_manage_institutions/create_new"
                state={{ institutionList }}
                className="btn-primary btn-add common-background"
                style={{ marginTop: '30%', display: 'block', lineHeight: 0.6 }}
              >
                <span>Add Institution</span>
              </Link>
            </div>
          )}
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
