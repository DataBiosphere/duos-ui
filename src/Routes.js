import React from "react";
import { Switch, Route } from "react-router-dom";
import Home from './pages/Home';
import InvalidRestrictions from "./pages/InvalidRestrictions";
import HomeHelp from "./pages/HomeHelp";
import Login from './pages/Login';
import AccessReview from "./pages/AccessReview";
import { ResearcherProfile } from "./components/ResearcherProfile";
import DataOwnerConsole from "./pages/DataOwnerConsole";
import AdminManageAccess from "./pages/AdminManageAccess";
import AccessPreviewResults from "./pages/AccessPreviewResults";
import AccessReviewResults from "./pages/AccessReviewResults";
import AdminManageDul from "./pages/AdminManageDul";
import DulReview from "./pages/DulReview";
import DulPreviewResults from "./pages/DulPreviewResults";
import AdminConsole from "./pages/AdminConsole";
import ResearcherConsole from "./pages/ResearcherConsole";
import { ChairConsole } from "./pages/ChairConsole";
import RpApplication from "./pages/RpApplication";
import NotFound from "./pages/NotFound";
import AccessResultRecords from "./pages/AccessResultRecords";
import DulResultRecords from "./pages/DulResultRecords";
import FinalAccessReviewResults from "./pages/FinalAccessReviewResults";
import { SummaryVotes } from "./pages/SummaryVotes";
import ReviewedCases from "./pages/ReviewedCases";
import DataAccessRequestApplication from "./pages/DataAccessRequestApplication";
import UserConsole from "./pages/UserConsole";
import HomeAbout from "./pages/HomeAbout";
import HelpMe from "./pages/HelpMe";
import HomeRegister from "./pages/HomeRegister";
import DataOwnerReview from "./pages/DataOwnerReview";
import AdminManageUsers from './pages/AdminManageUsers';
import DatasetCatalog from "./pages/DatasetCatalog";
import DulReviewResults from "./pages/DulReviewResults";
import ResearcherReview from "./pages/ResearcherReview";
import ManageOntologies from "./pages/ManageOntologies";
import AuthenticatedRoute from "./components/AuthenticatedRoute";
import Paginator from "./components/Paginator";

export default ({props}) => (

  <Switch>
    <Route exact path='/' component={Home} props={{ props }} />
    <Route exact path='/home' component={Home} props={{ props }} />
    <AuthenticatedRoute path='/admin_console' component={AdminConsole} props={props} />
    <AuthenticatedRoute path='/admin_manage_users' component={AdminManageUsers} props={props} />
    <AuthenticatedRoute path='/summary_votes' component={SummaryVotes} props={props} />
    <AuthenticatedRoute path='/researcher_console' component={ResearcherConsole} props={props} />
    <AuthenticatedRoute path='/chair_console' component={ChairConsole} props={props} />
    <AuthenticatedRoute path='/user_console' component={UserConsole} props={props} />
    <AuthenticatedRoute path='/data_owner_console' component={DataOwnerConsole} props={props} />
    <AuthenticatedRoute path='/dar_application' component={DataAccessRequestApplication} props={props} />
    <Route path='/home_help' component={HomeHelp} />
    <Route path='/home_about' component={HomeAbout} />
    <AuthenticatedRoute path='/researcher_profile' component={ResearcherProfile} props={props} />
    <AuthenticatedRoute path='/admin_manage_access' component={AdminManageAccess} props={props} />
    <AuthenticatedRoute path='/admin_manage_dul' component={AdminManageDul} props={props} />
    <AuthenticatedRoute path='/data_owner_review' component={DataOwnerReview} props={props} />
    <AuthenticatedRoute path='/dataset_catalog' component={DatasetCatalog} props={props} />
    <Route path='/help_me' component={HelpMe} props={props} />
    <AuthenticatedRoute path='/home_register' component={HomeRegister} props={props} />
    <AuthenticatedRoute path='/invalid_restrictions' component={InvalidRestrictions} props={props} />
    <Route path='/login' component={Login} props={{ props }} />
    <AuthenticatedRoute path='/manage_ontologies' component={ManageOntologies} props={props} />
    <AuthenticatedRoute path='/researcher_review' component={ResearcherReview} props={props} />
    <AuthenticatedRoute path='/access_result_records' component={AccessResultRecords} props={props} />
    <AuthenticatedRoute path='/dul_result_records' component={DulResultRecords} props={props} />
    <AuthenticatedRoute path='/access_review' component={AccessReview} props={props} />
    <AuthenticatedRoute path='/dul_review' component={DulReview} props={props} />
    <AuthenticatedRoute path='/access_preview_results' component={AccessPreviewResults} props={props} />
    <AuthenticatedRoute path='/access_review_results' component={AccessReviewResults} props={props} />
    <AuthenticatedRoute path='/dul_preview_results' component={DulPreviewResults} props={props} />
    <AuthenticatedRoute path='/dul_review_results' component={DulReviewResults} props={props} />
    <AuthenticatedRoute path='/final_access_review_results' component={FinalAccessReviewResults} props={props} />
    <AuthenticatedRoute path='/reviewed_cases' component={ReviewedCases} props={props} />
    <AuthenticatedRoute path='/rp_application' component={RpApplication} props={props} />
    <AuthenticatedRoute path='/paginator' component={Paginator} props={props}/>
    <Route path='*' component={NotFound} />
  </Switch>
);