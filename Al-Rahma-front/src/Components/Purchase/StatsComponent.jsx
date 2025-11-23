import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FaMoneyBillWave, FaBoxOpen, FaCheckCircle, FaTimesCircle, FaCoins, FaBox } from 'react-icons/fa';
import './StatsComponent.css';

const StatsComponent = ({ purchases }) => {
  // Calculate statistics
  const totalPurchases = purchases?.length || 0;

  
  const totalMonetaryValue = purchases?.reduce((sum, d) => sum + d.monetaryValue, 0) || 0;
  const validValue = purchases?.filter(d => d.status === 'صالح').reduce((sum, d) => sum + d.monetaryValue, 0) || 0;
  const invalidValue = purchases?.filter(d => d.status === 'غير صالح').reduce((sum, d) => sum + d.monetaryValue, 0) || 0;

  return (
    <Card className="stats-card mb-4">
      <Card.Header className="stats-header">
        <h5>إحصائيات الشرائات</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box total-purchases">
              <h6>إجمالي الشرائات</h6>
              <p className="stat-value">{totalPurchases}</p>
              <p className="stat-subvalue">{totalMonetaryValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default StatsComponent;