import { div, img } from 'react-hyperscript-helpers';
import loadingIndicator from '../images/loading-indicator.svg';

//spinner constant to be used everywhere
export const Spinner =
  div({ style: { textAlign: 'center', height: '44px', width: '180px' } }, [
    img({ src: loadingIndicator, alt: 'spinner' })
  ]);

// TODO: implement this spinner in every componentDidMount or Init method on
// pages that call async methods upon loading the page.
// ManageDac, AddDacModal, DataAccessRequest, AppSummary, AccessReview, SigningOfficialConsole,
// ReviewResults, ReviewedCases, ResearcherProfile, NewMemberConsole, DataSharingLanguageTool,
// DatasetStatistics, DatasetRegistration, DatasetCatalog, DataOwnerReview, DataAccessRequestApplication,
// ChairConsole, BackgroundSignIn, AdminManageUser, AdminManageLC, AdminMaangeInstitutions,
// AdminConsole, SUpportRequestModal, ElectionTimeoutModal,
// DacDatasetsModal, EraCommons, ApplicationSummaryModa, AddUserModal, AddInstitutionModal,
// LibraryCardTable, DarTable DarTableCancelButton, SubmitVoteBox
// See SignIn for example usage of this constant.