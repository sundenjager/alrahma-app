// src/Components/common/NotFound.jsx
import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center mt-5">
      <h1>404 - Page Not Found</h1>
      <p>The page you requested doesn't exist.</p>
      <Button variant="primary" onClick={() => navigate('/')}>
        Return Home
      </Button>
    </div>
  );
};

// Add this line to provide default export
export default NotFound;