import React from "react";
import ReactDOM from "react-dom";

import "swagger-ui-react/swagger-ui.css";
import App from './App';

// function App() {
//   return (
//     <div className="App">
//       <SwaggerUI
//         url="https://api.mna.dev.spsapps.net/swagger/?format=openapi"
//         responseInterceptor={response => {
//           if (response.status === 200) {
//             console.log(response.data);
//           }
//         }}
//       />
//     </div>
//   );
// }

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
