// components/FinishedProjects/FinishedProjectsFilter.js
import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Card, Offcanvas, Stack, Badge } from 'react-bootstrap';
import { FaFilter, FaSearch, FaSync, FaCalendarAlt, FaUsers, FaMoneyBillWave, FaTimes, FaShoppingCart, FaHandHoldingHeart } from 'react-icons/fa';

const FinishedProjectsFilter = ({ 
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
  useEffect(() => {
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
      minBudget: '',
      maxBudget: '',
      startDate: '',
      endDate: '',
      minBeneficiaries: '',
      maxBeneficiaries: '',
      minAidValue: '',
      maxAidValue: '',
      minPurchaseValue: '',
      maxPurchaseValue: '',
      minDonationValue: '',
      maxDonationValue: ''
    };
    setLocalFilters(resetFilters);
    onReset();
    setShowFilters(false);
  };

  const removeFilter = (filterKey) => {
    const newFilters = { ...localFilters, [filterKey]: '' };
    setLocalFilters(newFilters);
    onApply(newFilters);
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
        className="d-flex align-items-center"
      >
        <FaFilter className="me-1" />
        تصفية
        {hasActiveFilters && (
          <Badge bg="light" text="dark" className="ms-1">
            {Object.values(filters).filter(f => f !== '').length}
          </Badge>
        )}
      </Button>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-2">
          <small className="text-muted d-block mb-1">التصفيات النشطة:</small>
          <div className="d-flex flex-wrap gap-1">
            {filters.search && (
              <Badge bg="primary" className="d-flex align-items-center">
                بحث: {filters.search}
                <FaTimes 
                  className="ms-1 cursor-pointer" 
                  size={10}
                  onClick={() => removeFilter('search')}
                />
              </Badge>
            )}
            {filters.committee && (
              <Badge bg="secondary" className="d-flex align-items-center">
                لجنة: {filters.committee}
                <FaTimes 
                  className="ms-1 cursor-pointer" 
                  size={10}
                  onClick={() => removeFilter('committee')}
                />
              </Badge>
            )}
            {filters.year && (
              <Badge bg="info" text="dark" className="d-flex align-items-center">
                سنة: {filters.year}
                <FaTimes 
                  className="ms-1 cursor-pointer" 
                  size={10}
                  onClick={() => removeFilter('year')}
                />
              </Badge>
            )}
            {(filters.minBudget || filters.maxBudget) && (
              <Badge bg="warning" text="dark" className="d-flex align-items-center">
                ميزانية: {filters.minBudget || '0'} - {filters.maxBudget || '∞'}
                <FaTimes 
                  className="ms-1 cursor-pointer" 
                  size={10}
                  onClick={() => {
                    removeFilter('minBudget');
                    removeFilter('maxBudget');
                  }}
                />
              </Badge>
            )}
            {(filters.minAidValue || filters.maxAidValue) && (
              <Badge bg="success" className="d-flex align-items-center">
                مساعدات: {filters.minAidValue || '0'} - {filters.maxAidValue || '∞'}
                <FaTimes 
                  className="ms-1 cursor-pointer" 
                  size={10}
                  onClick={() => {
                    removeFilter('minAidValue');
                    removeFilter('maxAidValue');
                  }}
                />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Filters Offcanvas */}
      <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="end" style={{ width: '450px' }}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="d-flex align-items-center">
            <FaFilter className="me-2 text-primary" />
            تصفية المشاريع المنجزة
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
              <Col md={12}>
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
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <FaCalendarAlt className="me-1" />
                    سنة الانتهاء
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

              {/* Aid Value Range */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-success">
                    <FaMoneyBillWave className="me-1" />
                    قيمة المساعدات من
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={localFilters.minAidValue || ''}
                    onChange={(e) => handleInputChange('minAidValue', e.target.value)}
                    disabled={loading}
                    min="0"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-success">قيمة المساعدات إلى</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="أقصى قيمة"
                    value={localFilters.maxAidValue || ''}
                    onChange={(e) => handleInputChange('maxAidValue', e.target.value)}
                    disabled={loading}
                    min="0"
                  />
                </Form.Group>
              </Col>

              {/* Purchase Value Range */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-warning">
                    <FaShoppingCart className="me-1" />
                    قيمة المشتريات من
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={localFilters.minPurchaseValue || ''}
                    onChange={(e) => handleInputChange('minPurchaseValue', e.target.value)}
                    disabled={loading}
                    min="0"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-warning">قيمة المشتريات إلى</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="أقصى قيمة"
                    value={localFilters.maxPurchaseValue || ''}
                    onChange={(e) => handleInputChange('maxPurchaseValue', e.target.value)}
                    disabled={loading}
                    min="0"
                  />
                </Form.Group>
              </Col>

              {/* Donation Value Range */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-info">
                    <FaHandHoldingHeart className="me-1" />
                    قيمة التبرعات من
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={localFilters.minDonationValue || ''}
                    onChange={(e) => handleInputChange('minDonationValue', e.target.value)}
                    disabled={loading}
                    min="0"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-info">قيمة التبرعات إلى</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="أقصى قيمة"
                    value={localFilters.maxDonationValue || ''}
                    onChange={(e) => handleInputChange('maxDonationValue', e.target.value)}
                    disabled={loading}
                    min="0"
                  />
                </Form.Group>
              </Col>

              {/* Date Range */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">من تاريخ الانتهاء</Form.Label>
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
                  <Form.Label className="fw-semibold">إلى تاريخ الانتهاء</Form.Label>
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

            {/* Action Buttons */}
            <div className="mt-auto pt-3 border-top">
              <Stack direction="horizontal" gap={2} className="justify-content-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={handleReset}
                  disabled={loading}
                  className="d-flex align-items-center"
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

export default FinishedProjectsFilter;