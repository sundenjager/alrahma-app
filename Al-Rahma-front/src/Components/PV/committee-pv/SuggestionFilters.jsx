import React, { useState } from 'react';
import { Row, Col, Form, Button, Card, Accordion } from 'react-bootstrap';
import { FaFilter, FaSearch, FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types';
import DataCounter from '../../DataCounter';
import SearchBar from '../../SearchBar';
import './styles.css';

const SuggestionFilters = ({
  searchTerm,
  onSearchChange,
  suggestionsCount,
  committeeFilter,
  onCommitteeFilterChange,
  committeeNames,
  dateFilter,
  onDateFilterChange,
  onClearFilters,
  hasActiveFilters
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card className="filter-card mb-4">
      <Card.Body>
        {/* Quick Search Row */}
        <Row className="align-items-center mb-3">
          <Col md={6}>
            <div className="position-relative">
              <FaSearch className="search-icon" />
              <SearchBar 
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="ابحث برقم المحضر، اسم الحضور، أو اسم اللجنة..."
                className="ps-4"
              />
            </div>
          </Col>
          
          <Col md={4} className="d-flex align-items-center">
            <DataCounter 
              count={suggestionsCount} 
              label="عدد المحاضر"
              variant="primary"
            />
          </Col>
          
          <Col md={2} className="text-end">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="me-2"
            >
              <FaFilter className="me-1" />
              {showAdvanced ? 'إخفاء الفلاتر' : 'فلاتر متقدمة'}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={onClearFilters}
              >
                <FaTimes className="me-1" />
                مسح الكل
              </Button>
            )}
          </Col>
        </Row>

        {/* Advanced Filters - Collapsible */}
        {showAdvanced && (
          <div className="advanced-filters border-top pt-3">
            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="committeeFilter">
                  <Form.Label className="fw-bold">
                    <FaFilter className="me-1" size={12} />
                    اللجنة
                  </Form.Label>
                  <Form.Select 
                    value={committeeFilter}
                    onChange={onCommitteeFilterChange}
                    className="filter-select"
                  >
                    <option value="">جميع اللجان</option>
                    {committeeNames.map((committee, index) => (
                      <option key={index} value={committee}>
                        {committee}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group controlId="dateFilter">
                  <Form.Label className="fw-bold">
                    <FaFilter className="me-1" size={12} />
                    التاريخ
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={dateFilter}
                    onChange={onDateFilterChange}
                    className="filter-date"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group controlId="dateRange">
                  <Form.Label className="fw-bold">
                    <FaFilter className="me-1" size={12} />
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

            {/* Active Filters Badges */}
            {hasActiveFilters && (
              <div className="active-filters mt-3">
                <h6 className="mb-2">الفلاتر النشطة:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {committeeFilter && (
                    <span className="badge bg-primary">
                      اللجنة: {committeeFilter}
                      <button 
                        className="btn-close btn-close-white ms-1"
                        onClick={() => onCommitteeFilterChange({ target: { value: '' } })}
                        style={{ fontSize: '0.6rem' }}
                      />
                    </span>
                  )}
                  {dateFilter && (
                    <span className="badge bg-success">
                      التاريخ: {new Date(dateFilter).toLocaleDateString('ar-TN')}
                      <button 
                        className="btn-close btn-close-white ms-1"
                        onClick={() => onDateFilterChange({ target: { value: '' } })}
                        style={{ fontSize: '0.6rem' }}
                      />
                    </span>
                  )}
                  {searchTerm && (
                    <span className="badge bg-info">
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

SuggestionFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  suggestionsCount: PropTypes.number.isRequired,
  committeeFilter: PropTypes.string.isRequired,
  onCommitteeFilterChange: PropTypes.func.isRequired,
  committeeNames: PropTypes.array.isRequired,
  dateFilter: PropTypes.string.isRequired,
  onDateFilterChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  hasActiveFilters: PropTypes.bool.isRequired,
};

export default SuggestionFilters;