import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { 
  FaChartPie,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaCalendarTimes,
  FaClock,
  FaCoins,
  FaBoxOpen
} from 'react-icons/fa';

const TestamentStats = ({ testaments }) => {
  const calculateStats = () => {
    if (!testaments || testaments.length === 0) {
      return {
        total: 0,
        totalValue: 0,
        executed: 0,
        cancelled: 0,
        pending: 0,
        monetary: 0,
        inKind: 0,
        avgValue: 0
      };
    }

    const monetary = testaments.filter(t => t.donsType === 'نقدي');
    const inKind = testaments.filter(t => t.donsType === 'عيني');
    const totalValue = testaments.reduce((sum, t) => sum + (parseFloat(t.monetaryValue) || 0), 0);

    return {
      total: testaments.length,
      totalValue,
      executed: testaments.filter(t => t.testamentStatus === 'نفذت').length,
      cancelled: testaments.filter(t => t.testamentStatus === 'ملغاة').length,
      pending: testaments.filter(t => t.testamentStatus === 'قيد التنفيذ').length,
      monetary: monetary.length,
      inKind: inKind.length,
    };
  };

  const stats = calculateStats();

  return (
    <Row className="mb-4 g-3">
      {/* Total Testaments */}
      <Col md={2}>
        <Card className="h-100 border-0 shadow-sm">
          <Card.Body className="py-3">
            <div className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                <FaChartPie className="text-primary" size={20} />
              </div>
              <div>
                <h6 className="mb-1 text-muted">إجمالي الوصايا</h6>
                <h4 className="mb-0">{stats.total}</h4>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Total Value */}
      <Col md={3}>
        <Card className="h-100 border-0 shadow-sm">
          <Card.Body className="py-3">
            <div className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                <FaMoneyBillWave className="text-success" size={20} />
              </div>
              <div>
                <h6 className="mb-1 text-muted">إجمالي القيمة</h6>
                <h4 className="mb-0">{stats.totalValue.toLocaleString()} د.ت</h4>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Executed */}
      <Col md={2}>
        <Card className="h-100 border-0 shadow-sm">
          <Card.Body className="py-3">
            <div className="d-flex align-items-center">
              <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                <FaCalendarCheck className="text-info" size={20} />
              </div>
              <div>
                <h6 className="mb-1 text-muted">منفذة</h6>
                <h4 className="mb-0">{stats.executed}</h4>
                <Badge bg="info" className="mt-1">
                  {stats.total > 0 ? Math.round((stats.executed / stats.total) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Pending */}
      <Col md={2}>
        <Card className="h-100 border-0 shadow-sm">
          <Card.Body className="py-3">
            <div className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                <FaClock className="text-warning" size={20} />
              </div>
              <div>
                <h6 className="mb-1 text-muted">قيد التنفيذ</h6>
                <h4 className="mb-0">{stats.pending}</h4>
                <Badge bg="warning" className="mt-1">
                  {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Cancelled */}
      <Col md={2}>
        <Card className="h-100 border-0 shadow-sm">
          <Card.Body className="py-3">
            <div className="d-flex align-items-center">
              <div className="bg-danger bg-opacity-10 p-3 rounded me-3">
                <FaCalendarTimes className="text-danger" size={20} />
              </div>
              <div>
                <h6 className="mb-1 text-muted">ملغاة</h6>
                <h4 className="mb-0">{stats.cancelled}</h4>
                <Badge bg="danger" className="mt-1">
                  {stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};


export default TestamentStats;