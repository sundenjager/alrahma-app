import React from 'react';
import { Modal, Button, Badge, Row, Col } from 'react-bootstrap';
import moment from 'moment';
import '../styles/dispatch.css'; // We'll create this CSS file

const DispatchDetailsModal = ({ show, onHide, dispatch }) => {
  if (!dispatch) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="details-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          تفاصيل الإعارة #{dispatch.id}
          <Badge bg={dispatch.returnDate ? "success" : "warning"} className="ms-2">
            {dispatch.returnDate ? "مكتمل" : "قيد التنفيذ"}
          </Badge>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="details-container">
          <Row className="mb-3">
            <Col md={6}>
              <div className="detail-item">
                <h6>المستفيد</h6>
                <p>{dispatch.beneficiary}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="detail-item">
                <h6>هاتف المستفيد</h6>
                <p>{dispatch.patientPhone}</p>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <div className="detail-item">
                <h6>بطاقة تعريف المستفيد</h6>
                <p>{dispatch.patientCIN}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="detail-item">
                <h6>المنسق</h6>
                <p>{dispatch.coordinator}</p>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <div className="detail-item">
                <h6>الشخص المسؤول</h6>
                <p>{dispatch.responsiblePerson}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="detail-item">
                <h6>هاتف المسؤول</h6>
                <p>{dispatch.responsiblePersonPhone}</p>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <div className="detail-item">
                <h6>بطاقة تعريف المسؤول</h6>
                <p>{dispatch.responsiblePersonCIN}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="detail-item">
                <h6>تاريخ الإعارة</h6>
                <p>{moment(dispatch.dispatchDate).format('DD MMM YYYY')}</p>
              </div>
            </Col>
          </Row>

          {dispatch.returnDate && (
            <Row className="mb-3">
              <Col md={6}>
                <div className="detail-item">
                  <h6>تاريخ الإرجاع</h6>
                  <p>{moment(dispatch.returnDate).format('DD MMM YYYY')}</p>
                </div>
              </Col>
              <Col md={6}>
                <div className="detail-item">
                  <h6>ملاحظات الإرجاع</h6>
                  <p>{dispatch.returnNotes || 'لا توجد ملاحظات'}</p>
                </div>
              </Col>
            </Row>
          )}

          <Row className="mb-3">
            <Col md={6}>
              <div className="detail-item">
                <h6>المعدات الطبية</h6>
                <p>{dispatch.equipmentReference} (ID: {dispatch.medicalEquipmentId})</p>
                {dispatch.medicalEquipment && (
                  <>
                    <p className="text-muted small">الماركة: {dispatch.medicalEquipment.brand}</p>
                    <p className="text-muted small">الفئة: {dispatch.medicalEquipment.category}</p>
                    <p className="text-muted small">الحالة: {dispatch.medicalEquipment.status}</p>
                  </>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div className="detail-item">
                <h6>ملاحظات</h6>
                <p>{dispatch.notes || 'لا توجد ملاحظات'}</p>
              </div>
            </Col>
          </Row>

          {dispatch.PDFFilePath && (
            <Row className="mb-3">
              <Col>
                <div className="detail-item">
                  <h6>ملف PDF</h6>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => window.open(dispatch.PDFFilePath, '_blank')}
                  >
                    عرض ملف الإعارة
                  </Button>
                </div>
              </Col>
            </Row>
          )}

          {dispatch.medicalEquipment?.description && (
            <Row className="mb-3">
              <Col>
                <div className="detail-item">
                  <h6>وصف المعدات</h6>
                  <p className="description-text">{dispatch.medicalEquipment.description}</p>
                </div>
              </Col>
            </Row>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          إغلاق
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DispatchDetailsModal;