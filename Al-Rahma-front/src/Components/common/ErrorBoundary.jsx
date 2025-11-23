import React from 'react';
import { Alert, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container my-5">
          <Alert variant="danger">
            <Alert.Heading>حدث خطأ!</Alert.Heading>
            <p>{this.state.error.message}</p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button onClick={this.handleReset} variant="outline-danger">
                حاول مرة أخرى
              </Button>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;