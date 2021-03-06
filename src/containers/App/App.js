import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Route, HashRouter, Redirect, Switch } from 'react-router-dom'
import { createBrowserHistory } from 'history';
import Full from '../Full/'
import Home from '../Home/'
import PropTypes from 'prop-types'
import { loginAction, addUserOrganization, isValidToken, receiveLogin, setApplicationCookie } from './../../actions.js'
import { serviceurl } from '../../config/serviceurl.js'

const history = createBrowserHistory();

function PrivateRoute({ component: Component, authed, ...rest }) {
  return (
    <Route
      {...rest}
      render={(props) => authed === true
        ? <Component {...props} />
        : <Redirect to={{ pathname: '/login', state: { from: props.location } }} />}
    />
  )
}

function PublicRoute({ component: Component, authed, ...rest }) {
  return (
    <Route
      {...rest}
      render={(props) => authed === false
        ? <Component {...props} />
        : <Redirect to='/home' />}
    />
  )
}

class App extends Component {
  state = {
    authed: false,
    loading: true,
  }
  componentDidMount() {
    const { dispatch } = this.props
    if (this.props.loggedUser) {
      this.setState({
        authed: true,
        loading: false
      })
    } else {
      if (localStorage.getItem('username') && localStorage.getItem('token') &&
        localStorage.getItem('username') !== 'null' && localStorage.getItem('token') !== 'null') {
        dispatch(isValidToken(localStorage.getItem('token'))).then(ok => {
          if (ok) {
            dispatch(loginAction())
              .then(json => {
                dispatch(setApplicationCookie('superset'))
                .then(json => {
                  if (json.result) {
                    let cookie = json.result.split('=');
                    document.cookie = "session=" + cookie[1] + "; path=/; domain=" + serviceurl.domain;
                    dispatch(setApplicationCookie('metabase'))
                      .then(json => {
                        if (json.result) {
                          let cookie = json.result.split('=');
                          document.cookie = "metabase.SESSION_ID=" + cookie[1] + "; path=/; domain=" + serviceurl.domain;
                          dispatch(loginAction())
                            .then(json => {
                              dispatch(receiveLogin(json))
                              dispatch(addUserOrganization(json.uid))
                            })
                        }
                      })
                  }
                })
              }).then(this.setState({
                authed: true,
                loading: false
              }))
            }else{
              this.setState({
                authed: false,
                loading: false
              })
            }
          })
          .catch((error) => {
            this.setState({
              authed: false,
              loading: false
            })
          })
      } else {
        this.setState({
          authed: false,
          loading: false
        })
      }
    }
  }
  componentWillUnmount() {
    this.removeListener()
  }
  render() {

    if (this.props.authed)
      this.state.authed = true;

    return this.state.loading === true ? <h1 className="m-20">Loading</h1> : (

      <HashRouter history={history}>
        <Switch>
          <PublicRoute authed={this.state.authed} path='/' exact component={Home} />
          <PublicRoute authed={this.state.authed} path="/login" component={Home} />
          <PublicRoute authed={this.state.authed} path="/register" component={Home} />
          <PublicRoute authed={this.state.authed} path="/confirmregistration" component={Home} />
          <PrivateRoute authed={this.state.authed} path="/home" name="Dashboard" component={Full} />
          <PrivateRoute authed={this.state.authed} path="/dashboard" name="Dashboard" component={Full} />
          <PrivateRoute authed={this.state.authed} path="/ingestionwizzard" name="Ingestion" component={Full} />
          <PrivateRoute authed={this.state.authed} path="/ontologies" name="Ontologies" component={Full} />
          <PrivateRoute authed={this.state.authed} path="/vocabulary" name="Vocabulary" component={Full} />
          <PrivateRoute authed={this.state.authed} path="/dataset" name="Dataset" component={Full} />
          <PrivateRoute authed={this.state.authed} path="/dashboard/manager" name="Dash" component={Full} />
          <PrivateRoute authed={this.state.authed} path="/dashboard/list" name="Dash" component={Full} />
          <PrivateRoute authed={this.state.authed} path="/user_story" name="Storie" component={Full} />
          <PrivateRoute authed={this.state.authed} path="/profile" name="Profile" component={Full} />
        </Switch>
      </HashRouter>

    );
  }
}

App.propTypes = {
  loggedUser: PropTypes.object,
  dispatch: PropTypes.func.isRequired
}

function mapStateToProps(state) {
  const { loggedUser, authed } = state.userReducer['obj'] || {}
  return { loggedUser, authed }
}

export default connect(mapStateToProps)(App)
