import React, { Component } from 'react';
import './App.css'
import SwaggerUI from 'swagger-ui-react';
import "swagger-ui-react/swagger-ui.css"
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth }from 'aws-amplify';
import aws_exports from './aws-exports';

// import { Configuration, InstancesConfApi } from '@martinmuellerdev/alf-cdk-typescript-client';

Amplify.configure(aws_exports);

var jwt = 'no';
var userName: string;

class App extends Component {
  constructor(props: any) {
    super(props);

    Auth.currentAuthenticatedUser({
        bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
    }).then(authUser =>{
      // console.log(authUser)
      userName = authUser.username;
      console.log(userName)
    } )
    .catch(err => console.log(err));

    Auth.currentSession().then(res=>{
      let accessToken = res.getAccessToken();
      jwt = accessToken.getJwtToken();
      //You can print them to see the full objects
      console.log(`myAccessToken: ${JSON.stringify(accessToken)}`)
      console.log(`myJwt: ${jwt}`)

      // const config = new Configuration({
      //   accessToken: jwt,
      //   basePath: 'https://api.alfpro.net'
      // });

      // const api = new InstancesConfApi(config);

      // api.getInstanceConfs(undefined, {
      //   headers: {
      //     Authorization: jwt
      //   }
      // }).then(succeeded => {
      //   console.log(`getInstanceConfs succeeded`);
      //   succeeded.data.forEach(instanceConf => {
      //     // instanceConf.alfInstanceId
      //     console.log(`instanceConf: ${JSON.stringify(instanceConf)}`)
      //   })
      // })
    })


  }

  render() {
    return (
      <div className="App">
       <SwaggerUI
         url="https://api-explorer.alfpro.net/swagger.json"
         requestInterceptor={request => {
          // request interceptor
          // add custom headers here
          request.headers.Authorization = `${jwt}`;
          return request;
        }}
        // responseInterceptor={response => {
        //   // request interceptor
        //   // add custom headers here
        //   response.headers['Access-Control-Allow-Origin'] = '*';
        //   return response;
        // }}
        />
     </div>
    );
  }
}

export default withAuthenticator(App, true);

