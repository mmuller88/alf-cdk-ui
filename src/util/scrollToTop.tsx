import {Component} from 'react'
import { withRouter, RouteComponentProps } from 'react-router';

interface Props extends RouteComponentProps {      // custom properties passed to component
}

class ScrollToTop extends Component<Props> {
  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    return this.props.children
  }
}

export default withRouter(ScrollToTop)
