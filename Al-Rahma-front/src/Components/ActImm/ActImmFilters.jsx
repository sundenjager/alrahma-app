import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import './actImm.css';

const ActImmFilters = ({ 
  filters, 
  onFilterChange, 
  categories, // This should be the full category objects with id and name
  sourceNatures 
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ 
      ...filters, 
      period: {
        ...filters.period,
        [name]: value
      } 
    });
  };

  return (
    <div className="actimm-filters mb-3">
      <Form>
        <Row className="g-2">
          {/* Search Field */}
          <Col md={2}>
            <Form.Group>
              <Form.Label>بحث</Form.Label>
              <Form.Control
                type="text"
                name="search"
                value={filters.search}
                onChange={handleChange}
                placeholder="ابحث..."
              />
            </Form.Group>
          </Col>

          {/* Category Filter */}
          <Col md={2}>
            <Form.Group>
              <Form.Label>الفئة</Form.Label>
              <Form.Control
                as="select"
                name="category"
                value={filters.category}
                onChange={handleChange}
              >
                <option value="">الكل</option>
                {categories && categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>

          {/* Status Filter */}
          <Col md={2}>
            <Form.Group>
              <Form.Label>الحالة</Form.Label>
              <Form.Control
                as="select"
                name="status"
                value={filters.status}
                onChange={handleChange}
              >
                <option value="">الكل</option>
                <option value="صالح">صالح</option>
                <option value="معطب">معطب</option>
                <option value="تم إتلافه">تم إتلافه</option>
              </Form.Control>
            </Form.Group>
          </Col>

          {/* Source Nature Filter */}
          <Col md={2}>
            <Form.Group>
              <Form.Label>طبيعة المصدر</Form.Label>
              <Form.Control
                as="select"
                name="sourceNature"
                value={filters.sourceNature}
                onChange={handleChange}
              >
                <option value="">الكل</option>
                <option value="شراء">شراء</option>
                <option value="تبرع">تبرع</option>
              </Form.Control>
            </Form.Group>
          </Col>

          {/* Period Filter - Start Date */}
          <Col md={2}>
            <Form.Group>
              <Form.Label>من تاريخ</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={filters.period?.startDate || ''}
                onChange={handleDateChange}
              />
            </Form.Group>
          </Col>

          {/* Period Filter - End Date */}
          <Col md={2}>
            <Form.Group>
              <Form.Label>إلى تاريخ</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={filters.period?.endDate || ''}
                onChange={handleDateChange}
                min={filters.period?.startDate}
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ActImmFilters;