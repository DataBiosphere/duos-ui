import React from 'react';
import Home from './pages/Home';
import AdminConsole from './pages/AdminConsole';
import AdminUsers from './pages/AdminUsers';
import { ChairConsole } from './pages/ChairConsole';
import ResearcherConsole from './pages/ResearcherConsole';
import UserConsole from './pages/UserConsole';
import DataOwnerConsole from './pages/DataOwnerConsole';
import DuosHeader from './components/DuosHeader';
import DuosFooter from './components/DuosFooter';
import { ResearcherProfile } from './components/ResearcherProfile';
import { SummaryVotes } from './pages/SummaryVotes';
import DataAccessRequestApplication from './pages/DataAccessRequestApplication';
import HomeHelp from './pages/HomeHelp';
import HomeAbout from './pages/HomeAbout';
import NotFound from './pages/NotFound'
import AdminManageAccess from './pages/AdminManageAccess';
import AdminManageDul from './pages/AdminManageDul';
import DataOwnerReview from './pages/DataOwnerReview';
import DatasetCatalog from './pages/DatasetCatalog';
import HelpMe from './pages/HelpMe';
import HomeRegister from './pages/HomeRegister';
import InvalidRestrictions from './pages/InvalidRestrictions';
import Login from './pages/Login';
import ManageOntologies from './pages/ManageOntologies';
import ResearcherReview from './pages/ResearcherReview';
import AccessResultRecords from './pages/AccessResultRecords';
import DulResultRecords from './pages/DulResultRecords';
import AccessReview from './pages/AccessReview';
import DulReview from './pages/DulReview';
import AccessPreviewResults from './pages/AccessPreviewResults';
import AccessReviewResults from './pages/AccessReviewResults';
import DulPreviewResults from './pages/DulPreviewResults';
import DulReviewResults from './pages/DulReviewResults';
import FinalAccessReviewResults from './pages/FinalAccessReviewResults';
import ReviewedCases from './pages/ReviewedCases';
import RpApplication from './pages/RpApplication';

import { div, h } from 'react-hyperscript-helpers';

import './App.css';

import { Switch, Route } from 'react-router-dom'

const Main = () => (
  <main>
    <Switch>
      <Route exact path='/' component={Home} />
      <Route exact path='/home' component={Home} />
      <Route path='/admin_console' component={AdminConsole} />
      <Route path='/admin_users' component={AdminUsers} />
      <Route path='/summary_votes' component={SummaryVotes} />
      <Route path='/researcher_console' component={ResearcherConsole} />
      <Route path='/chair_console' component={ChairConsole} />
      <Route path='/user_console' component={UserConsole} />
      <Route path='/data_owner_console' component={DataOwnerConsole} />
      <Route path='/dar_application' component={DataAccessRequestApplication} />
      <Route path='/home_help' component={HomeHelp} />
      <Route path='/home_about' component={HomeAbout} />
      <Route path='/researcher_profile' component={ResearcherProfile} />
      <Route path='/admin_manage_access' component={AdminManageAccess} />
      <Route path='/admin_manage_dul' component={AdminManageDul} />
      <Route path='/data_owner_review' component={DataOwnerReview} />
      <Route path='/dataset_catalog' component={DatasetCatalog} />
      <Route path='/help_me' component={HelpMe} />
      <Route path='/home_register' component={HomeRegister} />
      <Route path='/invalid_restrictions' component={InvalidRestrictions} />
      <Route path='/login' component={Login} />
      <Route path='/manage_ontologies' component={ManageOntologies} />
      <Route path='/researcher_review' component={ResearcherReview} />
      <Route path='/access_result_records' component={AccessResultRecords} />
      <Route path='/dul_result_records' component={DulResultRecords} />
      <Route path='/access_review' component={AccessReview} />
      <Route path='/dul_review' component={DulReview} />
      <Route path='/access_preview_results' component={AccessPreviewResults} />
      <Route path='/access_review_results' component={AccessReviewResults} />
      <Route path='/dul_preview_results' component={DulPreviewResults} />
      <Route path='/dul_review_results' component={DulReviewResults} />
      <Route path='/final_access_review_results' component={FinalAccessReviewResults} />
      <Route path='/reviewed_cases' component={ReviewedCases} />
      <Route path='/rp_application' component={RpApplication} />
      <Route path='*' component={NotFound} />
    </Switch>
  </main>
)

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isLogged: false
    }

    this.loginState = this.loginState.bind(this);

  }

  render() {

    return (
      div({}, [
        h(DuosHeader, { isLogged: this.state.isLogged, loginState: this.loginState }),
        h(Main, {}),
        // h(DuosFooter, {})
      ])
    );
  }

  loginState(isLogged) {
    this.setState({ isLogged: isLogged }, function () {
      console.log('-------------- loggedIn ------------------', this.state);
    });
  }
}

export default App;
