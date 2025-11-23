// components/SuggestedPrograms/ProgramsStats.js
import React from 'react';
import { Card, Row, Col, ProgressBar, Badge } from 'react-bootstrap';
import { 
  FaProjectDiagram, 
  FaMoneyBillWave, 
  FaUsers, 
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import './ProgramsStats.css';


const ProgramsStats = ({ programs, loading = false }) => {
  // Calculate statistics
  const calculateStats = () => {
    if (!programs || programs.length === 0) {
      return {
        totalPrograms: 0,
        totalBudget: 0,
        totalBeneficiaries: 0,
        statusCounts: {},
        fundingStatusCounts: {},
        averageBudget: 0,
        committeesCount: 0,
        currentYearPrograms: 0
      };
    }

    const currentYear = new Date().getFullYear();
    
    const statusCounts = programs.reduce((acc, program) => {
      const status = program.implementationStatus || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const fundingStatusCounts = programs.reduce((acc, program) => {
      const status = program.fundingStatus || 'pending_funding';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const totalBudget = programs.reduce((sum, program) => sum + (program.budget || 0), 0);
    const totalBeneficiaries = programs.reduce((sum, program) => sum + (program.beneficiariesCount || 0), 0);
    const committees = new Set(programs.map(p => p.committee).filter(Boolean));
    const currentYearPrograms = programs.filter(p => 
      p.startDate && new Date(p.startDate).getFullYear() === currentYear
    ).length;

    return {
      totalPrograms: programs.length,
      totalBudget,
      totalBeneficiaries,
      statusCounts,
      fundingStatusCounts,
      averageBudget: programs.length > 0 ? totalBudget / programs.length : 0,
      committeesCount: committees.size,
      currentYearPrograms
    };
  };

  const stats = calculateStats();
  
  // Status configuration
  const statusConfig = {
    pending: { label: 'قيد الانتظار', variant: 'secondary', icon: FaClock },
    approved: { label: 'مصادق عليه', variant: 'success', icon: FaCheckCircle },
    rejected: { label: 'مرفوض', variant: 'danger', icon: FaTimesCircle }
  };


  if (loading) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
          <p className="mt-3 text-muted">جاري تحميل الإحصائيات...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="programs-stats mb-4">
      <Row className="g-3">
        {/* Total Programs */}
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0 bg-gradient-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h4 className="mb-1">{stats.totalPrograms.toLocaleString('ar-TN')}</h4>
                <p className="mb-0 opacity-75">إجمالي البرامج</p>
              </div>
              <div className="flex-shrink-0">
                <FaProjectDiagram size={32} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Total Budget */}
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0 bg-gradient-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h4 className="mb-1">{stats.totalBudget.toLocaleString('ar-TN')} د.ت</h4>
                <p className="mb-0 opacity-75">إجمالي الميزانية</p>
              </div>
              <div className="flex-shrink-0">
                <FaMoneyBillWave size={32} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Total Beneficiaries */}
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0 bg-gradient-info text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h4 className="mb-1">{stats.totalBeneficiaries.toLocaleString('ar-TN')}</h4>
                <p className="mb-0 opacity-75">إجمالي المستفيدين</p>
              </div>
              <div className="flex-shrink-0">
                <FaUsers size={32} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Committees Count */}
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0 bg-gradient-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h4 className="mb-1">{stats.committeesCount}</h4>
                <p className="mb-0 opacity-75">عدد اللجان</p>
              </div>
              <div className="flex-shrink-0">
                <FaChartLine size={32} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Implementation Status Distribution */}
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0 d-flex align-items-center">
                <FaProjectDiagram className="me-2 text-primary" />
                توزيع حالات التنفيذ
              </h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = stats.statusCounts[status] || 0;
                const percentage = stats.totalPrograms > 0 ? (count / stats.totalPrograms) * 100 : 0;
                const IconComponent = config.icon;
                
                return (
                  <div key={status} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center">
                        <IconComponent className={`me-2 text-${config.variant}`} size={14} />
                        <span className="small">{config.label}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="small fw-semibold me-2">{count}</span>
                        <Badge bg={config.variant} className="fs-12">
                          {percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <ProgressBar 
                      variant={config.variant}
                      now={percentage}
                      className="mb-2"
                      style={{ height: '6px' }}
                    />
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </Col>


        {/* Additional Stats */}
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">معلومات إضافية</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <span className="small text-muted">متوسط الميزانية</span>
                <strong>{stats.averageBudget.toLocaleString('ar-TN', {maximumFractionDigits: 0})} د.ت</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <span className="small text-muted">برامج السنة الحالية</span>
                <strong>{stats.currentYearPrograms}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted">آخر تحديث</span>
                <strong>{new Date().toLocaleDateString('ar-TN')}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions Summary */}
        <Col md={8}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">ملخص سريع</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3 text-center">
                <Col md={4}>
                  <div className="p-3 bg-light rounded">
                    <div className="text-warning mb-2">
                      <FaClock size={24} />
                    </div>
                    <h5 className="mb-1">{stats.statusCounts.pending || 0}</h5>
                    <small className="text-muted">قيد المراجعة</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-light rounded">
                    <div className="text-success mb-2">
                      <FaCheckCircle size={24} />
                    </div>
                    <h5 className="mb-1">{(stats.statusCounts.approved || 0) + (stats.statusCounts.completed || 0)}</h5>
                    <small className="text-muted">مصادق/مكتمل</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-light rounded">
                    <div className="text-danger mb-2">
                      <FaTimesCircle size={24} />
                    </div>
                    <h5 className="mb-1">{stats.statusCounts.rejected || 0}</h5>
                    <small className="text-muted">مرفوض</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProgramsStats;