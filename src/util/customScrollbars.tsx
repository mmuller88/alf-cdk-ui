import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

const CustomScrollbars = (props) => <Scrollbars {...props} autoHide
  renderTrackHorizontal={
    props2 => <div {...props2} style={{ display: 'none' }} className='track-horizontal'/>
  }
/>;

export default CustomScrollbars;
