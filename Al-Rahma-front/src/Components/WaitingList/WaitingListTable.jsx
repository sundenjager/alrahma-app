import React, { useState, useMemo } from 'react';
import { Table, Badge, Button, Form, InputGroup, Row, Col, Dropdown } from 'react-bootstrap';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const WaitingListTable = ({ data, onStatusChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const getStatusVariant = (status) => {
    switch(status) {
      case 'done': return 'success';
      case 'refused': return 'danger';
      default: return 'warning';
    }
  };
  
  const getStatusText = (status) => {
    switch(status) {
      case 'done': return 'مكتمل';
      case 'refused': return 'مرفوض';
      default: return 'قيد الانتظار';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-TN');
  };

  // Filter data based on search term and status filter
  const filteredData = useMemo(() => {
    let result = data;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Apply search term filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name?.toLowerCase().includes(lowerSearchTerm) ||
        item.phoneNumber?.toLowerCase().includes(lowerSearchTerm) ||
        item.address?.toLowerCase().includes(lowerSearchTerm) ||
        item.reason?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    return result;
  }, [data, searchTerm, statusFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all';

  return (
    <>
      {/* Search and Filter Bar */}
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="ابحث بالاسم، الهاتف، العنوان أو السبب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" className="w-100">
              <FaFilter className="me-2" />
              {statusFilter === 'all' ? 'جميع الحالات' : getStatusText(statusFilter)}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setStatusFilter('all')}>جميع الحالات</Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('pending')}>قيد الانتظار</Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('done')}>مكتمل</Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('refused')}>مرفوض</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col md={3}>
          {hasActiveFilters && (
            <Button variant="outline-danger" className="w-100" onClick={clearFilters}>
              <FaTimes className="me-2" />
              مسح الفلاتر
            </Button>
          )}
        </Col>
      </Row>

      {/* Results Count */}
      {(searchTerm || statusFilter !== 'all') && (
        <Row className="mb-2">
          <Col>
            <p className="text-muted">
              تم العثور على {filteredData.length} من {data.length} نتيجة
              {hasActiveFilters && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearFilters}
                  className="me-2"
                >
                  (مسح الفلاتر)
                </Button>
              )}
            </p>
          </Col>
        </Row>
      )}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>الاسم</th>
            <th>التاريخ</th>
            <th>رقم الهاتف</th>
            <th>العنوان</th>
            <th>السبب</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center">
                {hasActiveFilters ? 'لم يتم العثور على نتائج' : 'لا توجد بيانات'}
              </td>
            </tr>
          ) : (
            filteredData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{formatDate(item.date)}</td>
                <td>{item.phoneNumber}</td>
                <td>{item.address}</td>
                <td>{item.reason}</td>
                <td>
                  <Badge bg={getStatusVariant(item.status)}>
                    {getStatusText(item.status)}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline-success"
                      onClick={() => onStatusChange(item.id, 'done')}
                      disabled={item.status === 'done'}
                    >
                      قبول
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline-danger"
                      onClick={() => onStatusChange(item.id, 'refused')}
                      disabled={item.status === 'refused'}
                    >
                      رفض
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  );
};

export default WaitingListTable;