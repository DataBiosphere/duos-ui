import { useState, useEffect } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Institution, User } from '../libs/ajax';
import { LibraryCard } from '../libs/ajax';
import { Notifications } from '../libs/utils';
import LibraryCardTable from '../components/library_card_table/LibraryCardTable';

export default function AdminManageLC() {
  const [libraryCards, setLibraryCards] = useState();
  const [institutions, setInstitutions] = useState();
  const [users, setUsers] = useState();

  useEffect(() => {
    const initData = async() => {
      const dataPromiseArray = await Promise.all([
        LibraryCard.getAllLibraryCards(),
        Institution.list(),
        User.list()
      ]);
      const cards = dataPromiseArray[0];
      const institutions = dataPromiseArray[1].map((institution) => {
        return {
          ...institution,
          key: institution.id,
          displayText: institution.name
        };
      });
      const users = dataPromiseArray[2];
      setLibraryCards(cards);
      setInstitutions(institutions);
      setUsers(users);
    };
    try{
      initData();
    } catch(error) {
      Notifications.showError({text:'Error: Failed to initialize component'});
    }
  }, []);

  return h(LibraryCardTable, {users, institutions, libraryCards});
}