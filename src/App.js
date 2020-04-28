import React, { Component } from 'react';
// import './App.css'
import SwaggerUI from 'swagger-ui';
import "swagger-ui-react/swagger-ui.css"
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth }from 'aws-amplify';
import aws_exports from './aws-exports';

Amplify.configure(aws_exports);

var jwt;
var userName;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      definitionLink: "https://api-explorer.h-o.dev/swagger.json",
    }

    console.log("baue");

    Auth.configure({
      auth0: {
          // domain: 'your auth0 domain',
          clientID: '4f11vr3ui4360mgcq8c6lj40ss',
          redirectUri: '/',
          // audience: 'https://your_domain/userinfo',
          responseType: 'token id_token', // for now we only support implicit grant flow
          scope: 'gw-api/all', // the scope used by your app
          returnTo: '/'
      },
      mandatorySignIn: false,
      region: Config.AWS_REGION,
      identityPoolRegion: Config.AWS_REGION,
      identityPoolId: Config.AWS_COGNITO_ID_POOL,
      userPoolId: Config.AWS_USER_POOL,
      userPoolWebClientId: Config.AWS_USER_POOL_CLIENT,
      refreshHandlers: {
        [Config.AUTH0_DOMAIN]: refreshToken, // ****.auth0.com
        developer: refreshToken,  // testing
      },
    });

    Auth.currentAuthenticatedUser({
        bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
    }).then(authUser =>{
      console.log(authUser)
      userName = authUser.username;
    } )
    .catch(err => console.log(err));

    Auth.currentSession().then(res=>{
      let accessToken = res.getAccessToken()
      jwt = accessToken.getJwtToken()
      //You can print them to see the full objects
      console.log(`myAccessToken: ${JSON.stringify(accessToken)}`)
      console.log(`myJwt: ${jwt}`)
    })


  }

  componentDidMount() {
    SwaggerUI({
      domNode: document.getElementById("api-data"),
      url: this.state.definitionLink
    })
  }

  render() {
    return (
      <div className="App">
        <div id="api-data" />
      </div>
    );
  }
}

export default withAuthenticator(App, true);

