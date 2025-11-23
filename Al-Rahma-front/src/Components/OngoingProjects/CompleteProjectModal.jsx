import React from 'react';
import { Modal, Alert, Button, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const CompleteProjectModal = ({ 
  show, 
  onHide, 
  project, 
  onConfirm, 
  isLoading 
}) => {
  if (!project) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <FaCheckCircle className="me-2 text-success" />
          تأكيد إنجاز المشروع
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="lead">
          هل أنت متأكد من أنك تريد وضع المشروع{' '}
          <strong className="text-primary">{project.project}</strong> في حالة "تم الانجاز"؟
        </p>
        
        <Alert variant="warning" className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2 flex-shrink-0" />
          <div>
            <strong>ملاحظة:</strong> سيتم تحديث حالة المشروع وتاريخ الانتهاء ولا يمكن التراجع عن هذا الإجراء.
          </div>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <button 
          className="btn btn-secondary" 
          onClick={onHide}
          disabled={isLoading}
        >
          إلغاء
        </button>
        <button 
          className="btn btn-success" 
          onClick={() => onConfirm(project.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              جاري التحديث...
            </>
          ) : (
            <>
              <FaCheckCircle className="me-1" /> تأكيد الانجاز
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default CompleteProjectModal;