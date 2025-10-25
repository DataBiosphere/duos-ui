import React from 'react'
import { Routes, Route } from 'react-router'
import Home from 'src/pages/Home'
import UserProfile from 'src/pages/user_profile/UserProfile'
import Authenticated from 'src/routing/Authenticated'
import { checkEnv, envGroups } from 'src/utils/EnvironmentUtils'
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
      {checkEnv(envGroups.NON_STAGING)
        && <Route path="/backgroundsignin" element={<BackgroundSignIn {...props} />} />}
      <Route path="/nih_ic_webform" element={<NIHICWebform />} />
      <Route path="/nih_pilot_info" element={<NIHPilotInfo />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/tos" element={<TermsOfService {...props} />} />
      <Route path="/tos_acceptance" element={<TermsOfServiceAcceptance {...props} />} />
      <Route path="/consent_text_generator" element={<ConsentTextGenerator />} />
      <Route path="/nih_dms_policy" element={<NIHDMSPolicyInfo />} />
      <Route path="/anvil_dms_policy" element={<AnVILDMSPolicyInfo />} />
      <Route element={<Authenticated />}>
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/request_role" element={<RequestForm {...props} />} />
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
          {/*  NOTE: Previous support for this path is no longer allowed as users cannot select datasets from this form */}
          <Route path="/dar_application" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
