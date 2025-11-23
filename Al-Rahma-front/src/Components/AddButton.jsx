// src/Components/AddButton.jsx
import React from 'react';
import { Button } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import '../App.css';

const AddButton = ({ handleAdd }) => {
  return (
    <Button
      variant="success"
      onClick={handleAdd}
      className="wave-button"
    >
      <FaPlus />
    </Button>
  );
};

export default AddButton;
