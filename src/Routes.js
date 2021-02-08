import _ from 'lodash/fp';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import { USER_ROLES } from './libs/utils';
import AccessCollect from './pages/AccessCollect';
import AccessPreview from './pages/AccessPreview';
import AccessResultRecords from './pages/AccessResultRecords';
import AdminConsole from './pages/AdminConsole';
import AdminManageAccess from './pages/AdminManageAccess';
import AdminManageDac from './pages/manage_dac/AdminManageDac';
import AdminManageDul from './pages/AdminManageDul';
import AdminManageUsers from './pages/AdminManageUsers';
import { ChairConsole } from './pages/ChairConsole';
import DataAccessRequestApplication from './pages/DataAccessRequestApplication';
import DataAccessRequestRenewal from './pages/DataAccessRequestRenewal';
import DataOwnerConsole from './pages/DataOwnerConsole';
import DataOwnerReview from './pages/DataOwnerReview';
import DatasetCatalog from './pages/DatasetCatalog';
import DatasetRegistration from './pages/DatasetRegistration';
import DulCollect from './pages/DulCollect';
import DulPreview from './pages/DulPreview';
import DulResultRecords from './pages/DulResultRecords';
import DulReview from './pages/DulReview';
import Election404 from './pages/Election404';
import FAQs from './pages/FAQs';
import Home from './pages/Home';
import HomeAbout from './pages/HomeAbout';
import HomeSigningOfficial from './pages/HomeSigningOfficial';
import HomeDacInfo from './pages/HomeDacInfo';
import AccessReview from './pages/access_review/AccessReview';
import MemberConsole from './pages/MemberConsole';
import NewChairConsole from './pages/NewChairConsole';
import NotFound from './pages/NotFound';
import NIHICWebform from './pages/NIHicWebform';
import ResearcherConsole from './pages/ResearcherConsole';
import { ResearcherProfile } from './pages/ResearcherProfile';
import ResearcherReview from './pages/ResearcherReview';
import SigningOfficialConsole from './pages/SigningOfficialConsole';
import ReviewedCases from './pages/ReviewedCases';
import NIHPilotInfo from './pages/NIHPilotInfo';
import { Status } from './pages/Status';
import { SummaryVotes } from './pages/SummaryVotes';
import HomeResearcherInfo from "./pages/HomeResearcherInfo";
import BackgroundSignIn from './pages/BackgroundSignIn';


const Routes = (props) => (
  <Switch>
    <Route exact path="/" render={(routeProps) => <Home {...routeProps} {...props} />} />
    <Route exact path="/home" render={(routeProps) => <Home {...routeProps} {...props} />} />
    <Route exact path="/status" render={(routeProps) => Status(_.mergeAll([routeProps, props]))} />
    <Route exact path="/backgroundsignin" render={
      (routeProps) =>
        props.env
          ? props.env !== 'prod'
            ? <BackgroundSignIn {...routeProps} />
            : <NotFound />
          : <div />
    } />
    <Route path="/FAQs" component={FAQs} />
    <Route path="/home_about" component={HomeAbout} />
    <Route path="/home_signing_official" component={HomeSigningOfficial} />
    <Route path="/home_dac_info" component={HomeDacInfo} />
    <Route path="/home_researcher_info" component={HomeResearcherInfo} />
    <Route path="/election404" component={Election404} />
    <Route path="/nih_ic_webform" component={NIHICWebform} />
    <Route path="/nih_pilot_info" component={NIHPilotInfo} />
    <AuthenticatedRoute path="/admin_console" component={AdminConsole} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_users" component={AdminManageUsers} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_dac" component={AdminManageDac} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/summary_votes" component={SummaryVotes} props={props} rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/researcher_console" component={ResearcherConsole} props={props} rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/chair_console" component={ChairConsole} props={props} rolesAllowed={[USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/new_chair_console" component={NewChairConsole} props={props} rolesAllowed={[USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/member_console" component={MemberConsole} props={props} rolesAllowed={[USER_ROLES.member]} />
    <AuthenticatedRoute path="/data_owner_console" component={DataOwnerConsole} props={props} rolesAllowed={[USER_ROLES.dataOwner]} />
    <AuthenticatedRoute path="/data_owner_review/:voteId/:referenceId/:dataSetId" component={DataOwnerReview} props={props}
      rolesAllowed={[USER_ROLES.dataOwner]} />
    {/* Order is important for processing links with embedded dataRequestIds */}
    <AuthenticatedRoute path="/dar_application/:dataRequestId" component={DataAccessRequestApplication} props={props}
      rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/dar_application" component={DataAccessRequestApplication} props={props}
      rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/profile" component={ResearcherProfile} props={props} rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/admin_manage_access" component={AdminManageAccess} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/signing_official_console" component={SigningOfficialConsole} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/dataset_registration/:datasetId" component={DatasetRegistration} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dataset_registration" component={DatasetRegistration} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dar_renewal" component={DataAccessRequestRenewal} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_dul" component={AdminManageDul} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/dataset_catalog" component={DatasetCatalog} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.all]} />
    <AuthenticatedRoute path="/researcher_review/:dacUserId" component={ResearcherReview} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/access_result_records/:referenceId/:electionId" component={AccessResultRecords} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.alumni]} />
    <AuthenticatedRoute path="/dul_results_record/:electionId" component={DulResultRecords} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.member, USER_ROLES.alumni]} />
    <AuthenticatedRoute path="/access_review/:darId/:voteId" component={AccessReview} props={props}
      rolesAllowed={[USER_ROLES.member, USER_ROLES.chairperson]}/>
    <AuthenticatedRoute path="/access_preview/:referenceId?/:electionId?" component={AccessPreview} props={props}
      rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/access_collect/:electionId/:referenceId" component={AccessCollect} props={props}
      rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/dul_review/:voteId/:consentId" component={DulReview} props={props}
      rolesAllowed={[USER_ROLES.member, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dul_preview/:consentId" component={DulPreview} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dul_collect/:consentId" component={DulCollect} props={props}
      rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.admin]} />
    <AuthenticatedRoute path="/reviewed_cases" component={ReviewedCases} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.alumni]} />
    <Route path="*" component={NotFound} />
  </Switch>
);

export default Routes;
