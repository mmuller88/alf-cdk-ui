import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
// import SwaggerUI from 'swagger-ui';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth }from 'aws-amplify';
import aws_exports from './aws-exports';
// import { CognitoUser } from 'amazon-cognito-identity-js';
import SwaggerUI from 'swagger-ui-react';
// import ReactDOM from 'react-dom';
import 'swagger-ui-react/swagger-ui.css';
Amplify.configure(aws_exports);

// var accessToken: CognitoAccessToken;
var jwt: string;
var userName: string;

class App extends Component{

  render(): any {
    return (
      <div>
        <SwaggerUI
          url="https://api-explorer.h-o.dev.s3.eu-west-2.amazonaws.com/swagger.json"
          docExpansion="list"
          // url="https://s3.eu-west-2.amazonaws.com/api-explorer.h-o.dev/swagger.json"
          requestInterceptor= { function(request) {

            // console.log(`UserName: ${userName}`)
            // console.log(`UserName: ${userName}`)
            // Allow developers to set a bearertoken since
            // const bearerToken = sessionStorage.getItem('bearerToken');
            // if (!jwt) {
            //   alert(`From the console, please run: \nsessionStorage.setItem('accessToken', 'insert a real access token id here')`);
            //   return request;
            // } else {
              // url = proxyUrl + '/' + this.url
              request.headers.Authorization = `${jwt}`;
              request.headers['Access-Control-Allow-Origin'] = '*'
              request.headers['Access-Control-Allow-Methods'] = "DELETE, POST, GET, OPTIONS"
              request.headers['Access-Control-Allow-Headers'] = "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
              // if (request.method === "OPTIONS"){
              //   w.WriteHeader(http.StatusOK)
              //   return
              // }
              // request.parameters.alfUserId = `${userName}`;
              // console.log(`Body: ${request.body}`)
              return request;
            // }
          } }
          responseInterceptor= { function(response) {
              response.headers['Access-Control-Allow-Origin'] = '*'
              response.headers['Access-Control-Allow-Methods'] = "DELETE, POST, GET, OPTIONS"
              response.headers['Access-Control-Allow-Headers'] = "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
              return response;
          } }

        />
      </div>
    )
  }

  constructor(props: any) {
    super(props);

    console.log("baue");

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

}

export default withAuthenticator(App, true);
