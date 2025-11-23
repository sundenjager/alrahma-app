// src/Components/SearchBar.jsx
import React, { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const SearchBar = ({ searchFields, onSearch }) => {
  const [query, setQuery] = useState('');

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value, searchFields); // Pass query and search fields back to the parent
  };

  return (
    <InputGroup className="mb-3">
      <InputGroup.Text>
        <FaSearch />
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder="بحث..."
        value={query}
        onChange={handleInputChange}
      />
    </InputGroup>
  );
};

export default SearchBar;
