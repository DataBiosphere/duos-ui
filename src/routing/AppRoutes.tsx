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
        <Route path="/profile" element={<UserProfile{...props} />} />
        <Route path="/request_role" element={<RequestForm {...props} />} />
        <Route path="/datalibrary" element={<DatasetSearch {...props} />}>
          <Route path=":query" element={<DatasetSearch {...props} />} />
        </Route>
        <Route path="/studies/:studyId" element={<StudyDetails />} />
        <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
