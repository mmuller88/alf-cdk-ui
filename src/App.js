import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
// import SwaggerUI from 'swagger-ui';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify from 'aws-amplify';
import aws_exports from './aws-exports';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
Amplify.configure(aws_exports);

// export default App = () => <SwaggerUI url="https://api-explorer.h-o.dev/swagger.json" />


class App extends Component {

  componentDidMount() {
    fetch('/api/swaggerdefinition/'+this.props.match.params.id, {headers: { 'Authorization': 'JWT ' + window.sessionStorage.getItem('jwt') }}).then(r => r.json().then(data => {
      this.setState({swaggerSpecs: {...data}});
    }));
  }

  render() {
    return <SwaggerUI specs={this.state.swaggerSpecs} />
  }

  // constructor(props) {
  //   super(props);
  // }

  // componentDidMount() {
  //   SwaggerUI({
  //     domNode: document.getElementById("api-data"),
  //     url: "https://api-explorer.h-o.dev/swagger.json"
  //   })
  // }

  // render() {
  //   return (
  //     SwaggerUI({
        // domNode: document.getElementById("api-data"),
      //   url: "https://api-explorer.h-o.dev/swagger.json"
      // })
      // <div className="App">
      //   <div id="api-data" />
      // </div>
//     );
//   }
}

export default withAuthenticator(App = () => <SwaggerUI url="https://api-explorer.h-o.dev/swagger.json" />, true);
