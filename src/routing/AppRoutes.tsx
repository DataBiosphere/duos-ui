import React from 'react'
import { Navigate, Route, Routes } from 'react-router'
import Home from 'src/pages/Home'
import UserProfile from 'src/pages/user_profile/UserProfile'
import Authenticated from 'src/routing/Authenticated'
import { envGroups } from 'src/utils/EnvironmentUtils'
import HealthCheck from 'src/pages/HealthCheck'
import Status from 'src/pages/Status'
import BackgroundSignIn from 'src/pages/BackgroundSignIn'
import NIHPilotInfo from 'src/pages/NIHPilotInfo'
import PrivacyPolicy from 'src/pages/PrivacyPolicy'
import CookiePolicy from 'src/pages/CookiePolicy'
import PostLogout from 'src/pages/PostLogout'
import TermsOfService from 'src/pages/TermsOfService'
import TermsOfServiceAcceptance from 'src/pages/TermsOfServiceAcceptance'
import { AnVILDMSPolicyInfo, NIHDMSPolicyInfo } from 'src/pages/DMSPolicyInfo'
import { StudyDetails } from 'src/components/study_details/StudyDetails'
import DatasetStatistics from 'src/pages/DatasetStatistics'
import RoleBAC from 'src/routing/RoleBAC'
import { USER_ROLES } from 'src/libs/utils'
import ResearcherConsole from 'src/pages/researcher_console/ResearcherConsole'
import ResearcherDashboard from 'src/pages/researcher_console/ResearcherDashboard'
import ControlledAccessGrants from 'src/pages/user_profile/ControlledAccessGrants'
import DarCollectionReview from 'src/pages/dar_collection_review/DarCollectionReview'
import DataAccessRequestApplication from 'src/pages/dar_application/DataAccessRequestApplication'
import NotFound from 'src/pages/NotFound'
import EnvRoute from 'src/routing/EnvRoute'
import { AdminEditUser } from 'src/pages/AdminEditUser'
import AdminManageUsers from 'src/pages/AdminManageUsers'
import { InstitutionDetails } from 'src/components/institution_table/InstitutionDetails'
import { FORM_MODES } from 'src/components/institution_table/InstitutionFormMode'
import AdminManageInstitutions from 'src/pages/AdminManageInstitutions'
import AdminManageLC from 'src/pages/AdminManageLC'
import AdminDaaAssociations from 'src/pages/AdminDaaAssociations'
import AdminManageDarCollections from 'src/pages/AdminManageDarCollections'
import ManageDac from 'src/pages/manage_dac/ManageDac'
import ManageRadar from 'src/pages/manage_dac/ManageRadar'
import EditDac from 'src/pages/manage_dac/EditDac'
import DacProfile from 'src/pages/manage_dac/DacProfile'
import DatasetSubmissions from 'src/pages/researcher_console/DatasetSubmissions'
import DatasetUpdateForm from 'src/pages/DatasetUpdateForm'
import DACConsole from 'src/pages/DACConsole'
import DACDashboard from 'src/pages/DACDashboard'
import DACDatasets from 'src/pages/DACDatasets'
import SOAcknowledged from 'src/routing/SOAcknowledged'
import SigningOfficialDashboard from 'src/pages/signing_official_console/SigningOfficialDashboard'
import SigningOfficialLibraryCards from 'src/pages/signing_official_console/SigningOfficialLibraryCards'
import SigningOfficialDarRequests from 'src/pages/signing_official_console/SigningOfficialDarRequests'
import ManageResearcherDAAs from 'src/pages/signing_official_console/ManageResearcherDAAs'
import { DataSubmissionFormV2 } from 'src/pages/data_submission/v2/DataSubmissionFormV2'
import { StudyTemplateUpload } from 'src/pages/data_submission/StudyTemplateUpload'
import SigningOfficialDarApprovals from 'src/pages/signing_official_console/SigningOfficialDarApprovals'
import { DataLibrary } from 'src/pages/DataLibrary'
import { StudyNameSearch } from 'src/routing/StudyNameSearch'

interface AppRoutesProps {
  isLogged: boolean
  env: string
}

const AppRoutes = (props: AppRoutesProps) => {
  return (
    <Routes>
      <Route path="/" element={<Home {...props} />} />
      <Route path="/home" element={<Home {...props} />} />
      <Route path="/status" element={<Status />} />
      <Route path="/liveness" element={<HealthCheck />} />
      <Route path="/nih_pilot_info" element={<NIHPilotInfo />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/cookie_policy" element={<CookiePolicy />} />
      {/* The fixed B2C post_logout_redirect_uri — public by definition: the
          user arrives here signed out (story 5-E). */}
      <Route path="/post-logout" element={<PostLogout />} />
      <Route path="/tos" element={<TermsOfService />} />
      <Route path="/tos_acceptance" element={<TermsOfServiceAcceptance />} />
      <Route path="/nih_dms_policy" element={<NIHDMSPolicyInfo />} />
      <Route path="/anvil_dms_policy" element={<AnVILDMSPolicyInfo />} />
      <Route element={<EnvRoute env={envGroups.DEV} />}>
        <Route path="/backgroundsignin" element={<BackgroundSignIn {...props} />} />
      </Route>
      <Route element={<Authenticated />}>
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/datalibrary" element={<DataLibrary />}>
          <Route path=":query" element={<DataLibrary />} />
        </Route>
        <Route path="/studies/name/*" element={<StudyNameSearch />} />
        <Route path="/studies/:studyId" element={<StudyDetails />} />
        <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.researcher]} />}>
          <Route path="/researcher_console_dashboard" element={<ResearcherDashboard />} />
          <Route path="/researcher_console" element={<ResearcherConsole />} />
          <Route path="/datasets" element={<ControlledAccessGrants />} />
          <Route path="/dar_collection/:collectionId" element={<DarCollectionReview adminPage={false} readOnly={false} />} />
          <Route path="/dar_application_review/:collectionId" element={<DataAccessRequestApplication existingDarsReadOnlyMode={true} draftDar={false} isProgressReportApplication={false} />} />
          <Route path="/progress_report_application/:collectionId" element={<DataAccessRequestApplication existingDarsReadOnlyMode={true} draftDar={false} isProgressReportApplication={true} />} />
          <Route path="/dar_application/:dataRequestId" element={<DataAccessRequestApplication draftDar={true} isProgressReportApplication={false} />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.dataSubmitter, USER_ROLES.chairperson, USER_ROLES.admin]} />}>
          <Route path="/dataset_submissions" element={<DatasetSubmissions />} />
          <Route path="/data_submission_template" element={<StudyTemplateUpload />} />
          <Route path="/data_submission_form" element={<DataSubmissionFormV2 />}>
            <Route path=":studyId" element={<DataSubmissionFormV2 />} />
          </Route>
          <Route path="/data_submission_form/draft/study-dataset/:draftUuid" element={<DataSubmissionFormV2 />} />
          <Route path="/study_update/:studyId" element={<DataSubmissionFormV2 onSaveRoute="/dataset_submissions" />} />
          <Route path="/dataset_update/:datasetId" element={<DatasetUpdateForm />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.member, USER_ROLES.signingOfficial, USER_ROLES.chairperson]} />}>
          <Route path="/dar_vote_review/:collectionId" element={<DarCollectionReview readOnly={true} />} />
          <Route path="/dar_collection/:collectionId" element={<DarCollectionReview />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.member]} />}>
          <Route path="/dac_console" element={<DACDashboard />} />
          <Route path="/dac_console_dar_requests" element={<DACConsole />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.chairperson]} />}>
          <Route path="/chair_console" element={<Navigate to="/dac_console_dar_requests" replace />} />
          <Route path="/dac_console/manage_dac" element={<ManageDac />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.member]} />}>
          <Route path="/member_console" element={<Navigate to="/dac_console_dar_requests" replace />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.signingOfficial]} />}>
          <Route element={<SOAcknowledged />}>
            <Route path="/signing_official_console" element={<Navigate to="/signing_official_console/dashboard" replace />} />
            <Route path="/signing_official_console/dashboard" element={<SigningOfficialDashboard />} />
            <Route path="/signing_official_console/library_cards" element={<SigningOfficialLibraryCards />} />
            <Route path="/signing_official_console/dar_requests" element={<SigningOfficialDarRequests />} />
            <Route path="/signing_official_console/dar_approvals" element={<SigningOfficialDarApprovals />} />
            <Route path="/signing_official_console/researchers_daa_associations" element={<ManageResearcherDAAs />} />
          </Route>
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.chairperson]} />}>
          <Route path="/dac_datasets" element={<DACDatasets />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.admin]} />}>
          <Route path="/manage_dac" element={<ManageDac />} />
          <Route path="/manage_dac/:dacId" element={<DacProfile />} />
          <Route path="/manage_radar/:dacId" element={<ManageRadar />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.admin]} />}>
          <Route path="/admin_review_collection/:collectionId" element={<DarCollectionReview adminPage={true} />} />
          <Route path="/admin_manage_users" element={<AdminManageUsers />} />
          <Route path="/admin_edit_user/:userId" element={<AdminEditUser />} />
          <Route path="/admin_manage_institutions/create_new" element={<InstitutionDetails formMode={FORM_MODES.createNew} />} />
          <Route path="/admin_manage_institutions/institutions/:institutionId" element={<InstitutionDetails formMode={FORM_MODES.editExisting} />} />
          <Route path="/admin_manage_institutions" element={<AdminManageInstitutions />} />
          <Route path="/admin_manage_lc/" element={<AdminManageLC />} />
          <Route path="/admin_daa_associations" element={<AdminDaaAssociations />} />
          <Route path="/admin_manage_dar_collections/" element={<AdminManageDarCollections />} />
          <Route path="/manage_add_dac_daa" element={<EditDac />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
