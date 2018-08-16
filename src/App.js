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
      <Route path='*' component={NotFound} />
    </Switch>
  </main>
)

class App extends React.Component {

  constructor(props) {
    super(props);
    console.log('------------------- App Constructor -----------------------------');
    console.log(this.state);

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
