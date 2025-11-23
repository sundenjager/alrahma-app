import React from 'react';
import Alert from 'react-bootstrap/Alert';

const ErrorAlert = ({ message, onClose }) => {
  return (
    <Alert variant="danger" dismissible onClose={onClose}>
      <Alert.Heading>خطأ!</Alert.Heading>
      <p>{message || 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.'}</p>
    </Alert>
  );
};

export default ErrorAlert;