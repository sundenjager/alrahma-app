import React from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { FaFilter, FaSearch } from 'react-icons/fa';

const TestamentFilters = ({
  search,
  filters,
  years,
  onSearchChange,
  onFilterChange,
  onResetFilters,
  showFilters,
  setShowFilters
}) => {
  const searchFields = [
    { value: 'reference', label: 'رقم التسلسل' },
    { value: 'category', label: 'الفئة' },
    { value: 'source', label: 'المصدر' },
    { value: 'usage', label: 'المستفيد' }
  ];

  const testamentStatusOptions = [
    { value: '', label: 'الكل' },
    { value: 'قيد التنفيذ', label: 'قيد التنفيذ' },
    { value: 'نفذت', label: 'نفذت' },
    { value: 'ملغاة', label: 'ملغاة' }
  ];

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">بحث وتصفية</h5>
        <Button 
          variant="link" 
          onClick={() => setShowFilters(!showFilters)}
          className="p-0"
        >
          <FaFilter /> {showFilters ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}
        </Button>
      </Card.Header>
      {showFilters && (
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>بحث</Form.Label>
                <div className="input-group">
                  <Form.Select 
                    name="field" 
                    value={search.field} 
                    onChange={onSearchChange}
                    className="w-25"
                  >
                    {searchFields.map(field => (
                      <option key={field.value} value={field.value}>{field.label}</option>
                    ))}
                  </Form.Select>
                  <Form.Control
                    type="text"
                    name="query"
                    value={search.query}
                    onChange={onSearchChange}
                    placeholder="ابحث هنا..."
                  />
                  <Button variant="outline-secondary">
                    <FaSearch />
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>حالة الوصية</Form.Label>
                <Form.Select
                  name="testamentStatus"
                  value={filters.testamentStatus}
                  onChange={onFilterChange}
                >
                  {testamentStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>السنة</Form.Label>
                <Form.Select
                  name="year"
                  value={filters.year}
                  onChange={onFilterChange}
                >
                  <option value="all">الكل</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={3} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={onResetFilters}
                className="w-100"
              >
                إعادة تعيين الفلاتر
              </Button>
            </Col>
          </Row>
        </Card.Body>
      )}
    </Card>
  );
};

export default TestamentFilters;