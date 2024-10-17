import React, {useEffect, useState} from 'react';
import {Button} from '@mui/material';
import {DAA} from '../../libs/ajax/DAA';
import {DAAUtils} from '../../utils/DAAUtils';
import {DAR} from '../../libs/ajax/DAR';
import {Storage} from '../../libs/storage';
import DatasetSelectionModal from './DatasetSelectionModal';


export default function ApplyForAccess(props) {

  const { datasets, selectedDatasetKeys, history } = props;
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [allowableTermSelections, setAllowableTermSelections] = useState([]);
  const [openTermSelections, setOpenTermSelections] = useState([]);
  const [externalTermSelections, setExternalTermSelections] = useState([]);
  const [unselectableTermSelections, setUnselectableTermSelections] = useState([]);

  useEffect(() => {
    const init = async () => {
      // Logical cases:
      //    1. If the user has access to all datasets - go straight to apply
      //    2. If the user has access to some datasets show the partially selected datasets modal
      //    3. If the user requests access to Open or External Access datasets, show the partially selected datasets modal
      //    4. If the user has no access to any datasets, show custom message in modal
      const allDAAs = await DAA.getDaas();
      const selectedDatasetIds = selectedDatasetKeys.map((id) => parseInt(id.replace('dataset-', '')));
      const selectedTerms = datasets.filter(d => selectedDatasetIds.includes(d.datasetId));
      const user = Storage.getCurrentUser();
      const userLibraryCardDAAIds = user.libraryCards.flatMap(lc => lc.daaIds);
      const userDAAs = allDAAs.filter(daa => userLibraryCardDAAIds.includes(daa.daaId));

      // Ensure that the dataset's DAC is one of the DACs that match any of the DACs in the user's list of DAAs
      let allowable = [];
      let open = [];
      let external = [];
      let unAllowable = [];
      selectedTerms.forEach(term => {
        if (term.accessManagement === 'open') {
          open.push(term);
        } else if (term.accessManagement === 'external') {
          external.push(term);
        } else {
          const selectedTermDacId = term.dac?.dacId;
          const matchingDatasetDAA = userDAAs.filter(daa => {
            const daaDacIds = daa.dacs?.map(dac => dac.dacId);
            return daaDacIds?.includes(selectedTermDacId);
          });
          if (matchingDatasetDAA.length > 0) {
            allowable.push(term);
          } else {
            unAllowable.push(term);
          }
        }
      });
      setAllowableTermSelections(allowable);
      setOpenTermSelections(open);
      setExternalTermSelections(external);
      setUnselectableTermSelections(unAllowable);
    };
    init();
  }, [datasets, selectedDatasetKeys]);

  const preCheckApply = async () => {
    const selectedDatasetIds = selectedDatasetKeys.map((id) => parseInt(id.replace('dataset-', '')));
    const selectedTerms = datasets.filter(d => selectedDatasetIds.includes(d.datasetId));
    if (allowableTermSelections.length === selectedTerms.length) {
      // Go straight to Apply for Access:
      await applyForAccess();
    } else {
      // Some combination of partially allowed, open, external, or no available terms are selected
      setShowDatasetModal(true);
    }
  };

  const applyForAccess = async () => {
    const draftDatasetIds = allowableTermSelections.map((d) => d.datasetId);
    const darDraft = await DAR.postDarDraft({ datasetId: draftDatasetIds });
    history.push(`/dar_application/${darDraft.referenceId}`);
  };

  return (
    <>
      <Button variant="contained" onClick={() => DAAUtils.isEnabled() ? preCheckApply() : applyForAccess()} sx={{ transform: 'scale(1.5)' }} >
        Apply for Access
      </Button>
      {
        showDatasetModal &&
        <DatasetSelectionModal
          showModal={showDatasetModal}
          onCloseRequest={()=>setShowDatasetModal(false)}
          onApply={applyForAccess}
          datasets={datasets}
          allowableTermSelections={allowableTermSelections}
          openTermSelections={openTermSelections}
          externalTermSelections={externalTermSelections}
          unselectableTermSelections={unselectableTermSelections}
        />
      }
    </>
  );
}