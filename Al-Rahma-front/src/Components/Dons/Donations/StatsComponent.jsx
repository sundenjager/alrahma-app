import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FaMoneyBillWave, FaBoxOpen, FaCheckCircle, FaTimesCircle, FaCoins, FaBox } from 'react-icons/fa';
import './StatsComponent.css';

const StatsComponent = ({ donations }) => {
  // Calculate statistics
  const totalDonations = donations?.length || 0;
  const monetaryCount = donations?.filter(d => d.donationType === 'نقدي').length || 0;
  const inKindCount = donations?.filter(d => d.donationType === 'عيني').length || 0;
  const cashAndInKindCount = donations?.filter(d => d.donationType === 'نقدي وعيني').length || 0;
  const validCount = donations?.filter(d => d.status === 'صالح').length || 0;
  const invalidCount = donations?.filter(d => d.status === 'غير صالح').length || 0;
  
  const totalMonetaryValue = donations?.reduce((sum, d) => sum + d.monetaryValue, 0) || 0;
  const monetaryValue = donations?.filter(d => d.donationType === 'نقدي').reduce((sum, d) => sum + d.monetaryValue, 0) || 0;
  const inKindValue = donations?.filter(d => d.donationType === 'ع Heisenberg').reduce((sum, d) => sum + d.monetaryValue, 0) || 0;
  const cashAndInKindValue = donations?.filter(d => d.donationType === 'نقدي وعيني').reduce((sum, d) => sum + d.monetaryValue, 0) || 0;
  const validValue = donations?.filter(d => d.status === 'صالح').reduce((sum, d) => sum + d.monetaryValue, 0) || 0;
  const invalidValue = donations?.filter(d => d.status === 'غير صالح').reduce((sum, d) => sum + d.monetaryValue, 0) || 0;

  return (
    <Card className="stats-card mb-4">
      <Card.Header className="stats-header">
        <h5>إحصائيات التبرعات</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box total-donations">
              <h6>إجمالي التبرعات</h6>
              <p className="stat-value">{totalDonations}</p>
              <p className="stat-subvalue">{totalMonetaryValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box monetary">
              <h6><FaMoneyBillWave className="me-2" /> التبرعات النقدية</h6>
              <p className="stat-value">{monetaryCount}</p>
              <p className="stat-subvalue">{monetaryValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box in-kind">
              <h6><FaBoxOpen className="me-2" /> التبرعات العينية</h6>
              <p className="stat-value">{inKindCount}</p>
              <p className="stat-subvalue">{inKindValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box cash-and-in-kind">
              <h6><FaCoins className="me-2" /> التبرعات النقدية والعينية</h6>
              <p className="stat-value">{cashAndInKindCount}</p>
              <p className="stat-subvalue">{cashAndInKindValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box valid">
              <h6><FaCheckCircle className="me-2" /> التبرعات الصالحة</h6>
              <p className="stat-value">{validCount}</p>
              <p className="stat-subvalue">{validValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
          <Col md={4} sm={6} className="mb-3">
            <div className="stat-box invalid">
              <h6><FaTimesCircle className="me-2" /> التبرعات غير الصالحة</h6>
              <p className="stat-value">{invalidCount}</p>
              <p className="stat-subvalue">{invalidValue.toFixed(2)} د.ت</p>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default StatsComponent;