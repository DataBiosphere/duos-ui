import React from "react";
import { Switch, Route, Link, withRouter  } from "react-router-dom";

import Home from './pages/Home';
import InvalidRestrictions from "./pages/InvalidRestrictions";
import HomeHelp from "./pages/HomeHelp";
import Login from './pages/Login';
import AccessReview from "./pages/AccessReview";
import { ResearcherProfile } from "./pages/ResearcherProfile";
import DataOwnerConsole from "./pages/DataOwnerConsole";
import AdminManageAccess from "./pages/AdminManageAccess";
import AccessPreview from "./pages/AccessPreview";
import AccessCollect from "./pages/AccessCollect";
import AdminManageDul from "./pages/AdminManageDul";
import DulReview from "./pages/DulReview";
import DulPreview from "./pages/DulPreview";
import AdminConsole from "./pages/AdminConsole";
import ResearcherConsole from "./pages/ResearcherConsole";
import { ChairConsole } from "./pages/ChairConsole";
import NotFound from "./pages/NotFound";
import AccessResultRecords from "./pages/AccessResultRecords";
import DulResultRecords from "./pages/DulResultRecords";
import FinalAccessReview from "./pages/FinalAccessReview";
import { SummaryVotes } from "./pages/SummaryVotes";
import ReviewedCases from "./pages/ReviewedCases";
import DataAccessRequestApplication from "./pages/DataAccessRequestApplication";
import MemberConsole from "./pages/MemberConsole";
import HomeAbout from "./pages/HomeAbout";
import HelpReports from "./pages/HelpReports";
import HomeRegister from "./pages/HomeRegister";
import DataOwnerReview from "./pages/DataOwnerReview";
import AdminManageUsers from './pages/AdminManageUsers';
import DatasetCatalog from "./pages/DatasetCatalog";
import DulCollect from "./pages/DulCollect";
import ResearcherReview from "./pages/ResearcherReview";
import ManageOntologies from "./pages/ManageOntologies";
import Election404 from "./pages/Election404";
import AuthenticatedRoute from "./components/AuthenticatedRoute";

export default ({ props }) => (

  <Switch>
    <Route exact path='/' component={Home} props={{ props }} />
    <Route exact path='/home' component={Home} props={{ props }} />
    <AuthenticatedRoute path='/admin_console' component={AdminConsole} props={props} rolesAllowed={["Admin"]}/>
    <AuthenticatedRoute path='/admin_manage_users' component={AdminManageUsers} props={props} rolesAllowed={["Admin"]}/>
    <AuthenticatedRoute path='/summary_votes' component={SummaryVotes} props={props} />
    <AuthenticatedRoute path='/researcher_console' component={ResearcherConsole} props={props} rolesAllowed={["Researcher"]}/>
    <AuthenticatedRoute path='/chair_console' component={ChairConsole} props={props} rolesAllowed={["Chairperson"]}/>
    <AuthenticatedRoute path='/member_console' component={MemberConsole} props={props} rolesAllowed={["Member", "Chairperson"]}/>
    <AuthenticatedRoute path='/data_owner_console' component={DataOwnerConsole} props={props} rolesAllowed={["DataOwner"]}/>
    <AuthenticatedRoute path='/dar_application' component={DataAccessRequestApplication} props={props} rolesAllowed={["Researcher"]}/>
    <Route path='/home_help' component={HomeHelp} />
    <Route path='/home_about' component={HomeAbout} />
    <AuthenticatedRoute path='/researcher_profile' component={ResearcherProfile} props={props} rolesAllowed={["Researcher"]}/>
    <AuthenticatedRoute path='/admin_manage_access' component={AdminManageAccess} props={props} rolesAllowed={["Admin"]}/>
    <AuthenticatedRoute path='/admin_manage_dul' component={AdminManageDul} props={props} rolesAllowed={["Admin"]}/>
    <AuthenticatedRoute path='/data_owner_review/:voteId/:referenceId/:dataSetId' component={DataOwnerReview} props={props} rolesAllowed={["DataOwner"]}/>
    <AuthenticatedRoute path='/dataset_catalog' component={DatasetCatalog} props={props} rolesAllowed={["Admin", "Researcher"]}/>
    <Route path='/help_reports' component={HelpReports} props={props} />
    <AuthenticatedRoute path='/home_register' component={HomeRegister} props={props} rolesAllowed={["Admin"]}/>
    <AuthenticatedRoute path='/invalid_restrictions' component={InvalidRestrictions} props={props} rolesAllowed={["Admin"]}/>
    <Route path='/login' component={Login} props={{ props }} />
    <AuthenticatedRoute path='/manage_ontologies' component={ManageOntologies} props={props} rolesAllowed={["Admin"]}/>
    <AuthenticatedRoute path='/researcher_review/:dacUserId' component={ResearcherReview} props={props} rolesAllowed={["Admin"]}/>
    <AuthenticatedRoute path='/access_result_records/:referenceId/:electionId' component={AccessResultRecords} props={props} rolesAllowed={["Admin", "Researcher"]}/>
    <AuthenticatedRoute path='/dul_results_record/:electionId' component={DulResultRecords} props={props} rolesAllowed={["Admin", "Chairperson"]}/>
    <AuthenticatedRoute path='/access_review/:darId/:voteId/:rpVoteId' component={AccessReview} props={props} rolesAllowed={["Researcher"]}/>
    <AuthenticatedRoute path='/access_preview/:referenceId?/:electionId?' component={AccessPreview} props={props} rolesAllowed={["Researcher"]}/>
    <AuthenticatedRoute path='/access_collect/:referenceId/:electionId' component={AccessCollect} props={props} rolesAllowed={["Chairperson"]}/>
    <AuthenticatedRoute path='/dul_review/:voteId/:consentId' component={DulReview} props={props} rolesAllowed={["Admin", "Chairperson"]}/>
    <AuthenticatedRoute path='/dul_preview/:consentId' component={DulPreview} props={props} rolesAllowed={["Admin", "Chairperson"]}/>
    <AuthenticatedRoute path='/dul_collect/:consentId' component={DulCollect} props={props} rolesAllowed={["Chairperson"]}/>
    <AuthenticatedRoute path='/final_access_review' component={FinalAccessReview} props={props} rolesAllowed={["Chairperson"]}/>
    <AuthenticatedRoute path='/reviewed_cases' component={ReviewedCases} props={props} />
    <Route path='/election404' component={Election404} />
    <Route path='*' component={NotFound} />
  </Switch>
);