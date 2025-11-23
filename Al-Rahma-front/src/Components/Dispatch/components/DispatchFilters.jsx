import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Form, Button, Nav, Navbar } from 'react-bootstrap';
import { FaSearch, FaPlus, FaFilter } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DispatchFilters = ({ 
  onSearch, 
  onDateRangeChange, 
  onStatusFilter, 
  onAddNew, 
  activeTab, 
  setActiveTab 
}) => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const handleSearch = (e) => {
    onSearch(e.target.value);
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setDateRange(dates);
    onDateRangeChange({
      start: start ? start.toISOString().split('T')[0] : '',
      end: end ? end.toISOString().split('T')[0] : ''
    });
  };

  const handleStatusChange = (status) => {
    onStatusFilter(status);
  };

  return (
    <div className="dispatch-filters">
      <Row className="mb-3">
        <Col md={8}>
          <Form.Group className="search-box">
            <div className="search-icon">
              <FaSearch />
            </div>
            <Form.Control
              type="text"
              placeholder="البحث حسب المستفيد، المنسق، الملاحظات..."
              onChange={handleSearch}
            />
          </Form.Group>
        </Col>
       
      </Row>
      
      <Row className="mb-3">
        <Col md={12}>
          <Navbar bg="light" expand="lg" className="custom-navbar">
            <Nav className="mr-auto">
              <Nav.Item className="custom-nav-item">
                <Nav.Link
                  as={Link}
                  eventKey="all"
                  className={`custom-nav-link ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  كل الإعارات
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="custom-nav-item">
                <Nav.Link
                  as={Link}
                  eventKey="ongoing"
                  className={`custom-nav-link ${activeTab === 'ongoing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ongoing')}
                >
                  الاعارات الجارية
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="custom-nav-item">
                <Nav.Link
                  as={Link}
                  eventKey="history"
                  className={`custom-nav-link ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  الاعارات السابقة
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Navbar>
        </Col>
      </Row>
      
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>الحالة</Form.Label>
            <Form.Select onChange={(e) => handleStatusChange(e.target.value)}>
              <option value="all">كل الحالات</option>
              <option value="ongoing">قيد التنفيذ</option>
              <option value="completed">مكتمل</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>الفترة</Form.Label>
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              isClearable
              placeholderText="اختر الفترة"
              className="form-control"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>ترتيب حسب</Form.Label>
            <Form.Select>
              <option>الأحدث أولاً</option>
              <option>الأقدم أولاً</option>
              <option>المستفيد (أ-ي)</option>
              <option>المستفيد (ي-أ)</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default DispatchFilters;