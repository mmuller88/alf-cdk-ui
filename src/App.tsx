import React, { Component } from 'react';
import './App.css';
import SwaggerUI from 'swagger-ui-react';
// tslint:disable-next-line: no-submodule-imports
import 'swagger-ui-react/swagger-ui.css';
import { withAuthenticator } from 'aws-amplify-react';
import Amplify, { Auth } from 'aws-amplify';
import aws_exports from './aws-exports';

// import { Configuration, InstancesConfApi } from 'alf-cdk/tslib/lib';

declare const window: any;

Amplify.configure(aws_exports);

let jwt = 'no';
let jwt2 = 'no2';
let userName: string;

class App extends Component {
  constructor(props: any) {
    super(props);

    Auth.currentAuthenticatedUser({
      bypassCache: false, // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
    }).then(authUser =>{
      // console.log(authUser)
      userName = authUser.username;
      jwt = authUser.signInUserSession.idToken.jwtToken;
      console.log(userName);
      console.log(`jwt2: ${jwt}`);
    }).catch(err => console.log(err));

    Auth.currentSession().then(res=>{
      const accessToken = res.getAccessToken();
      jwt2 = accessToken.getJwtToken();
      // You can print them to see the full objects
      // tslint:disable-next-line: no-console
      console.log(`myAccessToken: ${JSON.stringify(accessToken)}`);
      // tslint:disable-next-line: no-console
      console.log(`myJwt: ${jwt2}`);

      // const config = new Configuration({
      //   accessToken: jwt,
      //   basePath: window.ENV.API_URL || '', // 'https://api.alfpro.net'
      // });

      // const api = new InstancesConfApi(config);

      // api.getInstanceConfs(undefined, {
      //   headers: {
      //     Authorization: jwt
      //   }
      // }).then(succeeded => {
      //   // tslint:disable-next-line: no-console
      //   console.log(`getInstanceConfs succeeded`);
      //   succeeded.data.forEach(instanceConf => {
      //     // instanceConf.alfInstanceId
      //     // tslint:disable-next-line: no-console
      //     console.log(`instanceConf: ${JSON.stringify(instanceConf)}`)
      //   })
      // })
    }).catch(err => console.log(err));
  }

  render() {
    return (
      <div className='App'>
        <SwaggerUI
          //  http://openapi.alfpro.net.s3-website-us-east-1.amazonaws.com/swagger.json
          // url={`https://openapi${window.ENV.STAGE === 'dev'?'.dev.':'.'}alfpro.net/swagger.json`}
          url={'openapi.json'}
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

