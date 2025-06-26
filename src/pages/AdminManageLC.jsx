import React from 'react';
import { useState, useEffect } from 'react';
import { Institution } from '../libs/ajax/Institution';
import { LibraryCard } from '../libs/ajax/LibraryCard';
import { Notifications } from '../libs/utils';
import LibraryCardTable from '../components/library_card_table/LibraryCardTable';

export default function AdminManageLC() {
  const [libraryCards, setLibraryCards] = useState();
  const [institutions, setInstitutions] = useState();

  //init hook to get users, institutions, and cards to be passed down as props
  useEffect(() => {
    const initData = async() => {
      const dataPromiseArray = await Promise.all([
        LibraryCard.getAllLibraryCards(),
        Institution.list()
      ]);
      const cards = dataPromiseArray[0];
      const institutions = dataPromiseArray[1].map((institution) => {
        return {
          ...institution,
          key: institution.id,
          displayText: institution.name
        };
      });
      setLibraryCards(cards);
      setInstitutions(institutions);
    };
    try{
      initData();
    } catch {
      Notifications.showError({text:'Error: Failed to initialize component'});
    }
  }, []);

  //props are expecting array format
  return (
    <LibraryCardTable institutions={institutions} libraryCards={libraryCards} />
  );
}
