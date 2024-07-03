import React from 'react';
import { Checkbox } from '@mui/material';
import { DAA } from '../../libs/ajax/DAA';
import { Notifications } from '../../libs/utils';

export default function DAACell(props) {
  const {rowDac, researcher, institutionId, daas, refreshResearchers, setResearchers} = props;
  const id = researcher?.userId || researcher?.email;
  const libraryCards = researcher?.libraryCards;
  const card = libraryCards?.find(card => card.institutionId === institutionId);
  const daaIds = researcher && card?.daaIds;
  const filteredDaas = daaIds && daas?.filter(daa => daaIds.includes(daa.daaId));
  const hasDacId = filteredDaas && filteredDaas?.some(daa => daa?.dacs?.some(dac => dac?.dacId === rowDac?.dacId));

  const createDaaLcLink = async (daaId, researcher, dacName) => {
    try {
      await DAA.createDaaLcLink(daaId, researcher.userId);
      Notifications.showSuccess({text: `Approved access to ${dacName} to user: ${researcher.displayName}`});
      refreshResearchers(setResearchers);
    } catch(error) {
      Notifications.showError({text: `Error approving access to ${dacName} to user: ${researcher.displayName}`});
    }
  };

  const deleteDaaLcLink = async (daaId, researcher, dacName) => {
    try {
      await DAA.deleteDaaLcLink(daaId, researcher.userId);
      Notifications.showSuccess({text: `Removed approval of access to ${dacName} to user: ${researcher.displayName}`});
      refreshResearchers(setResearchers);
    } catch(error) {
      Notifications.showError({text: `Error removing approval of access to ${dacName} to user: ${researcher.displayName}`});
    }
  };

  const handleClick = async (daas, specificDac, researcher) => {
    const daaId = daas.find(daa => daa?.dacs?.some(dac => dac.dacId === specificDac.dacId))?.daaId;
    if (!hasDacId) {
      createDaaLcLink(daaId, researcher, specificDac.name);
    } else {
      deleteDaaLcLink(daaId, researcher, specificDac.name);
    }
  };

  return {
    isComponent: true,
    id,
    label: 'lc-button',
    data: (
      <div>
        <Checkbox checked={hasDacId} onClick={() => handleClick(daas, rowDac, researcher)}/>
      </div>
    ),
  };
}