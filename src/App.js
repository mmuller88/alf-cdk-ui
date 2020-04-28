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

