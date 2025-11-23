import React from 'react';
import { Form } from 'react-bootstrap';
import { FaFileAlt } from 'react-icons/fa';

const DocumentsSection = ({
  formData,
  handleFileChange,
  errors
}) => {
  return (
    <div className="form-section">
      <h5 className="section-title mb-3">المستندات</h5>
      <Form.Group controlId="document">
        <Form.Label>مستند المداولة (PDF)</Form.Label>
        <Form.Control 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange} 
          isInvalid={!!errors?.document}
        />
        <Form.Control.Feedback type="invalid">
          {errors?.document}
        </Form.Control.Feedback>
        {formData.document && (
          <div className="file-preview mt-2 d-flex align-items-center">
            <FaFileAlt className="me-2" />
            <span>{formData.document.name}</span>
          </div>
        )}
      </Form.Group>
    </div>
  );
};

export default DocumentsSection;