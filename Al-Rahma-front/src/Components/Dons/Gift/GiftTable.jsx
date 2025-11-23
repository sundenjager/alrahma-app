import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Card, Pagination, Form, Collapse, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaFilter, FaSearch } from 'react-icons/fa';
import { getDons, deleteDons, downloadFile as downloadLegalFile } from '../../../services/donsService';
import DataCounter from '../../DataCounter';
import Stats from './Stats';
import './gift.css';
import ExportToExcel from '../../ExportToExcel';

const GiftTable = ({ onEdit }) => {
  const [dons, setDons] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [filteredDons, setFilteredDons] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [donsPerPage, setDonsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('reference');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const searchFields = [
    { value: 'reference', label: 'رقم التسلسل' },
    { value: 'category', label: 'الفئة' },
    { value: 'source', label: 'المصدر' },
    { value: 'usage', label: 'المستفيد' }
  ];

  const statusOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'صالح', label: 'صالح' },
    { value: 'غير صالح', label: 'غير صالح' }
  ];

  // Fetch gifts once on mount
  useEffect(() => {
    fetchDons();
  }, []);

  const fetchDons = async () => {
    try {
      const { data } = await getDons();
      const giftOnly = data.filter(don => don.nature === 'gift');
      setDons(giftOnly);
    } catch (error) {
      console.error('خطأ في جلب الهبات:', error);
    }
  };

  // Set available years
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2010;
    const allYears = Array.from({ length: currentYear - startYear + 1 }, (_, i) =>currentYear - i);
    setYears(allYears);
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...dons];

    // Year filter
    if (selectedYear !== 'all') {
      const yearNum = parseInt(selectedYear);
      result = result.filter(don => {
        const entryYear = new Date(don.dateOfEntry).getFullYear();
        const exitYear = don.dateOfExit ? new Date(don.dateOfExit).getFullYear() : null;
        return exitYear
          ? (entryYear <= yearNum && yearNum <= exitYear)
          : entryYear === yearNum;
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(don =>
        String(don[searchField] || '').toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(don => don.status === statusFilter);
    }

    // Monetary value filter
    if (minValue !== '' && !isNaN(minValue)) {
      result = result.filter(don => don.monetaryValue >= parseFloat(minValue));
    }
    if (maxValue !== '' && !isNaN(maxValue)) {
      result = result.filter(don => don.monetaryValue <= parseFloat(maxValue));
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(don => new Date(don.dateOfEntry) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      result = result.filter(don => new Date(don.dateOfEntry) <= end);
    }

    setFilteredDons(result);
    setCurrentPage(1);
  }, [dons, selectedYear, searchQuery, searchField, statusFilter, minValue, maxValue, startDate, endDate]);

  const indexOfLast = currentPage * donsPerPage;
  const indexOfFirst = indexOfLast - donsPerPage;
  const currentDons = filteredDons.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredDons.length / donsPerPage);

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDons(deletingId);
      await fetchDons();
    } catch (error) {
      console.error('فشل في حذف الهبة:', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleDownload = async (don) => {
    try {
      const fileName = don.legalFilePath 
        ? don.legalFilePath.split('/').pop() 
        : `testament_${don.id}.pdf`;
      await downloadLegalFile(don.id, fileName);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const resetFilters = () => {
    setSelectedYear('all');
    setSearchQuery('');
    setSearchField('reference');
    setStatusFilter('all');
    setMinValue('');
    setMaxValue('');
    setStartDate('');
    setEndDate('');
  };

  // Prepare data for export
  const getExportData = () => {
    return filteredDons.map(don => ({
      'رقم التسلسل': don.reference || '',
      'الفئة': don.category || '',
      'العلامة التجارية': don.brand || '',
      'المصدر': don.source || '',
      'المستفيد': don.usage || '',
      'تاريخ الدخول': don.dateOfEntry ? new Date(don.dateOfEntry).toLocaleDateString('ar-TN') : '',
      'تاريخ الخروج': don.dateOfExit ? new Date(don.dateOfExit).toLocaleDateString('ar-TN') : '',
      'الحالة': don.status || '',
      'الوصف': don.description || '',
      'الجهة': don.donsScope || '',
      'القيمة': don.monetaryValue || 0,
      'ملف قانوني': don.legalFilePath ? 'موجود' : 'غير موجود',
      'نوع الهبة': don.nature || ''
    }));
  };



  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">سجل الهبات</h5>
        <div className="d-flex gap-2">
          <ExportToExcel 
            data={getExportData()} 
            filename="الهبات"
            buttonText="Excel تصدير"
            buttonProps={{ 
              size: "sm", 
              variant: "outline-success",
              className: "d-flex align-items-center"
            }}
          />

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            <FaFilter className="me-1" /> {showFilters ? 'إخفاء التصفية' : 'تصفية'}
          </Button>
        </div>
      </Card.Header>

      <Collapse in={showFilters}>
        <div>
          <Card.Body className="border-bottom filter-section">
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>بحث</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="ابحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Form.Select
                      value={searchField}
                      onChange={(e) => setSearchField(e.target.value)}
                    >
                      {searchFields.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>السنة</Form.Label>
                  <Form.Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="all">عرض الكل</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>الحالة</Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>القيمة الدنيا</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="أدخل القيمة الدنيا"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>القيمة القصوى</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="أدخل القيمة القصوى"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>تاريخ الدخول من</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>تاريخ الدخول إلى</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={12} className="text-end">
                <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
                  إعادة تعيين
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </div>
      </Collapse>

      <Card.Body>
        <Stats dons={filteredDons} />
        <div className="d-flex justify-content-between mb-3">
          <DataCounter count={filteredDons.length} />
          <div>
            عرض{' '}
            <select
              className="form-select d-inline-block w-auto"
              value={donsPerPage}
              onChange={(e) => setDonsPerPage(Number(e.target.value))}
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>{' '}
            سجل لكل صفحة
          </div>
        </div>

        <div className="table-responsive">
          <Table striped bordered hover className="mb-0">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>رقم التسلسل</th>
                <th>الفئة</th>
                <th>العلامة التجارية</th>
                <th>المصدر</th>
                <th>المستفيد</th>
                <th>تاريخ الدخول</th>
                <th>تاريخ الخروج</th>
                <th>الحالة</th>
                <th>الوصف</th>
                <th>الجهة</th>
                <th>القيمة</th>
                <th>الملف القانوني</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentDons.map((don, index) => (
                <tr key={don.id}>
                  <td>{indexOfFirst + index + 1}</td>
                  <td>{don.reference}</td>
                  <td>{don.category}</td>
                  <td>{don.brand}</td>
                  <td>{don.source}</td>
                  <td>{don.usage}</td>
                  <td>{new Date(don.dateOfEntry).toLocaleDateString('ar-TN')}</td>
                  <td>{don.dateOfExit ? new Date(don.dateOfExit).toLocaleDateString('ar-TN') : '-'}</td>
                  <td>
                    <span className={`badge bg-${don.status === 'صالح' ? 'success' : 'warning'}`}>
                      {don.status}
                    </span>
                  </td>
                  <td>{don.description || '-'}</td>
                  <td>{don.donsScope}</td>
                  <td>{don.monetaryValue}</td>
                  <td>
                    {don.legalFilePath ? (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleDownload(don)}
                        disabled={!don.legalFilePath}
                      >
                        تحميل
                      </Button>
                    ) : (
                      'لا يوجد'
                    )}
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => onEdit(don)}
                      className="me-2"
                    >
                      <FaEdit /> تعديل
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteClick(don.id)}
                    >
                      <FaTrash /> حذف
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {filteredDons.length === 0 && (
          <div className="text-center py-4 text-muted">
            لا توجد تبرعات متطابقة مع معايير البحث
          </div>
        )}

        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-3">
            <Pagination>
              <Pagination.Prev
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              />
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              })}
              <Pagination.Next
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              />
            </Pagination>
          </div>
        )}
      </Card.Body>

      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>تأكيد الحذف</Modal.Title>
        </Modal.Header>
        <Modal.Body>هل أنت متأكد أنك تريد حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            حذف
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default GiftTable;