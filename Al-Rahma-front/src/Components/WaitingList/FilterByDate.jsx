import React from 'react';
import { Form } from 'react-bootstrap';

const FilterByDate = ({ onFilterChange }) => {
  return (
    <Form.Group>
      <Form.Label>تصفية حسب التاريخ</Form.Label>
      <Form.Control
        type="date"
        onChange={(e) => onFilterChange(e.target.value)}
      />
    </Form.Group>
  );
};

export default FilterByDate;