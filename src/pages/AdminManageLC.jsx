import React from 'react'
import { useState, useEffect } from 'react'
import { Institution } from 'src/libs/ajax/Institution'
import { LibraryCard } from 'src/libs/ajax/LibraryCard'
import { Notifications } from 'src/libs/utils'
import LibraryCardTable from 'src/components/library_card_table/LibraryCardTable'
import { usePageTitle } from 'src/hooks/usePageTitle'

export default function AdminManageLC() {
  usePageTitle('Library Cards')
  const [libraryCards, setLibraryCards] = useState()
  const [institutions, setInstitutions] = useState()

  // init hook to get users, institutions, and cards to be passed down as props
  useEffect(() => {
    const initData = async () => {
      const dataPromiseArray = await Promise.all([
        LibraryCard.getAllLibraryCards(),
        Institution.list(),
      ])
      const cards = dataPromiseArray[0]
      const institutions = dataPromiseArray[1].map((institution) => {
        return {
          ...institution,
          key: institution.id,
          displayText: institution.name,
        }
      })
      setLibraryCards(cards)
      setInstitutions(institutions)
    }
    try {
      initData()
    }
    catch {
      Notifications.showError({ text: 'Error: Failed to initialize component' })
    }
  }, [])

  // props are expecting array format
  return (
    <LibraryCardTable institutions={institutions} libraryCards={libraryCards} />
  )
}
