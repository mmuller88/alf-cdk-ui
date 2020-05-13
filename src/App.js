import React, { Component } from 'react';
// import './App.css'
import SwaggerUI from 'swagger-ui';
import "swagger-ui-react/swagger-ui.css"
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth }from 'aws-amplify';
import aws_exports from './aws-exports';

Amplify.configure(aws_exports);

var jwt = 'no';
var userName;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      definitionLink: "https://api-explorer.alfpro.net/swagger.json",
    }

    // console.log("baue");

    // console.log("AuthConfigure: " + Auth._config);
    // console.log("Auth: " + Auth);
    // Auth.configure({
    //   auth0: {
    //       // domain: 'your auth0 domain',
    //       clientID: '4f11vr3ui4360mgcq8c6lj40ss',
    //       redirectUri: '/',
    //       // audience: 'https://your_domain/userinfo',
    //       responseType: 'token id_token', // for now we only support implicit grant flow
    //       scope: 'gw-api/all', // the scope used by your app
    //       returnTo: '/'
    //   },
    //   mandatorySignIn: false,
    //   region: Config.AWS_REGION,
    //   identityPoolRegion: Config.AWS_REGION,
    //   identityPoolId: Config.AWS_COGNITO_ID_POOL,
    //   userPoolId: Config.AWS_USER_POOL,
    //   userPoolWebClientId: Config.AWS_USER_POOL_CLIENT,
    //   refreshHandlers: {
    //     [Config.AUTH0_DOMAIN]: refreshToken, // ****.auth0.com
    //     developer: refreshToken,  // testing
    //   },
    // });

    Auth.currentAuthenticatedUser({
        bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
    }).then(authUser =>{
      // console.log(authUser)
      userName = authUser.username;
    } )
    .catch(err => console.log(err));

    Auth.currentSession().then(res=>{
      let accessToken = res.getAccessToken()
      jwt = accessToken.getJwtToken()
      //You can print them to see the full objects
      // console.log(`myAccessToken: ${JSON.stringify(accessToken)}`)
      // console.log(`myJwt: ${jwt}`)
    })


  }

  componentDidMount() {
    SwaggerUI({
      domNode: document.getElementById("api-data"),
      url: this.state.definitionLink,
      requestInterceptor: function(request) {
        // request interceptor
          // add custom headers here
          request.headers.Authorization = `${jwt}`;
          return request;
      },
      responseInterceptor: function(response) {
        // request interceptor
          // add custom headers here
          request.headers['Access-Control-Allow-Origin'] = '*'
          return response;
      },
      // requestInterceptor: req => {
      //   //return req;
      //   const promise = new Promise((resolve, reject) => resolve(req));
      //   promise.url = req.url
      //   promise.headers.Authorization = `${jwt}`;
      //   return promise
      // }
      // requestInterceptor: { function(request) {
      //   console.log(`UserName: ${userName}`)
      //   // Allow developers to set a bearertoken since
      //   // const bearerToken = sessionStorage.getItem('bearerToken');
      //   if (!jwt) {
      //     alert(`Couldn't find the jwt token`);
      //     return request;
      //   } else {
      //     url = proxyUrl + '/' + this.url
      //     request.headers.Authorization = `${jwt}`;
      //     request.headers['Access-Control-Allow-Origin'] = '*'
      //     request.headers['Access-Control-Allow-Methods'] = "DELETE, POST, GET, OPTIONS"
      //     request.headers['Access-Control-Allow-Headers'] = "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
      //     if (request.method === "OPTIONS"){
      //       w.WriteHeader(http.StatusOK)
      //       return
      //     }
      //     request.parameters.alfUserId = `${userName}`;
      //     console.log(`Body: ${request.body}`)
      //     return request;
      //   }
      // } }
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

