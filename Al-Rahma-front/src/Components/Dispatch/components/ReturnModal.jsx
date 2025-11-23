import React, { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

const ReturnModal = ({ show, onHide, onSubmit, isLoading }) => {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnNotes, setReturnNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(returnDate, returnNotes);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>تسجيل عودة المعدات</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>تاريخ العودة</Form.Label>
            <Form.Control
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>ملاحظات العودة</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="أدخل أي ملاحظات حول حالة المعدات عند العودة"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isLoading}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" />
                <span className="ms-2">جاري الحفظ...</span>
              </>
            ) : (
              'تسجيل العودة'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReturnModal;