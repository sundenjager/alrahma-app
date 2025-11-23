import React from 'react';
import { Form, Row, Col, Button, Card } from 'react-bootstrap';
import { FaSearch, FaFilter, FaSyncAlt, FaCalendarAlt } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AidFilters = ({ 
  searchTerm,
  typeFilter,
  dateFrom,
  dateTo,
  onSearchChange,
  onTypeChange,
  onDateFromChange,
  onDateToChange,
  onSearch,
  onFilter,
  onResetFilters
}) => {
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
    onFilter(); // Trigger filtering immediately
  };

  const handleApplyFilter = () => {
    onFilter(); // Trigger filtering with current filter values
  };

  const handleResetAllFilters = () => {
    onResetFilters(); // Reset all filters
    onFilter(); // Trigger filtering immediately after reset
  };

  return (
    <Card className="filter-card">
      <Card.Header className="filter-header">
        <h5><FaFilter className="me-2" /> بحث وتصفية المساعدات</h5>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSearchSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="search">
                <Form.Label><FaSearch className="me-2" /> بحث</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="ابحث بالمرجع أو المصدر..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="search-input"
                  />
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="search-button"
                  >
                    <FaSearch className="me-1" /> بحث
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">

            <Col md={3}>
              <Form.Group controlId="typeFilter">
                <Form.Label>نوع المساعدة</Form.Label>
                <Form.Select
                  value={typeFilter}
                  onChange={(e) => {
                    onTypeChange(e.target.value);
                    handleApplyFilter(); // Apply filter immediately on change
                  }}
                  className="filter-select"
                >
                  <option value="">الكل</option>
                  <option value="نقدي">نقدي</option>
                  <option value="عيني">عيني</option>
                  <option value="نقدي وعيني">نقدي وعيني</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="dateFrom">
                <Form.Label><FaCalendarAlt className="me-2" /> من تاريخ</Form.Label>
                <DatePicker
                  selected={dateFrom}
                  onChange={(date) => {
                    onDateFromChange(date);
                    if (date) handleApplyFilter(); // Only apply if date is selected
                  }}
                  dateFormat="yyyy/MM/dd"
                  className="form-control date-picker"
                  isClearable
                  placeholderText="اختر تاريخ"
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="dateTo">
                <Form.Label><FaCalendarAlt className="me-2" /> إلى تاريخ</Form.Label>
                <DatePicker
                  selected={dateTo}
                  onChange={(date) => {
                    onDateToChange(date);
                    if (date) handleApplyFilter(); // Only apply if date is selected
                  }}
                  dateFormat="yyyy/MM/dd"
                  className="form-control date-picker"
                  isClearable
                  placeholderText="اختر تاريخ"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-secondary" 
              onClick={handleResetAllFilters}
              className="me-2 reset-button"
            >
              <FaSyncAlt className="me-1" /> إعادة تعيين
            </Button>
            <Button 
              variant="primary" 
              onClick={handleApplyFilter}
              className="apply-filter-button"
            >
              <FaFilter className="me-1" /> تطبيق الفلتر
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AidFilters;