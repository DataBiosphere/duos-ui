import _ from 'lodash/fp';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import { USER_ROLES } from './libs/utils';
import AccessCollect from './pages/AccessCollect';
import AccessPreview from './pages/AccessPreview';
import AccessResultRecords from './pages/AccessResultRecords';
import AccessReview from './pages/AccessReview';
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
import FinalAccessReview from './pages/FinalAccessReview';
import HelpReports from './pages/HelpReports';
import Home from './pages/Home';
import HomeAbout from './pages/HomeAbout';
import HomeHelp from './pages/HomeHelp';
import InvalidRestrictions from './pages/InvalidRestrictions';
import AccessReviewV2 from './pages/access_review/AccessReviewV2';
import MemberConsole from './pages/MemberConsole';
import NotFound from './pages/NotFound';
import ResearcherConsole from './pages/ResearcherConsole';
import { ResearcherProfile } from './pages/ResearcherProfile';
import ResearcherReview from './pages/ResearcherReview';
import ReviewedCases from './pages/ReviewedCases';
import NHGRIpilotinfo from './pages/NHGRIpilotinfo';
import { Status } from './pages/Status';
import { SummaryVotes } from './pages/SummaryVotes';


const Routes = (props) => (
  <Switch>
    <Route exact path="/" render={(routeProps) => <Home {...routeProps} {...props} />} />
    <Route exact path="/home" render={(routeProps) => <Home {...routeProps} {...props} />} />
    <Route exact path="/status" render={(routeProps) => Status(_.mergeAll([routeProps, props]))} />
    <Route path="/home_help" component={HomeHelp} />
    <Route path="/home_about" component={HomeAbout} />
    <Route path="/election404" component={Election404} />
    <Route path="/NHGRIpilotinfo" component={NHGRIpilotinfo} />
    <AuthenticatedRoute path="/admin_console" component={AdminConsole} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_users" component={AdminManageUsers} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_dac" component={AdminManageDac} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/summary_votes" component={SummaryVotes} props={props} rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/researcher_console" component={ResearcherConsole} props={props} rolesAllowed={[USER_ROLES.researcher]} />
    <AuthenticatedRoute path="/chair_console" component={ChairConsole} props={props} rolesAllowed={[USER_ROLES.chairperson]} />
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
    <AuthenticatedRoute path="/dataset_registration" component={DatasetRegistration} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/dar_renewal" component={DataAccessRequestRenewal} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/admin_manage_dul" component={AdminManageDul} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/dataset_catalog" component={DatasetCatalog} props={props} rolesAllowed={[USER_ROLES.admin, USER_ROLES.all]} />
    <AuthenticatedRoute path="/help_reports" component={HelpReports} props={props} rolesAllowed={[USER_ROLES.all]} />
    <AuthenticatedRoute path="/invalid_restrictions" component={InvalidRestrictions} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/researcher_review/:dacUserId" component={ResearcherReview} props={props} rolesAllowed={[USER_ROLES.admin]} />
    <AuthenticatedRoute path="/access_result_records/:referenceId/:electionId" component={AccessResultRecords} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.member, USER_ROLES.alumni]} />
    <AuthenticatedRoute path="/dul_results_record/:electionId" component={DulResultRecords} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.member, USER_ROLES.alumni]} />
    <AuthenticatedRoute path="/access_review/:darId/:voteId/:rpVoteId?" component={AccessReview} props={props}
      rolesAllowed={[USER_ROLES.member, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/new_access_review/:darId/:voteId/:rpVoteId?" component={AccessReviewV2} props={props}
      rolesAllowed={[USER_ROLES.member, USER_ROLES.chairperson]}
    />
    <AuthenticatedRoute path="/access_preview/:referenceId?/:electionId?" component={AccessPreview} props={props}
      rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.admin]} />
    <AuthenticatedRoute path="/access_collect/:electionId/:referenceId" component={AccessCollect} props={props}
      rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.admin]} />
    <AuthenticatedRoute path="/dul_review/:voteId/:consentId" component={DulReview} props={props}
      rolesAllowed={[USER_ROLES.member, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dul_preview/:consentId" component={DulPreview} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/dul_collect/:consentId" component={DulCollect} props={props}
      rolesAllowed={[USER_ROLES.chairperson, USER_ROLES.admin]} />
    <AuthenticatedRoute path="/final_access_review/:referenceId/:electionId" component={FinalAccessReview} props={props}
      rolesAllowed={[USER_ROLES.chairperson]} />
    <AuthenticatedRoute path="/reviewed_cases" component={ReviewedCases} props={props}
      rolesAllowed={[USER_ROLES.admin, USER_ROLES.chairperson, USER_ROLES.member, USER_ROLES.alumni]} />
    <Route path="*" component={NotFound} />
  </Switch>
);

export default Routes;
