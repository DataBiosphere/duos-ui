import React from "react";
import {Switch, Route } from "react-router-dom";
import Home from './pages/Home';
import InvalidRestrictions from "./pages/InvalidRestrictions";
import HomeHelp from "./pages/HomeHelp";
import Login from './pages/Login';
import AccessReview from "./pages/AccessReview";
import {ResearcherProfile} from "./components/ResearcherProfile";
import DataOwnerConsole from "./pages/DataOwnerConsole";
import AdminManageAccess from "./pages/AdminManageAccess";
import AccessPreviewResults from "./pages/AccessPreviewResults";
import AccessReviewResults from "./pages/AccessReviewResults";
import AdminManageDul from "./pages/AdminManageDul";
import DulReview from "./pages/DulReview";
import DulPreviewResults from "./pages/DulPreviewResults";
import AdminConsole from "./pages/AdminConsole";
import ResearcherConsole from "./pages/ResearcherConsole";
import {ChairConsole} from "./pages/ChairConsole";
import RpApplication from "./pages/RpApplication";
import NotFound from "./pages/NotFound";
import AccessResultRecords from "./pages/AccessResultRecords";
import DulResultRecords from "./pages/DulResultRecords";
import FinalAccessReviewResults from "./pages/FinalAccessReviewResults";
import {SummaryVotes} from "./pages/SummaryVotes";
import ReviewedCases from "./pages/ReviewedCases";
import DataAccessRequestApplication from "./pages/DataAccessRequestApplication";
import UserConsole from "./pages/UserConsole";
import HomeAbout from "./pages/HomeAbout";
import HelpMe from "./pages/HelpMe";
import HomeRegister from "./pages/HomeRegister";
import DataOwnerReview from "./pages/DataOwnerReview";
import AdminUsers from "./pages/AdminUsers";
import DatasetCatalog from "./pages/DatasetCatalog";
import DulReviewResults from "./pages/DulReviewResults";
import ResearcherReview from "./pages/ResearcherReview";
import ManageOntologies from "./pages/ManageOntologies";
import AuthenticatedRoute from "./components/Services/AuthenticatedRoute";
import UnauthenticatedRoute from "./components/Services/UnauthenticatedRoute";

export default ({ childProps }) => (

    <Switch>
        <UnauthenticatedRoute exact path='/' component={Home} props={{childProps}}/>
        <UnauthenticatedRoute exact path='/home' component={Home} props={{childProps}}/>
        <Route path='/admin_console' component={AdminConsole}/>
        <AuthenticatedRoute path='/admin_users' component={AdminUsers}/>
        <AuthenticatedRoute path='/summary_votes' component={SummaryVotes}/>
        <AuthenticatedRoute path='/researcher_console' component={ResearcherConsole}/>
        <AuthenticatedRoute path='/chair_console' component={ChairConsole}/>
        <AuthenticatedRoute path='/user_console' component={UserConsole}/>
        <AuthenticatedRoute path='/data_owner_console' component={DataOwnerConsole}/>
        <AuthenticatedRoute path='/dar_application' component={DataAccessRequestApplication}/>
        <UnauthenticatedRoute path='/home_help' component={HomeHelp}/>
        <UnauthenticatedRoute path='/home_about' component={HomeAbout}/>
        <AuthenticatedRoute path='/researcher_profile' component={ResearcherProfile}/>
        <AuthenticatedRoute path='/admin_manage_access' component={AdminManageAccess}/>
        <AuthenticatedRoute path='/admin_manage_dul' component={AdminManageDul}/>
        <AuthenticatedRoute path='/data_owner_review' component={DataOwnerReview}/>
        <AuthenticatedRoute path='/dataset_catalog' component={DatasetCatalog}/>
        <UnauthenticatedRoute path='/help_me' component={HelpMe}/>
        <AuthenticatedRoute path='/home_register' component={HomeRegister}/>
        <AuthenticatedRoute path='/invalid_restrictions' component={InvalidRestrictions}/>
        <UnauthenticatedRoute path='/login' component={Login} props={{childProps}}/>
        <AuthenticatedRoute path='/manage_ontologies' component={ManageOntologies}/>
        <AuthenticatedRoute path='/researcher_review' component={ResearcherReview}/>
        <AuthenticatedRoute path='/access_result_records' component={AccessResultRecords}/>
        <AuthenticatedRoute path='/dul_result_records' component={DulResultRecords}/>
        <AuthenticatedRoute path='/access_review' component={AccessReview}/>
        <AuthenticatedRoute path='/dul_review' component={DulReview}/>
        <AuthenticatedRoute path='/access_preview_results' component={AccessPreviewResults}/>
        <AuthenticatedRoute path='/access_review_results' component={AccessReviewResults}/>
        <AuthenticatedRoute path='/dul_preview_results' component={DulPreviewResults}/>
        <AuthenticatedRoute path='/dul_review_results' component={DulReviewResults}/>
        <AuthenticatedRoute path='/final_access_review_results' component={FinalAccessReviewResults}/>
        <AuthenticatedRoute path='/reviewed_cases' component={ReviewedCases}/>
        <AuthenticatedRoute path='/rp_application' component={RpApplication}/>
        <UnauthenticatedRoute path='*' component={NotFound}/>
    </Switch>
);