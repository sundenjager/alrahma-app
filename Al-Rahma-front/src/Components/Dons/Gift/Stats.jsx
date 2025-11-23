import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import './Stats.css';

const Stats = ({ dons }) => {
  // Calculate statistics
  const totalGifts = dons.length;
  const totalValue = dons.reduce((sum, don) => sum + (don.monetaryValue || 0), 0);
  const activeGifts = dons.filter(don => don.status === 'صالح').length;
  const inactiveGifts = dons.filter(don => don.status !== 'صالح').length;

  return (
    <Card className="stats-card mb-4 shadow-sm">
      <Card.Body>
        <Row>
          <Col xs={6} md={3} className="mb-3 mb-md-0">
            <div className="stat-box total-gifts">
              <h6>إجمالي الهبات</h6>
              <h3>{totalGifts}</h3>
            </div>
          </Col>
          <Col xs={6} md={3} className="mb-3 mb-md-0">
            <div className="stat-box total-value">
              <h6>القيمة الإجمالية</h6>
              <h3>{totalValue.toLocaleString()} د.ك</h3>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="stat-box active-gifts">
              <h6>الهبات النشطة</h6>
              <h3>{activeGifts}</h3>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="stat-box inactive-gifts">
              <h6>الهبات غير النشطة</h6>
              <h3>{inactiveGifts}</h3>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default Stats;