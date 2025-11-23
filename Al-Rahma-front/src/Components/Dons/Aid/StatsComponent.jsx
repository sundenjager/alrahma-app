import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FaMoneyBillWave, FaBoxOpen, FaCheckCircle, FaTimesCircle, FaCoins, FaBox } from 'react-icons/fa';
import './StatsComponent.css';

const StatsComponent = ({ aid }) => {
  // Calculate statistics
  const totalAids = aid?.length || 0;
  const monetaryCount = aid?.filter(d => d.aidType === 'نقدي').length || 0;
  const inKindCount = aid?.filter(d => d.aidType === 'عيني').length || 0;
  const cashAndInKindCount = aid?.filter(d => d.aidType === 'نقدي وعيني').length || 0;

  
  const totalMonetaryValue = aid?.reduce((sum, d) => sum + d.monetaryValue, 0) || 0;
  const monetaryValue = aid?.filter(d => d.aidType === 'نقدي').reduce((sum, d) => sum + d.monetaryValue, 0) || 0;
  const inKindValue = aid?.filter(d => d.aidType === 'عيني').reduce((sum, d) => sum + d.monetaryValue, 0) || 0;
  const cashAndInKindValue = aid?.filter(d => d.aidType === 'نقدي وعيني').reduce((sum, d) => sum + d.monetaryValue, 0) || 0;

  
  return (
    <Card className="stats-card mb-4">
      <Card.Header className="stats-header">
        <h5>إحصائيات المساعدات</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box total-aids">
              <h6>إجمالي المساعدات</h6>
              <p className="stat-value">{totalAids}</p>
              <p className="stat-subvalue">{totalMonetaryValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box monetary">
              <h6><FaMoneyBillWave className="me-2" /> المساعدات النقدية</h6>
              <p className="stat-value">{monetaryCount}</p>
              <p className="stat-subvalue">{monetaryValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box in-kind">
              <h6><FaBoxOpen className="me-2" /> المساعدات العينية</h6>
              <p className="stat-value">{inKindCount}</p>
              <p className="stat-subvalue">{inKindValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box cash-and-in-kind">
              <h6><FaCoins className="me-2" /> المساعدات النقدية والعينية</h6>
              <p className="stat-value">{cashAndInKindCount}</p>
              <p className="stat-subvalue">{cashAndInKindValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
          
        </Row>
      </Card.Body>
    </Card>
  );
};

export default StatsComponent;