import React from 'react'
import { Navigate, Route, Routes as Switch } from 'react-router-dom'
import { StudyDetails } from 'src/components/study_details/StudyDetails'
import AuthenticatedRoute from 'src/components/AuthenticatedRoute'
import { USER_ROLES } from 'src/libs/utils'
import ManageDac from 'src/pages/manage_dac/ManageDac'
import { ManageDacDatasets } from 'src/pages/manage_dac/ManageDacDatasets'
import ManageEditDac from 'src/pages/manage_dac/ManageEditDac'
import ManageRadar from 'src/pages/manage_dac/ManageRadar'
import AdminManageUsers from 'src/pages/AdminManageUsers'
import DataAccessRequestApplication from 'src/pages/dar_application/DataAccessRequestApplication'
import DACDatasets from 'src/pages/DACDatasets'
import Home from 'src/pages/Home'
import NotFound from 'src/pages/NotFound'
import NIHICWebform from 'src/pages/NIHicWebform'
import PrivacyPolicy from 'src/pages/PrivacyPolicy'
import ResearcherConsole from 'src/pages/researcher_console/ResearcherConsole'
import UserProfile from 'src/pages/user_profile/UserProfile'
import RequestForm from 'src/pages/user_profile/RequestForm'
import SigningOfficialLibraryCards from 'src/pages/signing_official_console/SigningOfficialLibraryCards'
import ManageResearcherDAAs from 'src/pages/signing_official_console/ManageResearcherDAAs'
import SigningOfficialDarRequests from 'src/pages/signing_official_console/SigningOfficialDarRequests'
import SigningOfficialDataSubmitters from 'src/pages/signing_official_console/SigningOfficialDataSubmitters'
import Translator from 'src/pages/Translator'
import NIHPilotInfo from 'src/pages/NIHPilotInfo'
import Status from 'src/pages/Status'
import BackgroundSignIn from 'src/pages/BackgroundSignIn'
import ConsentTextGenerator from 'src/pages/ConsentTextGenerator'
import AdminManageInstitutions from 'src/pages/AdminManageInstitutions'
import AdminManageLC from 'src/pages/AdminManageLC'
import DatasetStatistics from 'src/pages/DatasetStatistics'
import DarCollectionReview from 'src/pages/dar_collection_review/DarCollectionReview'
import AdminManageDarCollections from 'src/pages/AdminManageDarCollections'
import { AdminEditUser } from 'src/pages/AdminEditUser'
import ChairConsole from 'src/pages/ChairConsole'
import MemberConsole from 'src/pages/MemberConsole'
import DatasetSubmissions from 'src/pages/researcher_console/DatasetSubmissions'
import TermsOfService from 'src/pages/TermsOfService'
import TermsOfServiceAcceptance from 'src/pages/TermsOfServiceAcceptance'
import { HealthCheck } from 'src/pages/HealthCheck'
import DataSubmissionForm from 'src/pages/data_submission/DataSubmissionForm'
import { ensureSoHasDaaAcknowledgement } from 'src/components/SigningOfficialDaaAgreementWrapper'
import { AnVILDMSPolicyInfo, NIHDMSPolicyInfo } from 'src/pages/DMSPolicyInfo'
import { checkEnv, envGroups } from 'src/utils/EnvironmentUtils'
import { DatasetUpdateForm } from 'src/pages/DatasetUpdateForm'
import DatasetSearch from 'src/pages/DatasetSearch'
import { StudyUpdateForm } from 'src/pages/StudyUpdateForm'
import { DAAUtils } from 'src/utils/DAAUtils'
import EditDac from 'src/pages/manage_dac/EditDac'
import ControlledAccessGrants from 'src/pages/user_profile/ControlledAccessGrants'
import { InstitutionDetails } from 'src/components/institution_table/InstitutionDetails.js'
import { FORM_MODES } from 'src/components/institution_table/InstitutionFormMode.js'

const Routes = props => (
  <Switch>
    <Route exact path="/" render={routeProps => <Home {...routeProps} {...props} />} />
    <Route exact path="/home" render={routeProps => <Home {...routeProps} {...props} />} />
    <Route exact path="/status" render={routeProps => <Status {...routeProps} {...props} />} />
    <Route exact path="/liveness" component={HealthCheck} />
    <Route
      exact
      path="/backgroundsignin"
      render={
        routeProps =>
          checkEnv(envGroups.NON_STAGING)
            ? <BackgroundSignIn {...routeProps} />
            : <NotFound />
      }
    />
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
    <AuthenticatedRoute path="/admin_review_collection/:collectionId" component={DarCollectionReview} props={Object.assign({ adminPage: true }, props)} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_users" component={AdminManageUsers} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_edit_user/:userId" component={AdminEditUser} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/manage_dac" component={ManageDac} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/manage_dac_datasets" component={ManageDacDatasets} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/manage_edit_dac/:dacId" component={ManageEditDac} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/manage_radar/:dacId" component={ManageRadar} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/manage_add_dac" component={ManageEditDac} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    {DAAUtils.isEnabled() && <AuthenticatedRoute path="/manage_edit_dac_daa/:dacId" component={EditDac} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />}
    {DAAUtils.isEnabled() && <AuthenticatedRoute path="/manage_add_dac_daa" component={EditDac} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />}
    <AuthenticatedRoute path="/admin_manage_institutions/create_new" component={InstitutionDetails} props={{ ...props, formMode: FORM_MODES.createNew }} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_institutions/institutions/:institutionId" component={InstitutionDetails} props={{ ...props, formMode: FORM_MODES.editExisting }} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_institutions" component={AdminManageInstitutions} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/researcher_console" component={ResearcherConsole} props={props} rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/datasets" component={ControlledAccessGrants} props={props} rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/dar_collection/:collectionId" component={DarCollectionReview} props={props} rolesAllowed={[USER_ROLES.researcher, USER_ROLES.chairperson, USER_ROLES.member, USER_ROLES.signingOfficial]} />
    <AuthenticatedRoute path="/chair_console" component={ChairConsole} props={props} rolesAllowed={[USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/member_console" component={MemberConsole} props={props} rolesAllowed={[USER_ROLES.member]} />
    <AuthenticatedRoute
      path="/dar_vote_review/:collectionId"
      component={DarCollectionReview}
      props={Object.assign({ readOnly: true }, props)}
      rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.member, USER_ROLES.signingOfficial]}
    />
    <AuthenticatedRoute
      path="/dar_application_review/:collectionId"
      component={DataAccessRequestApplication}
      props={Object.assign({}, props, { existingDarsReadOnlyMode: true, draftDar: false, isProgressReportApplication: false })}
      rolesAllowed={[USER_ROLES.researcher]}
    />
    <AuthenticatedRoute
      path="/progress_report_application/:collectionId"
      component={DataAccessRequestApplication}
      props={Object.assign({}, props, { existingDarsReadOnlyMode: true, draftDar: false, isProgressReportApplication: true })}
      rolesAllowed={[USER_ROLES.researcher]}
    />
    {/* Order is important for processing links with embedded dataRequestIds */}
    <AuthenticatedRoute
      path="/dar_application/:dataRequestId"
      component={DataAccessRequestApplication}
      props={Object.assign({}, props, { draftDar: true, isProgressReportApplication: false })}
      rolesAllowed={[USER_ROLES.researcher]}
    />
    <AuthenticatedRoute path="/dar_application" component={DataAccessRequestApplication} props={Object.assign({}, props, { draftDar: true, isProgressReportApplication: false })} rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/signing_official_console/library_cards" component={ensureSoHasDaaAcknowledgement(SigningOfficialLibraryCards, true)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />
    {DAAUtils.isEnabled() && <AuthenticatedRoute path="/signing_official_console/researchers_daa_associations" component={ensureSoHasDaaAcknowledgement(ManageResearcherDAAs, true)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />}
    <AuthenticatedRoute path="/signing_official_console/dar_requests" component={ensureSoHasDaaAcknowledgement(SigningOfficialDarRequests)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />
    {DAAUtils.isEnabled() && <AuthenticatedRoute path="/signing_official_console/data_submitters" component={ensureSoHasDaaAcknowledgement(SigningOfficialDataSubmitters, false, true)} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />}
    <AuthenticatedRoute path="/dataset_submissions" component={DatasetSubmissions} props={props} rolesAllowed={[USER_ROLES.dataSubmitter]} />
    <AuthenticatedRoute path="/dataset_update/:datasetId" component={DatasetUpdateForm} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/data_submission_form" component={DataSubmissionForm} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.dataSubmitter]} />
    <AuthenticatedRoute path="/study_update/:studyId" component={StudyUpdateForm} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.dataSubmitter]} />
    <AuthenticatedRoute path="/admin_manage_lc/" component={AdminManageLC} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_dar_collections/" component={AdminManageDarCollections} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/datalibrary/:query" component={DatasetSearch} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.all]} />
    <AuthenticatedRoute path="/datalibrary" component={DatasetSearch} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.all]} />
    <AuthenticatedRoute path="/studies/:studyId" component={StudyDetails} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.all]} />
    <AuthenticatedRoute path="/dataset/:datasetIdentifier" component={DatasetStatistics} props={props} rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/dac_datasets" component={DACDatasets} props={props} rolesAllowed={[USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/tos_acceptance" component={TermsOfServiceAcceptance} props={props} rolesAllowed={[USER_ROLES.all]} />
    {checkEnv(envGroups.NON_PROD) && <AuthenticatedRoute path="/translate" component={Translator} props={props} rolesAllowed={[USER_ROLES.researcher]} />}
    <Route path="/DUOS-S:studyId" render={() => <Navigate to="/studies/:studyId" rolesAllowed={[USER_ROLES.all]} />} />
    <Route path="/DUOS-:duosId" render={() => <Navigate to="/dataset/DUOS-:duosId" rolesAllowed={[USER_ROLES.all]} />} />
    <Route path="*" component={NotFound} />
  </Switch>
)

export default Routes
