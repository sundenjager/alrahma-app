// components/OngoingProjects/ProjectFilters.js
import React, { useState } from 'react';
import { Form, Row, Col, Button, Card, Offcanvas, Stack } from 'react-bootstrap';
import { FaFilter, FaSearch, FaSync, FaCalendarAlt, FaUsers, FaMoneyBillWave } from 'react-icons/fa';

const ProjectFilters = ({ 
  filters, 
  onApply, 
  onReset,
  committees = [],
  years = [],
  loading = false 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Initialize local filters when props change
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleInputChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    setShowFilters(false);
  };

  const handleReset = () => {
    const resetFilters = {
      committee: '',
      year: '',
      search: '',
      implementationStatus: '',
      fundingStatus: '',
      minBudget: '',
      maxBudget: '',
      startDate: '',
      endDate: '',
      minBeneficiaries: '',
      maxBeneficiaries: ''
    };
    setLocalFilters(resetFilters);
    onReset();
    setShowFilters(false);
  };

  const hasActiveFilters = Object.values(filters).some(filter => 
    filter !== '' && filter !== null && filter !== undefined
  );

  return (
    <>
      {/* Filter Button with Badge */}
      <Button 
        variant={hasActiveFilters ? "primary" : "outline-primary"}
        onClick={() => setShowFilters(true)}
        disabled={loading}
      >
        <FaFilter className="me-1" />
        تصفية
        {hasActiveFilters && (
          <span className="ms-1 badge bg-light text-dark">
            {Object.values(filters).filter(f => f !== '').length}
          </span>
        )}
      </Button>

      {/* Filters Offcanvas */}
      <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="end">
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="d-flex align-items-center">
            <FaFilter className="me-2 text-primary" />
            تصفية المشاريع الجارية
          </Offcanvas.Title>
        </Offcanvas.Header>
        
        <Offcanvas.Body>
          <div className="d-flex flex-column h-100">
            {/* Search Filter */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                <FaSearch className="me-2" />
                بحث باسم المشروع
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="اكتب اسم المشروع للبحث..."
                value={localFilters.search || ''}
                onChange={(e) => handleInputChange('search', e.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Row className="g-3">
              {/* Committee Filter */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">اللجنة</Form.Label>
                  <Form.Select 
                    value={localFilters.committee || ''}
                    onChange={(e) => handleInputChange('committee', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">جميع اللجان</option>
                    {committees.map(committee => (
                      <option key={committee} value={committee}>
                        {committee}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Year Filter */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <FaCalendarAlt className="me-1" />
                    السنة
                  </Form.Label>
                  <Form.Select 
                    value={localFilters.year || ''}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">جميع السنوات</option>
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Budget Range */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">الميزانية من</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={localFilters.minBudget || ''}
                    onChange={(e) => handleInputChange('minBudget', e.target.value)}
                    disabled={loading}
                    min="0"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">الميزانية إلى</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="أقصى قيمة"
                    value={localFilters.maxBudget || ''}
                    onChange={(e) => handleInputChange('maxBudget', e.target.value)}
                    disabled={loading}
                    min="0"
                  />
                </Form.Group>
              </Col>

              {/* Date Range */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">من تاريخ</Form.Label>
                  <Form.Control
                    type="date"
                    value={localFilters.startDate || ''}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">إلى تاريخ</Form.Label>
                  <Form.Control
                    type="date"
                    value={localFilters.endDate || ''}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>

              {/* Beneficiaries Count */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <FaUsers className="me-1" />
                    عدد المستفيدين من
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={localFilters.minBeneficiaries || ''}
                    onChange={(e) => handleInputChange('minBeneficiaries', e.target.value)}
                    disabled={loading}
                    min="0"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">عدد المستفيدين إلى</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="أقصى عدد"
                    value={localFilters.maxBeneficiaries || ''}
                    onChange={(e) => handleInputChange('maxBeneficiaries', e.target.value)}
                    disabled={loading}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <Card className="mt-3 border-warning">
                <Card.Header className="bg-warning bg-opacity-10 py-2">
                  <small className="fw-semibold">التصفيات النشطة:</small>
                </Card.Header>
                <Card.Body className="py-2">
                  <div className="d-flex flex-wrap gap-1">
                    {filters.search && (
                      <span className="badge bg-primary">
                        بحث: {filters.search}
                      </span>
                    )}
                    {filters.committee && (
                      <span className="badge bg-secondary">
                        لجنة: {filters.committee}
                      </span>
                    )}
                    {filters.year && (
                      <span className="badge bg-info text-dark">
                        سنة: {filters.year}
                      </span>
                    )}
                    {/* Add more filter badges as needed */}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="mt-auto pt-3 border-top">
              <Stack direction="horizontal" gap={2} className="justify-content-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={handleReset}
                  disabled={loading}
                >
                  <FaSync className="me-1" />
                  إعادة تعيين
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleApply}
                  disabled={loading}
                >
                  تطبيق التصفيات
                </Button>
              </Stack>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default ProjectFilters;