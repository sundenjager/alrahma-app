import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const WaitingListForm = ({ show, handleClose, handleSubmit }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [reason, setReason] = useState('');

  const resetForm = () => {
    setName('');
    setDate('');
    setPhone('');
    setAddress('');
    setReason('');
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit({
      name,
      date,
      phone,
      address,
      reason
    });
    resetForm();
  };

  const onClose = () => {
    handleClose();
    resetForm();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>إضافة جديد إلى قائمة الانتظار</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>الاسم</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>التاريخ</Form.Label>
                <Form.Control
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>رقم الهاتف</Form.Label>
                <Form.Control
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>العنوان</Form.Label>
                <Form.Control
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>السبب</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit">
            إضافة
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default WaitingListForm;