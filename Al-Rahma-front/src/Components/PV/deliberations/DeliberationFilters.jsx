import React, { useState } from 'react';
import { Row, Col, Form, Button, Card } from 'react-bootstrap';
import { FaFilter, FaSearch, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import PropTypes from 'prop-types';
import DataCounter from '../../DataCounter';
import SearchBar from '../../SearchBar';
import './styles.css';

const DeliberationFilters = ({
  searchTerm,
  onSearchChange,
  deliberationsCount,
  dateFilter,
  onDateFilterChange,
  onClearFilters,
  hasActiveFilters
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card className="deliberation-filter-card mb-4">
      <Card.Body>
        {/* Quick Search Row */}
        <Row className="align-items-center mb-3">
          <Col md={6}>
            <div className="position-relative">
              <FaSearch className="deliberation-search-icon" />
              <SearchBar 
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="ابحث برقم المحضر، اسم الحضور، أو محتوى المداولة..."
                className="ps-4"
              />
            </div>
          </Col>
          
          <Col md={4} className="d-flex align-items-center">
            <DataCounter 
              count={deliberationsCount} 
              label="عدد المداولات"
              variant="primary"
            />
          </Col>
          
          <Col md={2} className="text-end">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="me-2 deliberation-filter-toggle"
            >
              <FaFilter className="me-1" />
              {showAdvanced ? 'إخفاء الفلاتر' : 'فلاتر متقدمة'}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={onClearFilters}
                className="deliberation-clear-filters"
              >
                <FaTimes className="me-1" />
                مسح الكل
              </Button>
            )}
          </Col>
        </Row>

        {/* Advanced Filters - Collapsible */}
        {showAdvanced && (
          <div className="deliberation-advanced-filters border-top pt-3">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="dateFilter">
                  <Form.Label className="fw-bold deliberation-filter-label">
                    <FaCalendarAlt className="me-1" size={12} />
                    تصفية حسب التاريخ
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={dateFilter}
                    onChange={onDateFilterChange}
                    className="deliberation-filter-date"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group controlId="dateRange">
                  <Form.Label className="fw-bold deliberation-filter-label">
                    <FaCalendarAlt className="me-1" size={12} />
                    نطاق زمني
                  </Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="date"
                      placeholder="من تاريخ"
                      className="flex-fill"
                    />
                    <Form.Control
                      type="date"
                      placeholder="إلى تاريخ"
                      className="flex-fill"
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {/* Quick Date Presets */}
            <Row className="mt-3">
              <Col>
                <Form.Label className="fw-bold deliberation-filter-label">
                  تواريخ سريعة:
                </Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      onDateFilterChange({ target: { value: today } });
                    }}
                  >
                    اليوم
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      onDateFilterChange({ target: { value: yesterday.toISOString().split('T')[0] } });
                    }}
                  >
                    الأمس
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const lastWeek = new Date();
                      lastWeek.setDate(lastWeek.getDate() - 7);
                      onDateFilterChange({ target: { value: lastWeek.toISOString().split('T')[0] } });
                    }}
                  >
                    الأسبوع الماضي
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => onDateFilterChange({ target: { value: '' } })}
                  >
                    الكل
                  </Button>
                </div>
              </Col>
            </Row>

            {/* Active Filters Badges */}
            {hasActiveFilters && (
              <div className="deliberation-active-filters mt-3">
                <h6 className="mb-2">الفلاتر النشطة:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {dateFilter && (
                    <span className="badge bg-primary deliberation-filter-badge">
                      التاريخ: {new Date(dateFilter).toLocaleDateString('ar-TN')}
                      <button 
                        className="btn-close btn-close-white ms-1"
                        onClick={() => onDateFilterChange({ target: { value: '' } })}
                        style={{ fontSize: '0.6rem' }}
                      />
                    </span>
                  )}
                  {searchTerm && (
                    <span className="badge bg-info deliberation-filter-badge">
                      بحث: {searchTerm}
                      <button 
                        className="btn-close btn-close-white ms-1"
                        onClick={() => onSearchChange({ target: { value: '' } })}
                        style={{ fontSize: '0.6rem' }}
                      />
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

DeliberationFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  deliberationsCount: PropTypes.number.isRequired,
  dateFilter: PropTypes.string.isRequired,
  onDateFilterChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  hasActiveFilters: PropTypes.bool.isRequired,
};

export default DeliberationFilters;