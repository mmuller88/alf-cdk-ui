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

export default App = () => <SwaggerUI url="https://petstore.swagger.io/v2/swagger.json" />

// export default withAuthenticator(App, true);
