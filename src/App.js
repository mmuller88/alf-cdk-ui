import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import SwaggerUI from 'swagger-ui';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify from 'aws-amplify';
import aws_exports from './aws-exports';
Amplify.configure(aws_exports);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      definitionLink: "https://api-explorer.h-o.dev/swagger.json",
    }
    // componentDidMount();
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
