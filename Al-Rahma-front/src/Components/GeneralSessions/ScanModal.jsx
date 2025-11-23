import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ScanModal = ({ show, onHide, title, onComplete, loading }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('حجم الملف يجب أن يكون أقل من 5MB');
      } else {
        setFile(selectedFile);
        setError('');
      }
    }
  };

  const handleSubmit = () => {
    if (!file) {
      setError('يرجى اختيار ملف');
      return;
    }
    onComplete(file);
    setFile(null);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>اختر ملف:</Form.Label>
            <Form.Control 
              type="file" 
              onChange={handleFileChange} 
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {file && (
              <div className="mt-2">
                <small>الملف المحدد: {file.name}</small>
              </div>
            )}
            {error && <div className="text-danger small mt-2">{error}</div>}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          إلغاء
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'جاري التحميل...' : 'حفظ'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ScanModal;