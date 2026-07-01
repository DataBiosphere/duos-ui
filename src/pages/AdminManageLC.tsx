import React, { useState, useEffect } from 'react'
import { LibraryCard as LibraryCardAPI } from 'src/libs/ajax/LibraryCard'
import { Notifications } from 'src/libs/utils'
import LibraryCardTable from 'src/components/library_card_table/LibraryCardTable'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { LibraryCard } from 'src/types/model'

export default function AdminManageLC() {
  usePageTitle('Library Cards')
  const [libraryCards, setLibraryCards] = useState<LibraryCard[]>([])

  useEffect(() => {
    const initData = async () => {
      try {
        const cards = await LibraryCardAPI.getAllLibraryCards()
        setLibraryCards(cards)
      }
      catch {
        Notifications.showError({ text: 'Error: Failed to initialize component' })
      }
    }
    initData()
  }, [])

  return (
    <LibraryCardTable libraryCards={libraryCards} />
  )
}
