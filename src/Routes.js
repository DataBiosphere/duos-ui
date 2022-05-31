import { mergeAll } from 'lodash/fp';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import { USER_ROLES } from './libs/utils';
import AdminConsole from './pages/AdminConsole';
import AdminManageAccess from './pages/AdminManageAccess';
import ManageDac from './pages/manage_dac/ManageDac';
import AdminManageDul from './pages/AdminManageDul';
import AdminManageUsers from './pages/AdminManageUsers';
import DataAccessRequestApplication from './pages/DataAccessRequestApplication';
import DatasetCatalog from './pages/DatasetCatalog';
import DatasetRegistration from './pages/DatasetRegistration';
import DulCollect from './pages/DulCollect';
import DulPreview from './pages/DulPreview';
import DulResultRecords from './pages/DulResultRecords';
import DulReview from './pages/DulReview';
import Election404 from './pages/Election404';
import Home from './pages/Home';
import HomeAbout from './pages/HomeAbout';
import HomeSigningOfficial from './pages/HomeSigningOfficial';
import HomeDacInfo from './pages/HomeDacInfo';
import AccessReview from './pages/access_review/AccessReview';
import MemberConsole from './pages/MemberConsole';
import ChairConsole from './pages/ChairConsole';
import NotFound from './pages/NotFound';
import NIHICWebform from './pages/NIHicWebform';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ResearcherConsole from './pages/ResearcherConsole';
import NewResearcherConsole from './pages/NewResearcherConsole';
import ResearcherProfile from './pages/ResearcherProfile';
import ResearcherReview from './pages/ResearcherReview';
import SigningOfficialConsole from './pages/SigningOfficialConsole';
import ReviewedCases from './pages/ReviewedCases';
import ReviewResults from './pages/ReviewResults';
import NIHPilotInfo from './pages/NIHPilotInfo';
import { Status } from './pages/Status';
import { SummaryVotes } from './pages/SummaryVotes';
import HomeResearcherInfo from './pages/HomeResearcherInfo';
import BackgroundSignIn from './pages/BackgroundSignIn';
import DataSharingLanguageTool from './pages/DataSharingLanguageTool';
import AdminManageInstitutions from './pages/AdminManageInstitutions';
import AdminManageLC from './pages/AdminManageLC';
import DatasetStatistics from './pages/DatasetStatistics';
import DarCollectionReview from './pages/dar_collection_review/DarCollectionReview';
import AdminManageDarCollections from './pages/AdminManageDarCollections';
import {AdminEditUser} from './pages/AdminEditUser';
import NewChairConsole from './pages/NewChairConsole';
import NewMemberConsole from './pages/NewMemberConsole';
import TermsOfService from './pages/TermsOfService';
import TermsOfServiceAcceptance from './pages/TermsOfServiceAcceptance';

const Routes = (props) => (
  <Switch>
    <Route exact path="/" render={(routeProps) => <Home {...routeProps} {...props} />} />
    <Route exact path="/home" render={(routeProps) => <Home {...routeProps} {...props} />} />
    <Route exact path="/status" render={(routeProps) => Status(mergeAll([routeProps, props]))} />
    <Route exact path="/backgroundsignin" render={
      (routeProps) =>
        props.env
          ? (props.env !== 'prod' && props.env !== 'staging')
            ? <BackgroundSignIn {...routeProps} />
            : <NotFound />
          : <div />
    } />
    <Route path="/home_about" component={HomeAbout} />
    <Route path="/home_signing_official" component={HomeSigningOfficial} />
    <Route path="/home_dac_info" component={HomeDacInfo} />
    <Route path="/home_researcher_info" component={HomeResearcherInfo} />
    <Route path="/election404" component={Election404} />
    <Route path="/nih_ic_webform" component={NIHICWebform} />
    <Route path="/nih_pilot_info" component={NIHPilotInfo} />
    <Route path="/privacy" component={PrivacyPolicy} />
    <Route path="/tos" component={TermsOfService} />
    <Route path="/tos_acceptance" component={TermsOfServiceAcceptance} props={props} />
    <Route path="/data_sharing_language_tool" component={DataSharingLanguageTool} />
    <AuthenticatedRoute path="/admin_console" component={AdminConsole} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_users" component={AdminManageUsers} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_edit_user/:dacUserId" component={AdminEditUser} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/manage_dac" component={ManageDac} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/admin_manage_institutions" component={AdminManageInstitutions} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/summary_votes" component={SummaryVotes} props={props} rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/researcher_console" component={ResearcherConsole} props={props} rolesAllowed={[USER_ROLES.researcher]} />
    {
      props.env === 'dev' ? <AuthenticatedRoute path="/new_researcher_console" component={NewResearcherConsole} props={props} rolesAllowed={[USER_ROLES.researcher]}/>
        : ''
    }
    {
      props.env === 'dev' ? <AuthenticatedRoute path="/dar_collection/:collectionId" component={DarCollectionReview} props={props} rolesAllowed={[USER_ROLES.researcher, USER_ROLES.chairperson, USER_ROLES.member]}/>
        : ''
    }
    {
      props.env === 'dev' ? <AuthenticatedRoute path="/new_chair_console" component={NewChairConsole} props={props} rolesAllowed={[USER_ROLES.chairperson]}/>
        : ''
    }
    {
      props.env === 'dev' ? <AuthenticatedRoute path="/new_member_console" component={NewMemberConsole} props={props} rolesAllowed={[USER_ROLES.member]}/>
        : ''
    }
    <AuthenticatedRoute path="/dar_vote_review/:collectionId" component={DarCollectionReview} props={Object.assign({}, props, {readOnly: true})}
      rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.member]}/>
    <AuthenticatedRoute path="/chair_console" component={ChairConsole} props={props} rolesAllowed={[USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/member_console" component={MemberConsole} props={props} rolesAllowed={[USER_ROLES.member]} />
    <AuthenticatedRoute path="/dar_application/:dataRequestId" component={DataAccessRequestApplication} props={props}
      rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/dar_application" component={DataAccessRequestApplication} props={props}
      rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/profile" component={ResearcherProfile} props={props} rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/admin_manage_access" component={AdminManageAccess} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/signing_official_console" component={SigningOfficialConsole} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.signingOfficial]} />
    <AuthenticatedRoute path="/dataset_registration/:datasetId" component={DatasetRegistration} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dataset_registration" component={DatasetRegistration} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/admin_manage_dul" component={AdminManageDul} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_lc/" component={AdminManageLC} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_dar_collections/" component={AdminManageDarCollections} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/dataset_catalog" component={DatasetCatalog} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.all]} />
    <AuthenticatedRoute path="/researcher_review/:dacUserId" component={ResearcherReview} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/dul_results_record/:electionId" component={DulResultRecords} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.member, USER_ROLES.alumni]} />
    <AuthenticatedRoute path="/access_review/:darId" component={AccessReview} props={props}
      rolesAllowed={[USER_ROLES.member, USER_ROLES.chairperson]}/>
    <AuthenticatedRoute path="/dul_review/:voteId/:consentId" component={DulReview} props={props}
      rolesAllowed={[USER_ROLES.member, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dul_preview/:consentId" component={DulPreview} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dul_collect/:consentId" component={DulCollect} props={props}
      rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.admin]} />
    <AuthenticatedRoute path="/reviewed_cases" component={ReviewedCases} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.alumni]} />
    <AuthenticatedRoute path="/review_results/:referenceId/:status?" component={ReviewResults} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.alumni, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dataset_statistics/:datasetId" component={DatasetStatistics} props={props}
      rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/tos_acceptance" component={TermsOfServiceAcceptance} props={props} rolesAllowed={[USER_ROLES.all]} />
    <Route path="*" component={NotFound} />
  </Switch>
);

export default Routes;
