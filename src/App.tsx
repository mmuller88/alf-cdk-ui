import React, { Component } from 'react';
// import './App.css'
import SwaggerUI from 'swagger-ui-react';
import "swagger-ui-react/swagger-ui.css"
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth }from 'aws-amplify';
import aws_exports from './aws-exports';

Amplify.configure(aws_exports);

var jwt = 'no';
var userName: string;

class App extends Component {
  constructor(props: any) {
    super(props);
    // this.state. = {
    //   definitionLink: "https://api-explorer.alfpro.net/swagger.json",
    // }

    Auth.currentAuthenticatedUser({
        bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
    }).then(authUser =>{
      // console.log(authUser)
      userName = authUser.username;
      console.log(userName)
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
    var openApi;
    fetch("https://api-explorer.alfpro.net/swagger.json")
      .then(res => res.json())
      .then((out) => {
          // console.log('openApi before replace: ', out);
          openApi = out;

          openApi.components.schemas.userId.example = userName

          // console.log('openApi after replace: ', openApi);

          new SwaggerUI({
            // domNode: document.getElementById("api-data"),
            spec: openApi,
            // url: this.state.definitionLink,
            requestInterceptor: function (request) {
              // request interceptor
              // add custom headers here
              request.headers.Authorization = `${jwt}`;
              return request;
            },
            responseInterceptor: function (response) {
              // request interceptor
              // add custom headers here
              response.headers['Access-Control-Allow-Origin'] = '*';
              return response;
            },
          })
      }).catch(err => console.error(err));
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

