import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';
import asyncComponent from '../../util/asyncComponent';

// import Tests from './tests';
import ExtraPages from './extraPages';
// import ArztSeiten from './arzt';
// import VertragSeiten from './vertrag';
// import KlinikumSeiten from './klinikum';
// import KontoSeiten from './konto';
// import AdresseSeiten from './adresse';
// import AbrechnungsnummerSeiten from './abrechnungsnummer';
// import KlinikTitelSeiten from './klinikTitel';
// import ansprechpartnerInternSeiten from './ansprechpartnerIntern';
// import ansprechpartnerExternSeiten from './ansprechpartnerExtern';
// import DeveloperSeiten from './development';

const Routes = ({ match }) => (
  <Switch>
    <Route
      path={`${match.url}/welcome`}
      component={asyncComponent(() => import('./welcomePage'))} />

    <Route path={`${match.url}/extra-pages`} component={ExtraPages} />

    <Route
      component={asyncComponent(() => import('./extraPages/routes/404'))} />
    <Route
      path='/not-found'
      component={asyncComponent(() => import('./extraPages/routes/404'))} />
  </Switch>
);

export default withRouter(Routes);
