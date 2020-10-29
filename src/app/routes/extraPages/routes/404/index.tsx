import * as React from 'react';
import { Button } from '@material-ui/core';

const Error404 = () => (
  <div className='app-wrapper page-error-container animated slideInUpTiny animation-duration-3'>
    <div className='page-error-content'>
      <div className='error-code mb-4 animated zoomInDown'>404</div>
      <h2 className='text-center fw-regular title bounceIn animation-delay-10 animated'>
        Diese Seite wurde leider nicht gefunden.
      </h2>
      <p className='text-center zoomIn animation-delay-20 animated'>
        <Button variant={'contained'} color={'secondary'} size={'large'}>
          Zurück zur Startseite
        </Button>
      </p>
    </div>
  </div>
);

export default Error404;
