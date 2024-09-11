import React from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import {USER_ROLES} from './libs/utils';
import ManageDac from './pages/manage_dac/ManageDac';
import ManageEditDac from './pages/manage_dac/ManageEditDac';
import AdminManageUsers from './pages/AdminManageUsers';
import DataAccessRequestApplication from './pages/dar_application/DataAccessRequestApplication';
import DACDatasets from './pages/DACDatasets';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import NIHICWebform from './pages/NIHicWebform';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ResearcherConsole from './pages/researcher_console/ResearcherConsole';
import UserProfile from './pages/user_profile/UserProfile';
import RequestForm from './pages/user_profile/RequestForm';
import SigningOfficialResearchers from './pages/signing_official_console/SigningOfficialResearchers';
import ManageResearcherDAAs from './pages/signing_official_console/ManageResearcherDAAs';
import SigningOfficialDarRequests from './pages/signing_official_console/SigningOfficialDarRequests';
import SigningOfficialDataSubmitters from './pages/signing_official_console/SigningOfficialDataSubmitters';
import Translator from './pages/Translator';
import NIHPilotInfo from './pages/NIHPilotInfo';
import Status from './pages/Status';
import BackgroundSignIn from './pages/BackgroundSignIn';
import ConsentTextGenerator from './pages/ConsentTextGenerator';
import AdminManageInstitutions from './pages/AdminManageInstitutions';
import AdminManageLC from './pages/AdminManageLC';
import DatasetStatistics from './pages/DatasetStatistics';
import DarCollectionReview from './pages/dar_collection_review/DarCollectionReview';
import AdminManageDarCollections from './pages/AdminManageDarCollections';
import {AdminEditUser} from './pages/AdminEditUser';
import ChairConsole from './pages/ChairConsole';
import MemberConsole from './pages/MemberConsole';
import DatasetSubmissions from './pages/researcher_console/DatasetSubmissions';
import TermsOfService from './pages/TermsOfService';
import TermsOfServiceAcceptance from './pages/TermsOfServiceAcceptance';
import {HealthCheck} from './pages/HealthCheck';
import DataSubmissionForm from './pages/data_submission/DataSubmissionForm';
import {ensureSoHasDaaAcknowledgement} from './components/SigningOfficialDaaAgreementWrapper';
import {AnVILDMSPolicyInfo, NIHDMSPolicyInfo} from './pages/DMSPolicyInfo';
import {checkEnv, envGroups} from './utils/EnvironmentUtils';
import {DatasetUpdateForm} from './pages/DatasetUpdateForm';
import DatasetSearch from './pages/DatasetSearch';
import {StudyUpdateForm} from './pages/StudyUpdateForm';
import {DAAUtils} from './utils/DAAUtils';
import EditDac from './pages/manage_dac/EditDac';
import {Storage} from './libs/storage';
import * as Utils from './libs/utils';

const DuosRoutes = () => (
  <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/home" element={<Home/>}/>
    <Route path="/status" element={<Status/>}/>
    <Route path="/liveness" element={<HealthCheck/>}/>
    <Route path="/backgroundsignin" element={(checkEnv(envGroups.NON_STAGING)) ? <BackgroundSignIn/> : <NotFound/>}/>
    <Route path="/nih_ic_webform" element={<NIHICWebform/>}/>
    <Route path="/nih_pilot_info" element={<NIHPilotInfo/>}/>
    <Route path="/privacy" element={<PrivacyPolicy/>}/>
    <Route path="/tos" element={<TermsOfService/>}/>
    <Route path="/tos_acceptance" element={<TermsOfServiceAcceptance/>}/>
    <Route path="/consent_text_generator" element={<ConsentTextGenerator/>}/>
    <Route path="/nih_dms_policy" element={<NIHDMSPolicyInfo/>}/>
    <Route path="/anvil_dms_policy" element={<AnVILDMSPolicyInfo/>}/>
    <Route path="/profile"
      element={<Authed rolesAllowed={[USER_ROLES.all]}><UserProfile/></Authed>}
    />
    <Route path="/request_role"
      element={<Authed rolesAllowed={[USER_ROLES.all]}><RequestForm/></Authed>}
    />
    <Route path="/admin_review_collection/:collectionId"
      element={<Authed rolesAllowed={[USER_ROLES.admin]}><DarCollectionReview/></Authed>}
    />
    <Route path="/admin_manage_users"
      element={<Authed rolesAllowed={[USER_ROLES.admin]}><AdminManageUsers/></Authed>}
    />
    <Route path="/admin_edit_user/:userId"
      element={<Authed rolesAllowed={[USER_ROLES.admin]}><AdminEditUser/></Authed>}
    />
    <Route path="/manage_dac"
      element={<Authed rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]}><ManageDac/></Authed>}
    />
    <Route path="/manage_edit_dac/:dacId"
      element={<Authed rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]}><ManageEditDac/></Authed>}
    />
    <Route path="/manage_add_dac"
      element={<Authed rolesAllowed={[USER_ROLES.admin]}><ManageEditDac/></Authed>}
    />
    {DAAUtils.isEnabled() && <Route path="/manage_edit_dac_daa/:dacId"
      element={<Authed
        rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]}><EditDac/></Authed>}
    />}
    {DAAUtils.isEnabled() && <Route path="/manage_add_dac_daa"
      element={<Authed
        rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]}><EditDac/></Authed>}
    />}
    <Route path="/admin_manage_institutions"
      element={<Authed rolesAllowed={[USER_ROLES.admin]}><AdminManageInstitutions/></Authed>}
    />
    <Route path="/researcher_console"
      element={<Authed rolesAllowed={[USER_ROLES.researcher]}><ResearcherConsole/></Authed>}
    />
    <Route path="/dar_collection/:collectionId"
      element={<Authed
        rolesAllowed={[USER_ROLES.researcher, USER_ROLES.chairperson, USER_ROLES.member, USER_ROLES.signingOfficial]}><DarCollectionReview/></Authed>}
    />
    <Route path="/chair_console"
      element={<Authed rolesAllowed={[USER_ROLES.chairperson]}><ChairConsole/></Authed>}
    />
    <Route path="/member_console"
      element={<Authed rolesAllowed={[USER_ROLES.member]}><MemberConsole/></Authed>}
    />
    <Route path="/dar_vote_review/:collectionId"
      element={<Authed rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.member]}><DarCollectionReview readOnly={true}/></Authed>}
    />
    <Route path="/dar_application_review/:collectionId"
      element={<Authed rolesAllowed={[USER_ROLES.researcher]}><DataAccessRequestApplication readOnlyMode={true}/></Authed>}
    />
    {/* Order is important for processing links with embedded dataRequestIds */}
    <Route path="/dar_application/:dataRequestId"
      element={<Authed rolesAllowed={[USER_ROLES.researcher]}><DataAccessRequestApplication draftDar={true}/></Authed>}
    />
    <Route path="/dar_application"
      element={<Authed rolesAllowed={[USER_ROLES.researcher]}><DataAccessRequestApplication/></Authed>}
    />

    {/* TODO: Fix */}
    {/*<AuthenticatedRoute path="/signing_official_console/researchers" element={ensureSoHasDaaAcknowledgement(SigningOfficialResearchers, true)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />*/}
    <Route path="/signing_official_console/researchers"
      element={<Authed
        rolesAllowed={[USER_ROLES.researcher]}>{ensureSoHasDaaAcknowledgement(SigningOfficialResearchers, true)}</Authed>}
    />

    {/* TODO: Fix */}
    {/*{DAAUtils.isEnabled() && <AuthenticatedRoute path="/signing_official_console/researchers_daa_associations" element={ensureSoHasDaaAcknowledgement(ManageResearcherDAAs, true)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />}*/}
    {DAAUtils.isEnabled() && <Route path="/signing_official_console/researchers_daa_associations"
      element={<Authed
        rolesAllowed={[USER_ROLES.researcher]}>{ensureSoHasDaaAcknowledgement(ManageResearcherDAAs, true)}</Authed>}
    />}

    {/* TODO: Fix */}
    {/*<AuthenticatedRoute path="/signing_official_console/dar_requests" element={ensureSoHasDaaAcknowledgement(SigningOfficialDarRequests)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />*/}
    <Route path="/signing_official_console/dar_requests"
      element={<Authed
        rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]}>{ensureSoHasDaaAcknowledgement(SigningOfficialDarRequests)}</Authed>}
    />

    {/* TODO: Fix */}
    {/*{DAAUtils.isEnabled() && <AuthenticatedRoute path="/signing_official_console/data_submitters" element={ensureSoHasDaaAcknowledgement(SigningOfficialDataSubmitters, false, true)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />}*/}
    {DAAUtils.isEnabled() && <Route path="/signing_official_console/data_submitters"
      element={<Authed
        rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]}>{ensureSoHasDaaAcknowledgement(SigningOfficialDataSubmitters, false, true)}</Authed>}
    />}
    <Route path="/dataset_submissions"
      element={<Authed rolesAllowed={[USER_ROLES.dataSubmitter]}><DatasetSubmissions/></Authed>}
    />
    <Route path="/dataset_update/:datasetId"
      element={<Authed rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]}><DatasetUpdateForm/></Authed>}
    />
    <Route path="/data_submission_form"
      element={<Authed
        rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.dataSubmitter]}><DataSubmissionForm/></Authed>}
    />
    <Route path="/study_update/:studyId"
      element={<Authed
        rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.dataSubmitter]}><StudyUpdateForm/></Authed>}
    />
    <Route path="/admin_manage_lc"
      element={<Authed rolesAllowed={[USER_ROLES.admin]}><AdminManageLC/></Authed>}
    />
    <Route path="/admin_manage_dar_collections"
      element={<Authed rolesAllowed={[USER_ROLES.admin]}><AdminManageDarCollections/></Authed>}
    />

    {/* TODO: Fix */}
    {/*<AuthenticatedRoute path="/datalibrary/:query" element={DatasetSearch} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.all]} />*/}
    <Route path="/datalibrary/:query"
      element={<Authed rolesAllowed={[USER_ROLES.all]}><DatasetSearch/></Authed>}
    />

    <Route path="/datalibrary"
      element={<Authed rolesAllowed={[USER_ROLES.all]}><DatasetSearch/></Authed>}
    />

    {/* TODO: Fix */}
    {/*<AuthenticatedRoute path="/dataset/:datasetIdentifier" element={DatasetStatistics} props={props} rolesAllowed={[USER_ROLES.all]} />*/}
    <Route path="/dataset/:datasetIdentifier"
      element={<Authed rolesAllowed={[USER_ROLES.all]}><DatasetStatistics/></Authed>}
    />

    {/* TODO: Fix */}
    {/*<Route path="/DUOS-:duosId" element={() => <Navigate to="/dataset/DUOS-:duosId" props={props} rolesAllowed={[USER_ROLES.all]}/>}/>*/}
    <Route path="/DUOS-:duosId"
      element={<Authed rolesAllowed={[USER_ROLES.all]}><Navigate to="/dataset/DUOS-:duosId"/></Authed>}
    />

    <Route path="/dac_datasets"
      element={<Authed rolesAllowed={[USER_ROLES.chairperson]}><DACDatasets/></Authed>}
    />

    {/* TODO: Fix */}
    {/*<AuthenticatedRoute path="/tos_acceptance" element={TermsOfServiceAcceptance} props={props} rolesAllowed={[USER_ROLES.all]} />*/}
    <Route path="/tos_acceptance"
      element={<Authed rolesAllowed={[USER_ROLES.all]}><TermsOfServiceAcceptance/></Authed>}
    />

    {/*{checkEnv(envGroups.NON_PROD) && <AuthenticatedRoute path="/translate" element={Translator} props={props} rolesAllowed={[USER_ROLES.researcher]}/>}*/}
    {checkEnv(envGroups.NON_PROD) && <Route path="/translate"
      element={<Authed rolesAllowed={[USER_ROLES.all]}><Translator/></Authed>}
    />}
    <Route path="*" element={NotFound}/>
  </Routes>
);

// See https://gist.github.com/mjackson/d54b40a094277b7afdd6b81f51a0393f for more information on the preferred
// v5->v6 authenticated route approach.
function Authed({children, rolesAllowed}) {
  const userAuthed = Storage.userIsLogged();
  const userRoles = Storage.getCurrentUserRoles()?.map(roles => roles.name);
  const roleAuthed = rolesAllowed?.some(r => (userRoles?.indexOf(r) >= 0 || r === Utils.USER_ROLES.all));
  return (userAuthed && roleAuthed) ? children : <Navigate to={'/'}/>;
}

export default DuosRoutes;
