// components/SuggestedPrograms/ProgramsFilter.js
import React from 'react';
import { Form, Row, Col, Button, Card } from 'react-bootstrap';
import { FaFilter, FaSearch, FaSync } from 'react-icons/fa';

const ProgramsFilter = ({ 
  filters, 
  onFilterChange, 
  onReset,
  committees, 
  years,
  loading = false 
}) => {
  const handleInputChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <h6 className="mb-0 d-flex align-items-center">
          <FaFilter className="me-2 text-primary" />
          تصفية البرامج
        </h6>
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={handleReset}
          disabled={loading}
        >
          <FaSync className="me-1" />
          إعادة تعيين
        </Button>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          {/* Committee Filter */}
          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold">اللجنة</Form.Label>
              <Form.Select 
                value={filters.committee || ''}
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
          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold">السنة</Form.Label>
              <Form.Select 
                value={filters.year || ''}
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

          {/* Status Filter */}
          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold">حالة التنفيذ</Form.Label>
              <Form.Select 
                value={filters.implementationStatus || ''}
                onChange={(e) => handleInputChange('implementationStatus', e.target.value)}
                disabled={loading}
              >
                <option value="">جميع الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="planned">قيد التخطيط</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتمل</option>
                <option value="on_hold">متوقف</option>
                <option value="cancelled">ملغى</option>
                <option value="approved">مصادق عليه</option>
                <option value="rejected">مرفوض</option>
              </Form.Select>
            </Form.Group>
          </Col>


          {/* Search by Project Name */}
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold">بحث باسم المشروع</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="اكتب اسم المشروع للبحث..."
                  value={filters.search || ''}
                  onChange={(e) => handleInputChange('search', e.target.value)}
                  disabled={loading}
                />
                <FaSearch className="position-absolute top-50 end-3 translate-middle-y text-muted" />
              </div>
            </Form.Group>
          </Col>

          {/* Budget Range */}
          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold">الميزانية من</Form.Label>
              <Form.Control
                type="number"
                placeholder="0"
                value={filters.minBudget || ''}
                onChange={(e) => handleInputChange('minBudget', e.target.value)}
                disabled={loading}
                min="0"
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold">الميزانية إلى</Form.Label>
              <Form.Control
                type="number"
                placeholder="أقصى قيمة"
                value={filters.maxBudget || ''}
                onChange={(e) => handleInputChange('maxBudget', e.target.value)}
                disabled={loading}
                min="0"
              />
            </Form.Group>
          </Col>

          {/* Date Range */}
          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold">من تاريخ</Form.Label>
              <Form.Control
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                disabled={loading}
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold">إلى تاريخ</Form.Label>
              <Form.Control
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                disabled={loading}
              />
            </Form.Group>
          </Col>

          {/* Beneficiaries Count */}
          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold">عدد المستفيدين من</Form.Label>
              <Form.Control
                type="number"
                placeholder="0"
                value={filters.minBeneficiaries || ''}
                onChange={(e) => handleInputChange('minBeneficiaries', e.target.value)}
                disabled={loading}
                min="0"
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold">عدد المستفيدين إلى</Form.Label>
              <Form.Control
                type="number"
                placeholder="أقصى عدد"
                value={filters.maxBeneficiaries || ''}
                onChange={(e) => handleInputChange('maxBeneficiaries', e.target.value)}
                disabled={loading}
                min="0"
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Active Filters Badges */}
        {(filters.search || filters.minBudget || filters.maxBudget || 
          filters.startDate || filters.endDate || filters.committee !== '' || 
          filters.year !== '' || filters.implementationStatus !== '' || 
          filters.fundingStatus !== '') && (
          <div className="mt-3 pt-3 border-top">
            <small className="text-muted d-block mb-2">التصفيات النشطة:</small>
            <div className="d-flex flex-wrap gap-2">
              {filters.search && (
                <span className="badge bg-primary">
                  بحث: {filters.search}
                  <button 
                    className="btn-close btn-close-white ms-1" 
                    style={{fontSize: '0.6rem'}}
                    onClick={() => handleInputChange('search', '')}
                  ></button>
                </span>
              )}
              {filters.committee && (
                <span className="badge bg-secondary">
                  لجنة: {filters.committee}
                  <button 
                    className="btn-close btn-close-white ms-1" 
                    style={{fontSize: '0.6rem'}}
                    onClick={() => handleInputChange('committee', '')}
                  ></button>
                </span>
              )}
              {filters.year && (
                <span className="badge bg-info text-dark">
                  سنة: {filters.year}
                  <button 
                    className="btn-close ms-1" 
                    style={{fontSize: '0.6rem'}}
                    onClick={() => handleInputChange('year', '')}
                  ></button>
                </span>
              )}
              {filters.implementationStatus && (
                <span className="badge bg-warning text-dark">
                  حالة: {filters.implementationStatus}
                  <button 
                    className="btn-close ms-1" 
                    style={{fontSize: '0.6rem'}}
                    onClick={() => handleInputChange('implementationStatus', '')}
                  ></button>
                </span>
              )}
              {/* Add more filter badges as needed */}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProgramsFilter;