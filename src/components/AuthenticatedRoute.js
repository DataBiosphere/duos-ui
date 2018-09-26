import React from "react";
import { Route, Redirect } from "react-router-dom";
import { Storage } from "../libs/storage";

// export default ({component: Component, props: componentProps, roles: roles, ...rest}) =>
//   <Route
//     {...rest}
//     render={
//       roles => {
//         console.log(roles)
//       },
//       props =>
//         Storage.userIsLogged()
//           ? <Component {...props} {...componentProps} />
//           : <Redirect
//             to={'/'}
//           />}
//   />;



// Route handler
class AuthenticatedRoute extends React.Component {
  constructor(props) {
    super(props)
    // Load user from wherever into state.
  }

  render() {
    return <Authorization allowed={this.props.allowed} user={this.state.user}>
      {() =>
        /* the rest of your page */
      }
      <Authorization>
        }
        }

        export default YourRoute

        // Router configuration
        <Router history={BrowserHistory}>
          <Route path="/" component={App}>
            <Route
              allowed={['manager', 'admin']}
              path="feature"
              component={YourRoute}
            />
          </Route>
        </Router>