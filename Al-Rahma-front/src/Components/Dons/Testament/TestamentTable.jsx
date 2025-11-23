import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Card, Pagination, Form, Badge, Alert, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCalendarAlt, FaInfoCircle, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { getDons, deleteDons, updateExecutionStatus, downloadFile as downloadLegalFile } from '../../../services/donsService';
import TestamentFilters from './TestamentFilters';
import TestamentStats from './TestamentStats';
import ExportToExcel from '../../ExportToExcel';

const TestamentTable = ({ onEdit }) => {
  const [testaments, setTestaments] = useState([]);
  const [filteredTestaments, setFilteredTestaments] = useState([]);
  const [years, setYears] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [showExecutionDateModal, setShowExecutionDateModal] = useState(false);
  const [selectedDon, setSelectedDon] = useState(null);
  const [executionDate, setExecutionDate] = useState('');
  const [apiError, setApiError] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    testamentStatus: '',
    year: 'all',
    donsType: '',
    donsScope: ''
  });

  // Search state
  const [search, setSearch] = useState({
    query: '',
    field: 'reference'
  });

  useEffect(() => {
    fetchTestaments();
    generateYears();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [testaments, filters, search]);

  const fetchTestaments = async () => {
    try {
      const { data } = await getDons();
      const testamentOnly = data.filter(don => don.nature === 'testament');
      setTestaments(testamentOnly);
    } catch (error) {
      console.error('Failed to fetch testaments:', error);
      setApiError('فشل في تحميل الوصايا. حاول مرة أخرى.');
    }
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2000;
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);
    setYears(years);
  };

  const applyFilters = () => {
    let result = [...testaments];

    // Apply search filter
    if (search.query) {
      const query = search.query.toLowerCase();
      result = result.filter(t => 
        String(t[search.field] || '').toLowerCase().includes(query)
      );
    }

    // Apply testament status filter
    if (filters.testamentStatus) {
      result = result.filter(t => t.testamentStatus === filters.testamentStatus);
    }

    // Apply dons type filter
    if (filters.donsType) {
      result = result.filter(t => t.donsType === filters.donsType);
    }

    // Apply dons scope filter
    if (filters.donsScope) {
      result = result.filter(t => t.donsScope === filters.donsScope);
    }

    // Apply year filter
    if (filters.year !== 'all') {
      const yearNum = parseInt(filters.year);
      result = result.filter(t => {
        const entryYear = new Date(t.dateOfEntry).getFullYear();
        const exitYear = t.dateOfExit ? new Date(t.dateOfExit).getFullYear() : null;
        return exitYear
          ? (entryYear <= yearNum && yearNum <= exitYear)
          : entryYear === yearNum;
      });
    }

    setFilteredTestaments(result);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleDownload = async (don) => {
    try {
      // Extract filename from path or generate one
      const fileName = don.legalFilePath 
        ? don.legalFilePath.split('/').pop() 
        : `testament_${don.id}.pdf`;
      
      await downloadLegalFile(don.id, fileName);
    } catch (error) {
      console.error('Download failed:', error);
      setApiError(error.response?.status === 404 
        ? 'الملف غير موجود على الخادم' 
        : 'فشل في تحميل الملف. حاول مرة أخرى.');
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearch({
      ...search,
      [name]: value
    });
  };

  const resetFilters = () => {
    setFilters({
      testamentStatus: '',
      year: 'all',
      donsType: '',
      donsScope: ''
    });
    setSearch({
      query: '',
      field: 'reference'
    });
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredTestaments.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTestaments.length / itemsPerPage);

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDons(deletingId);
      await fetchTestaments();
    } catch (error) {
      console.error('فشل في حذف الوصية:', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDescription = (description) => {
    setSelectedDescription(description);
    setShowDescriptionModal(true);
  };

  const handleSetExecutionDate = (don) => {
    setSelectedDon(don);
    setExecutionDate(new Date().toISOString().split('T')[0]);
    setShowExecutionDateModal(true);
  };

  const handleSaveExecutionDate = async () => {
    try {
      await updateExecutionStatus(selectedDon.id, executionDate);
      await fetchTestaments();
      setShowExecutionDateModal(false);
    } catch (error) {
      console.error('فشل في تحديث تاريخ التنفيذ:', error);
      setApiError(error.response?.data?.title || 'فشل في تحديث حالة الوصية');
    }
  };

  // Prepare data for export
  const getExportData = () => {
    return filteredTestaments.map(don => ({
      'رقم التسلسل': don.reference || '',
      'الفئة': don.category || '',
      'العلامة التجارية': don.brand || '',
      'الاستخدام': don.usage || '',
      'القيمة': don.monetaryValue || 0,
      'الوصي': don.source || '',
      'جنسية الوصي': don.testatorNationality || '',
      'نوع الوصية': don.testamentNature || '',
      'حالة الوصية': don.testamentStatus || '',
      'تاريخ التسجيل': don.registrationDate ? new Date(don.registrationDate).toLocaleDateString('ar-TN') : '',
      'تاريخ التنفيذ': don.executionDate ? new Date(don.executionDate).toLocaleDateString('ar-TN') : '',
      'الوصف': don.description || '',
      'نطاق الوصية': don.donsScope || '',
      'نوع الهبة': don.donsType || '',
      'ملف قانوني': don.legalFilePath ? 'موجود' : 'غير موجود',
      'تاريخ الدخول': don.dateOfEntry ? new Date(don.dateOfEntry).toLocaleDateString('ar-TN') : '',
      'تاريخ الخروج': don.dateOfExit ? new Date(don.dateOfExit).toLocaleDateString('ar-TN') : ''
    }));
  };



  return (
    <div>
      {apiError && (
        <Alert variant="danger" onClose={() => setApiError(null)} dismissible>
          {apiError}
        </Alert>
      )}

      {/* Export buttons row */}
      <Row className="mb-3">
        <Col className="d-flex justify-content-end gap-2">
          <ExportToExcel 
            data={getExportData()} 
            filename="الوصايا"
            buttonText="Excel تصدير"
            buttonProps={{ 
              size: "sm", 
              variant: "outline-success",
              className: "d-flex align-items-center"
            }}
          />

        </Col>
      </Row>

      <TestamentStats testaments={filteredTestaments} />
      
      <TestamentFilters 
        search={search}
        filters={filters}
        years={years}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      {/* Results Summary */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Badge bg="primary" className="me-2">
            النتائج: {filteredTestaments.length}
          </Badge>
          {filters.year !== 'all' && (
            <Badge bg="info" className="me-2">
              السنة: {filters.year}
            </Badge>
          )}
          {filters.testamentStatus && (
            <Badge bg="secondary" className="me-2">
              الحالة: {filters.testamentStatus}
            </Badge>
          )}
        </div>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>رقم التسلسل</th>
                  <th>الفئة</th>
                  <th>العلامة التجارية</th>
                  <th>الاستخدام</th>
                  <th>القيمة</th>
                  <th>الوصي</th>
                  <th>جنسية الوصي</th>
                  <th>نوع الوصية</th>
                  <th>حالة الوصية</th>
                  <th>تاريخ التسجيل</th>
                  <th>تاريخ التنفيذ</th>
                  <th>الوصف</th>
                  <th>الملف القانوني</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((don, index) => (
                  <tr key={don.id}>
                    <td>{indexOfFirst + index + 1}</td>
                    <td>{don.reference}</td>
                    <td>{don.category}</td>
                    <td>{don.brand}</td>
                    <td>{don.usage}</td>
                    <td>{don.monetaryValue}</td>
                    <td>{don.source}</td>
                    <td>{don.testatorNationality || '-'}</td>
                    <td>{don.testamentNature || '-'}</td>
                    <td>
                      <span className={`badge bg-${don.testamentStatus === 'نفذت' ? 'success' : 'warning'}`}>
                        {don.testamentStatus || '-'}
                      </span>
                    </td>
                    <td>{don.registrationDate ? new Date(don.registrationDate).toLocaleDateString('ar-TN') : '-'}</td>
                    <td>{don.executionDate ? new Date(don.executionDate).toLocaleDateString('ar-TN') : '-'}</td>
                    <td>
                      {don.description && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleViewDescription(don.description)}
                          className="p-0"
                        >
                          <FaInfoCircle /> عرض الوصف
                        </Button>
                      )}
                    </td>
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
                      <div className="d-flex">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => onEdit(don)}
                          className="me-2"
                        >
                          <FaEdit />
                        </Button>
                        {don.testamentStatus !== 'نفذت' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleSetExecutionDate(don)}
                            className="me-2"
                          >
                            <FaCalendarAlt />
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(don.id)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Description Modal */}
          <Modal show={showDescriptionModal} onHide={() => setShowDescriptionModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>وصف الوصية</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedDescription || 'لا يوجد وصف'}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDescriptionModal(false)}>
                إغلاق
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Execution Date Modal */}
          <Modal show={showExecutionDateModal} onHide={() => setShowExecutionDateModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>تسجيل تاريخ التنفيذ</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group controlId="executionDate">
                <Form.Label>تاريخ التنفيذ</Form.Label>
                <Form.Control
                  type="date"
                  value={executionDate}
                  onChange={(e) => setExecutionDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </Form.Group>
              <p className="mt-3 text-muted">
                سيتم تغيير حالة الوصية تلقائياً إلى "نفذت" عند الحفظ.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowExecutionDateModal(false)}>
                إلغاء
              </Button>
              <Button variant="primary" onClick={handleSaveExecutionDate}>
                حفظ
              </Button>
            </Modal.Footer>
          </Modal>

          {filteredTestaments.length === 0 && (
            <div className="text-center py-4 text-muted">
              لا توجد وصايا متطابقة مع معايير البحث
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
      </Card>

      {/* Delete Confirmation Modal */}
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
    </div>
  );
};

export default TestamentTable;