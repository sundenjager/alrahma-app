// AttendeesModal.jsx
import React from 'react';
import { Modal, ListGroup } from 'react-bootstrap';

const AttendeesModal = ({ show, onHide, attendees }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>قائمة الحضور</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup>
          {attendees.map((attendee, index) => (
            <ListGroup.Item key={index}>{attendee}</ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
};

export default AttendeesModal;