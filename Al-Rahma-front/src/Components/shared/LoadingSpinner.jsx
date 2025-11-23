import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = () => {
  return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">جاري التحميل...</span>
      </Spinner>
      <p className="mt-2">جاري التحميل، الرجاء الانتظار...</p>
    </div>
  );
};

export default LoadingSpinner;