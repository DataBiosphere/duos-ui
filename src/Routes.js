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

export default ({ childProps }) => (

    <Switch>
        <Route exact path='/' component={Home} props={{childProps}}/>
        <Route exact path='/home' component={Home} props={{childProps}}/>
        <AuthenticatedRoute path='/admin_console' component={AdminConsole} props={childProps} />
        <AuthenticatedRoute path='/admin_users' component={AdminUsers} props={childProps} />
        <AuthenticatedRoute path='/summary_votes' component={SummaryVotes} props={childProps}/>
        <AuthenticatedRoute path='/researcher_console' component={ResearcherConsole} props={childProps}/>
        <AuthenticatedRoute path='/chair_console' component={ChairConsole} props={childProps}/>
        <AuthenticatedRoute path='/user_console' component={UserConsole} props={childProps}/>
        <AuthenticatedRoute path='/data_owner_console' component={DataOwnerConsole} props={childProps}/>
        <AuthenticatedRoute path='/dar_application' component={DataAccessRequestApplication} props={childProps}/>
        <Route path='/home_help' component={HomeHelp}/>
        <Route path='/home_about' component={HomeAbout}/>
        <AuthenticatedRoute path='/researcher_profile' component={ResearcherProfile} props={childProps}/>
        <AuthenticatedRoute path='/admin_manage_access' component={AdminManageAccess} props={childProps}/>
        <AuthenticatedRoute path='/admin_manage_dul' component={AdminManageDul} props={childProps}/>
        <AuthenticatedRoute path='/data_owner_review' component={DataOwnerReview} props={childProps}/>
        <AuthenticatedRoute path='/dataset_catalog' component={DatasetCatalog} props={childProps}/>
        <Route path='/help_me' component={HelpMe} props={childProps}/>
        <AuthenticatedRoute path='/home_register' component={HomeRegister} props={childProps}/>
        <AuthenticatedRoute path='/invalid_restrictions' component={InvalidRestrictions} props={childProps}/>
        <Route path='/login' component={Login} props={{childProps}}/>
        <AuthenticatedRoute path='/manage_ontologies' component={ManageOntologies} props={childProps}/>
        <AuthenticatedRoute path='/researcher_review' component={ResearcherReview} props={childProps}/>
        <AuthenticatedRoute path='/access_result_records' component={AccessResultRecords} props={childProps}/>
        <AuthenticatedRoute path='/dul_result_records' component={DulResultRecords} props={childProps}/>
        <AuthenticatedRoute path='/access_review' component={AccessReview} props={childProps}/>
        <AuthenticatedRoute path='/dul_review' component={DulReview} props={childProps}/>
        <AuthenticatedRoute path='/access_preview_results' component={AccessPreviewResults} props={childProps}/>
        <AuthenticatedRoute path='/access_review_results' component={AccessReviewResults} props={childProps}/>
        <AuthenticatedRoute path='/dul_preview_results' component={DulPreviewResults} props={childProps}/>
        <AuthenticatedRoute path='/dul_review_results' component={DulReviewResults} props={childProps}/>
        <AuthenticatedRoute path='/final_access_review_results' component={FinalAccessReviewResults} props={childProps}/>
        <AuthenticatedRoute path='/reviewed_cases' component={ReviewedCases} props={childProps}/>
        <AuthenticatedRoute path='/rp_application' component={RpApplication} props={childProps}/>
        <Route path='*' component={NotFound}/>
    </Switch>
);