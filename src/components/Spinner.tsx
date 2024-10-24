import React from 'react';
import loadingIndicator from '../images/loading-indicator.svg';

//spinner constant to be used everywhere
export function Spinner() {
  return <div style={{textAlign: 'center', height: '44px', width: '180px'}}>
    <img src={loadingIndicator} alt='spinner'/>
  </div>;
}

// TODO: implement this spinner in every componentDidMount or Init method on
// pages that call async methods upon loading the page.
// ManageDac, AddDacModal, DataAccessRequest, AppSummary, AccessReview, SigningOfficialConsole,
// ResearcherProfile, NewMemberConsole, DataSharingLanguageTool,
// DatasetStatistics, DatasetRegistration, DatasetCatalog, DataOwnerReview, DataAccessRequestApplication,
// ChairConsole, BackgroundSignIn, AdminManageUser, AdminManageLC, AdminMaangeInstitutions,
// SupportRequestModal, ElectionTimeoutModal,
// DacDatasetsModal, EraCommons, ApplicationSummaryModa, AddUserModal, AddInstitutionModal,
// LibraryCardTable, DarTableCancelButton, SubmitVoteBox
// See SignIn for example usage of this constant.
