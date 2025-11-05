import React from 'react'
import { Route, Routes } from 'react-router'
import Home from 'src/pages/Home'
import UserProfile from 'src/pages/user_profile/UserProfile'
import Authenticated from 'src/routing/Authenticated'
import { envGroups } from 'src/utils/EnvironmentUtils'
import HealthCheck from 'src/pages/HealthCheck'
import Status from 'src/pages/Status'
import BackgroundSignIn from 'src/pages/BackgroundSignIn'
import NIHICWebform from 'src/pages/NIHicWebform'
import NIHPilotInfo from 'src/pages/NIHPilotInfo'
import PrivacyPolicy from 'src/pages/PrivacyPolicy'
import TermsOfService from 'src/pages/TermsOfService'
import TermsOfServiceAcceptance from 'src/pages/TermsOfServiceAcceptance'
import ConsentTextGenerator from 'src/pages/ConsentTextGenerator'
import { AnVILDMSPolicyInfo, NIHDMSPolicyInfo } from 'src/pages/DMSPolicyInfo'
import RequestForm from 'src/pages/user_profile/RequestForm'
import DatasetSearch from 'src/pages/DatasetSearch'
import { StudyDetails } from 'src/components/study_details/StudyDetails'
import DatasetStatistics from 'src/pages/DatasetStatistics'
import RoleBAC from 'src/routing/RoleBAC'
import { USER_ROLES } from 'src/libs/utils'
import ResearcherConsole from 'src/pages/researcher_console/ResearcherConsole'
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
import AdminManageDarCollections from 'src/pages/AdminManageDarCollections'
import ManageDac from 'src/pages/manage_dac/ManageDac'
import { ManageDacDatasets } from 'src/pages/manage_dac/ManageDacDatasets'
import ManageEditDac from 'src/pages/manage_dac/ManageEditDac'
import ManageRadar from 'src/pages/manage_dac/ManageRadar'
import { DAAUtils } from 'src/utils/DAAUtils'
import EditDac from 'src/pages/manage_dac/EditDac'
import DatasetSubmissions from 'src/pages/researcher_console/DatasetSubmissions'
import DatasetUpdateForm from 'src/pages/DatasetUpdateForm'
import DataSubmissionForm from 'src/pages/data_submission/DataSubmissionForm'
import StudyUpdateForm from 'src/pages/StudyUpdateForm'
import ChairConsole from 'src/pages/ChairConsole'
import DACDatasets from 'src/pages/DACDatasets'
import MemberConsole from 'src/pages/MemberConsole'
import SOAcknowledged from 'src/routing/SOAcknowledged'
import SigningOfficialLibraryCards from 'src/pages/signing_official_console/SigningOfficialLibraryCards'
import SigningOfficialDarRequests from 'src/pages/signing_official_console/SigningOfficialDarRequests'
import ManageResearcherDAAs from 'src/pages/signing_official_console/ManageResearcherDAAs'
import SigningOfficialDataSubmitters from 'src/pages/signing_official_console/SigningOfficialDataSubmitters'
import Translator from 'src/pages/Translator'
import { DataSubmissionFormV2 } from 'src/pages/data_submission/v2/DataSubmissionFormV2'

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
      <Route path="/nih_ic_webform" element={<NIHICWebform />} />
      <Route path="/nih_pilot_info" element={<NIHPilotInfo />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/tos" element={<TermsOfService />} />
      <Route path="/tos_acceptance" element={<TermsOfServiceAcceptance />} />
      <Route path="/consent_text_generator" element={<ConsentTextGenerator />} />
      <Route path="/nih_dms_policy" element={<NIHDMSPolicyInfo />} />
      <Route path="/anvil_dms_policy" element={<AnVILDMSPolicyInfo />} />
      <Route element={<EnvRoute env={envGroups.NON_STAGING} />}>
        <Route path="/backgroundsignin" element={<BackgroundSignIn {...props} />} />
      </Route>
      <Route element={<Authenticated />}>
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/request_role" element={<RequestForm />} />
        <Route path="/datalibrary" element={<DatasetSearch {...props} />}>
          <Route path=":query" element={<DatasetSearch {...props} />} />
        </Route>
        <Route path="/studies/:studyId" element={<StudyDetails />} />
        <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.researcher]} />}>
          <Route path="/researcher_console" element={<ResearcherConsole />} />
          <Route path="/datasets" element={<ControlledAccessGrants />} />
          <Route path="/dar_collection/:collectionId" element={<DarCollectionReview adminPage={false} readOnly={false} />} />
          <Route path="/dar_application_review/:collectionId" element={<DataAccessRequestApplication existingDarsReadOnlyMode={true} draftDar={false} isProgressReportApplication={false} />} />
          <Route path="/progress_report_application/:collectionId" element={<DataAccessRequestApplication existingDarsReadOnlyMode={true} draftDar={false} isProgressReportApplication={true} />} />
          <Route path="/dar_application/:dataRequestId" element={<DataAccessRequestApplication draftDar={true} isProgressReportApplication={false} />} />
          <Route element={<EnvRoute env={envGroups.NON_PROD} />}>
            <Route path="/translate" element={<Translator />} />
          </Route>
          {/*  NOTE: Previous support for this path is no longer allowed as users cannot select datasets from this form */}
          <Route path="/dar_application" element={<NotFound />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.dataSubmitter]} />}>
          <Route path="/dataset_submissions" element={<DatasetSubmissions />} />
          <Route path="/data_submission_form" element={<DataSubmissionForm />} />
          <Route path="/data_submission_form2/" element={<DataSubmissionFormV2 />}>
            <Route path=":studyId" element={<DataSubmissionFormV2 />} />
          </Route>
          <Route path="/study_update/:studyId" element={<StudyUpdateForm />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.member, USER_ROLES.signingOfficial, USER_ROLES.chairperson]} />}>
          <Route path="/dar_vote_review/:collectionId" element={<DarCollectionReview readOnly={true} />} />
          <Route path="/dar_collection/:collectionId" element={<DarCollectionReview />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.member]} />}>
          <Route path="/member_console" element={<MemberConsole />} />
        </Route>
        <Route element={<RoleBAC rolesAllowed={[USER_ROLES.signingOfficial]} />}>
          <Route element={<SOAcknowledged />}>
            <Route path="/signing_official_console/library_cards" element={<SigningOfficialLibraryCards />} />
            <Route path="/signing_official_console/dar_requests" element={<SigningOfficialDarRequests />} />
            <Route path="/signing_official_console/data_submitters" element={<SigningOfficialDataSubmitters />} />
            {DAAUtils.isEnabled()
              && <Route path="/signing_official_console/researchers_daa_associations" element={<ManageResearcherDAAs />} />}
          </Route>
        </Route>
      </Route>
      <Route element={<RoleBAC rolesAllowed={[USER_ROLES.chairperson]} />}>
        <Route path="/chair_console" element={<ChairConsole />} />
        <Route path="/dac_datasets" element={<DACDatasets />} />
        <Route path="/dataset_submissions" element={<DatasetSubmissions />} />
        <Route path="/dataset_update/:datasetId" element={<DatasetUpdateForm />} />
        <Route path="/data_submission_form" element={<DataSubmissionForm />} />
        <Route path="/data_submission_form2/" element={<DataSubmissionFormV2 />}>
          <Route path=":studyId" element={<DataSubmissionFormV2 />} />
        </Route>
        <Route path="/study_update/:studyId" element={<StudyUpdateForm />} />
        {/* NOTE: Previous support for Chairperson adding DACs should not have been allowed */}
        <Route path="/manage_dac" element={<ManageDac />} />
        <Route path="/manage_dac_datasets" element={<ManageDacDatasets />} />
        <Route path="/manage_edit_dac/:dacId" element={<ManageEditDac />} />
        <Route path="/manage_radar/:dacId" element={<ManageRadar />} />
        {DAAUtils.isEnabled() && <Route path="/manage_edit_dac_daa/:dacId" element={<EditDac />} />}
      </Route>
      <Route element={<RoleBAC rolesAllowed={[USER_ROLES.admin]} />}>
        <Route path="/admin_review_collection/:collectionId" element={<DarCollectionReview adminPage={true} />} />
        <Route path="/admin_manage_users" element={<AdminManageUsers />} />
        <Route path="/admin_edit_user/:userId" element={<AdminEditUser />} />
        <Route path="/admin_manage_institutions/create_new" element={<InstitutionDetails formMode={FORM_MODES.createNew} />} />
        <Route path="/admin_manage_institutions/institutions/:institutionId" element={<InstitutionDetails formMode={FORM_MODES.editExisting} />} />
        <Route path="/admin_manage_institutions" element={<AdminManageInstitutions />} />
        <Route path="/admin_manage_lc/" element={<AdminManageLC />} />
        <Route path="/admin_manage_dar_collections/" element={<AdminManageDarCollections />} />
        <Route path="/manage_dac" element={<ManageDac />} />
        <Route path="/manage_dac_datasets" element={<ManageDacDatasets />} />
        <Route path="/manage_edit_dac" element={<ManageEditDac />}>
          <Route path=":dacId" element={<ManageEditDac />} />
        </Route>
        <Route path="/manage_radar/:dacId" element={<ManageRadar />} />
        <Route path="/manage_add_dac" element={<ManageEditDac />} />
        <Route path="/dataset_submissions" element={<DatasetSubmissions />} />
        <Route path="/dataset_update/:datasetId" element={<DatasetUpdateForm />} />
        <Route path="/data_submission_form" element={<DataSubmissionForm />} />
        <Route path="/data_submission_form2/" element={<DataSubmissionFormV2 />}>
          <Route path=":studyId" element={<DataSubmissionFormV2 />} />
        </Route>
        <Route path="/study_update/:studyId" element={<StudyUpdateForm />} />
        <Route path="/signing_official_console/library_cards" element={<SigningOfficialLibraryCards />} />
        <Route path="/signing_official_console/dar_requests" element={<SigningOfficialDarRequests />} />
        {DAAUtils.isEnabled()
          && (
            <>
              <Route path="/manage_edit_dac_daa" element={<EditDac />}>
                <Route path=":dacId" element={<EditDac />} />
              </Route>
              <Route path="/manage_add_dac_daa" element={<EditDac />} />
              <Route path="/signing_official_console/researchers_daa_associations" element={<ManageResearcherDAAs />} />
              <Route path="/signing_official_console/data_submitters" element={<SigningOfficialDataSubmitters />} />
            </>
          )}
      </Route>
      {/* NOTE: Previous support dataset study permalink routes is now handled in NotFound */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
