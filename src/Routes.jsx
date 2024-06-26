import React from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import {USER_ROLES} from './libs/utils';
import ManageDac from './pages/manage_dac/ManageDac';
import ManageEditDac from './pages/manage_dac/ManageEditDac';
import AdminManageUsers from './pages/AdminManageUsers';
import DataAccessRequestApplication from './pages/dar_application/DataAccessRequestApplication';
import DatasetCatalog from './pages/DatasetCatalog';
import DACDatasets from './pages/DACDatasets';
import DatasetRegistration from './pages/DatasetRegistration';
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
import CustomDatasetCatalog from './pages/dac_dataset_catalog/CustomDatasetCatalog';
import {AnVILDMSPolicyInfo, NIHDMSPolicyInfo} from './pages/DMSPolicyInfo';
import {checkEnv, envGroups} from './utils/EnvironmentUtils';
import { DatasetUpdateForm } from './pages/DatasetUpdateForm';
import DatasetSearch from './pages/DatasetSearch';
import { StudyUpdateForm } from './pages/StudyUpdateForm';
import ManageEditDacDaa from './pages/manage_dac/ManageEditDacDaa';

const Routes = (props) => (
  <Switch>
    <Route exact path="/" render={(routeProps) => <Home {...routeProps} {...props} />} />
    <Route exact path="/home" render={(routeProps) => <Home {...routeProps} {...props} />} />
    <Route exact path="/status" render={(routeProps) => <Status {...routeProps} {...props} />} />
    <Route exact path="/liveness" component={HealthCheck} />
    <Route exact path="/backgroundsignin" render={
      (routeProps) =>
        checkEnv(envGroups.NON_STAGING)
          ? <BackgroundSignIn {...routeProps} />
          : <NotFound />
    } />
    <Route path="/nih_ic_webform" component={NIHICWebform} />
    <Route path="/nih_pilot_info" component={NIHPilotInfo} />
    <Route path="/privacy" component={PrivacyPolicy} />
    <Route path="/tos" component={TermsOfService} props={props} />
    <Route path="/tos_acceptance" component={TermsOfServiceAcceptance} props={props} />
    <Route path="/consent_text_generator" component={ConsentTextGenerator} />
    <Route path="/nih_dms_policy" component={NIHDMSPolicyInfo} />
    <Route path="/anvil_dms_policy" component={AnVILDMSPolicyInfo} />
    <AuthenticatedRoute path="/profile" component={UserProfile} props={props} rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/request_role" component={RequestForm} rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/admin_review_collection/:collectionId" component={DarCollectionReview} props={Object.assign({adminPage: true}, props)} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_users" component={AdminManageUsers} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_edit_user/:userId" component={AdminEditUser} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/manage_dac" component={ManageDac} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/manage_edit_dac/:dacId" component={ManageEditDac} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    {checkEnv(envGroups.DEV) && <AuthenticatedRoute path="/manage_edit_dac_daa/:dacId" component={ManageEditDacDaa} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />}
    <AuthenticatedRoute path="/admin_manage_institutions" component={AdminManageInstitutions} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/researcher_console" component={ResearcherConsole} props={props} rolesAllowed={[USER_ROLES.researcher]}/>
    <AuthenticatedRoute path="/dar_collection/:collectionId" component={DarCollectionReview} props={props} rolesAllowed={[USER_ROLES.researcher, USER_ROLES.chairperson, USER_ROLES.member, USER_ROLES.signingOfficial]}/>
    <AuthenticatedRoute path="/chair_console" component={ChairConsole} props={props} rolesAllowed={[USER_ROLES.chairperson]}/>
    <AuthenticatedRoute path="/member_console" component={MemberConsole} props={props} rolesAllowed={[USER_ROLES.member]}/>
    <AuthenticatedRoute path="/dar_vote_review/:collectionId" component={DarCollectionReview} props={Object.assign({readOnly: true}, props)}
      rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.member]}/>
    <AuthenticatedRoute path="/dar_application_review/:collectionId" component={DataAccessRequestApplication} props={Object.assign({}, props, {readOnlyMode: true})}
      rolesAllowed={[USER_ROLES.researcher]} />
    {/* Order is important for processing links with embedded dataRequestIds */}
    <AuthenticatedRoute path="/dar_application/:dataRequestId" component={DataAccessRequestApplication} props={props} rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/dar_application" component={DataAccessRequestApplication} props={props} rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/signing_official_console/researchers" component={ensureSoHasDaaAcknowledgement(SigningOfficialResearchers, true)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />
    {checkEnv(envGroups.DEV) && <AuthenticatedRoute path="/signing_official_console/researchers_daa_associations" component={ensureSoHasDaaAcknowledgement(ManageResearcherDAAs, true)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />}
    <AuthenticatedRoute path="/signing_official_console/dar_requests" component={ensureSoHasDaaAcknowledgement(SigningOfficialDarRequests)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />
    {checkEnv(envGroups.NON_STAGING) && <AuthenticatedRoute path="/signing_official_console/data_submitters" component={ensureSoHasDaaAcknowledgement(SigningOfficialDataSubmitters, false, true)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />}
    <AuthenticatedRoute path="/dataset_submissions" component={DatasetSubmissions} props={props} rolesAllowed={[USER_ROLES.dataSubmitter]}/>
    <AuthenticatedRoute path="/dataset_registration/:datasetId" component={DatasetRegistration} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dataset_update/:datasetId" component={DatasetUpdateForm} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dataset_registration" component={DatasetRegistration} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/data_submission_form" component={DataSubmissionForm} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.dataSubmitter]} />
    <AuthenticatedRoute path="/study_update/:studyId" component={StudyUpdateForm} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.dataSubmitter]} />
    <AuthenticatedRoute path="/admin_manage_lc/" component={AdminManageLC} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_dar_collections/" component={AdminManageDarCollections} props={props} rolesAllowed={[USER_ROLES.admin]} />
    {checkEnv(envGroups.NON_STAGING) && <AuthenticatedRoute path="/dataset_catalog/:variant" component={CustomDatasetCatalog} props={props} rolesAllowed={[USER_ROLES.researcher]}/>}
    <AuthenticatedRoute path="/dataset_catalog" component={DatasetCatalog} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.all]} />
    <AuthenticatedRoute path="/datalibrary/:query" component={DatasetSearch} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.all]} />
    <AuthenticatedRoute path="/datalibrary" component={DatasetSearch} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.all]} />
    <AuthenticatedRoute path="/dataset/:datasetIdentifier" component={DatasetStatistics} props={props} rolesAllowed={[USER_ROLES.all]} />
    <Redirect from="/DUOS-:duosId" to="/dataset/DUOS-:duosId" props={props} rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/dac_datasets" component={DACDatasets} props={props} rolesAllowed={[USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/tos_acceptance" component={TermsOfServiceAcceptance} props={props} rolesAllowed={[USER_ROLES.all]} />
    {checkEnv(envGroups.NON_PROD) && <AuthenticatedRoute path="/translate" component={Translator} props={props} rolesAllowed={[USER_ROLES.researcher]}/>}
    <Route path="*" component={NotFound} />
  </Switch>
);

export default Routes;
