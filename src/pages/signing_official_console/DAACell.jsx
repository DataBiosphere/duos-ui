import React from 'react';
import { Checkbox } from '@mui/material';
import { DAA } from '../../libs/ajax/DAA';
import { Notifications } from '../../libs/utils';

export default function DAACell(rowDac, researcher, institutionId, daas, refreshResearchers, setResearchers) {
    // const {rowDac, researcher, institutionId, daas, refreshResearchers, setResearchers} = props;
    const id = researcher && (researcher.userId || researcher.email);
    const libraryCards = researcher && researcher.libraryCards;
    const card = libraryCards && libraryCards.find(card => card.institutionId === institutionId);
    const daaIds = researcher && card && card.daaIds;
    const filteredDaas = daaIds && daas.filter(daa => daaIds.includes(daa.daaId));
    const hasDacId = filteredDaas && filteredDaas.some(daa => daa.dacs.some(dac => dac.dacId === rowDac.dacId));
    console.log(hasDacId);

    const handleClick = async (researcher, specificDac, filteredDaas, checked, refreshResearchers, setResearchers) => {
        const daaId = filteredDaas.find(daa => daa.dacs.some(dac => dac.dacId === specificDac.dacId))?.daaId;
        if (!checked) {
          try {
            await DAA.createDaaLcLink(daaId, researcher.userId);
            Notifications.showSuccess({text: `Approved access to ${specificDac.name} to user: ${researcher.displayName}`});
            refreshResearchers(setResearchers);
          } catch(error) {
            Notifications.showError({text: `Error approving access to ${specificDac.name} to user: ${researcher.displayName}`});
          }
        } else {
          try {
            await DAA.deleteDaaLcLink(daaId, researcher.userId);
            Notifications.showSuccess({text: `Removed approval of access to ${specificDac.name} to user: ${researcher.displayName}`});
            refreshResearchers(setResearchers);
          } catch(error) {
            Notifications.showError({text: `Error removing approval of access to ${specificDac.name} to user: ${researcher.displayName}`});
          }
        }
      };
  
    return {
      isComponent: true,
      id,
      label: 'lc-button',
      data: (
        <div>
          <Checkbox checked={hasDacId} onClick={() => handleClick(researcher,rowDac, daas, hasDacId, refreshResearchers, setResearchers)}/>
        </div>
      ),
    };
  };