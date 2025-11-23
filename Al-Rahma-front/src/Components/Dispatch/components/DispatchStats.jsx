import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FaBoxes, FaClock, FaCheckCircle } from 'react-icons/fa';

const DispatchStats = ({ total, ongoing, completed }) => {
  return (
    <Row className="dispatch-stats">
      <Col md={4}>
        <Card className="stat-card total">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="stat-title">إجمالي الإعارات</h6>
                <h3 className="stat-value">{total}</h3>
              </div>
              <div className="stat-icon">
                <FaBoxes />
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={4}>
        <Card className="stat-card ongoing">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="stat-title">قيد التنفيذ</h6>
                <h3 className="stat-value">{ongoing}</h3>
              </div>
              <div className="stat-icon">
                <FaClock />
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={4}>
        <Card className="stat-card completed">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="stat-title">مكتمل</h6>
                <h3 className="stat-value">{completed}</h3>
              </div>
              <div className="stat-icon">
                <FaCheckCircle />
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default DispatchStats;