import React, { useState, useMemo } from 'react';
import { Table, Button, Badge, Pagination, Modal, Spinner, Row, Col } from 'react-bootstrap';
import { 
  FaEye, FaTrash, FaFileAlt, 
  FaMoneyBillWave, FaBoxOpen, FaCheckCircle,
  FaTimesCircle, FaCalendarAlt, FaDownload 
} from 'react-icons/fa';

import LoadingSpinner from '../../shared/LoadingSpinner';
import ErrorAlert from '../../shared/ErrorAlert';
import StatsComponent from './StatsComponent';
import AidFilters from './AidFilters';
import './AidTable.css';
import { downloadLegalFile } from '../../../services/aidService';
import ExportToExcel from '../../ExportToExcel';

const AidTable = ({ 
  aid,        
  onDelete, 
  isLoading, 
  error,
  pagination,
  onPageChange
}) => {
  
  // Use whichever prop is provided, with fallback to empty array
  const allAids = aid || [];
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAid, setSelectedAid] = useState(null);
  const [aidToDelete, setAidToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Apply filters mechanically
  const filteredAids = useMemo(() => {
    return allAids.filter(aidItem => {
      // Search filter (reference)
      const matchesSearch = searchTerm === '' || 
        aidItem.reference?.toLowerCase().includes(searchTerm.toLowerCase());

      
      // Type filter
      const matchesType = typeFilter === '' || aidItem.aidType === typeFilter;
      
      // Date range filter
      const entryDate = aidItem.dateOfAid ? new Date(aidItem.dateOfAid) : null;
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      const matchesDateFrom = !dateFrom || (entryDate && fromDate && entryDate >= new Date(fromDate.setHours(0, 0, 0, 0)));
      const matchesDateTo = !dateTo || (entryDate && toDate && entryDate <= new Date(toDate.setHours(23, 59, 59, 999)));
      
      return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
    });
  }, [allAids, searchTerm, typeFilter, dateFrom, dateTo]);

  // Pagination calculations
  const itemsPerPage = pagination?.pageSize || 10;
  const totalItems = filteredAids.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = pagination?.page || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAids = filteredAids.slice(indexOfFirstItem, indexOfLastItem);

  // Handler functions
  const handleViewDetails = (aidItem) => {
    setSelectedAid(aidItem);
    setShowDetailsModal(true);
  };

  const handleDownloadFile = async (id) => {
    try {
      await downloadLegalFile(id);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleFilter = () => {
    if (onPageChange) onPageChange(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilter();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setDateFrom(null);
    setDateTo(null);
    handleFilter();
  };

  const handleDeleteClick = (aidItem) => {
    setAidToDelete(aidItem);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!aidToDelete || !onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(aidToDelete.id);
      setShowDeleteModal(false);
      setAidToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateItemTotal = (items) => {
    return items?.reduce((sum, item) => sum + (item.totalValue || 0), 0) || 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('ar-TN');
  };

  // Prepare data for export (including modal data)
  const getExportData = () => {
    return filteredAids.map(aidItem => ({
      'المرجع': aidItem.reference || '',
      'المستفيد': aidItem.usage || '',
      'تاريخ المساعدة': aidItem.dateOfAid ? formatDate(aidItem.dateOfAid) : '',
      'نوع المساعدة': aidItem.aidType || '',
      'القيمة النقدية': aidItem.monetaryValue || 0,
      'الوصف': aidItem.description || '',
      'ملف قانوني': aidItem.legalFilePath ? 'موجود' : 'غير موجود',
      // Include item details for in-kind aid
      'إجمالي قيمة العناصر': ['عيني', 'نقدي وعيني'].includes(aidItem.aidType) && aidItem.items?.length > 0 ? 
        calculateItemTotal(aidItem.items).toFixed(2) : 0,
      'عدد العناصر': aidItem.items?.length || 0
    }));
  };



  return (
    <div className="aid-table-container">
      {/* Export buttons row */}
      <Row className="mb-3">
        <Col className="d-flex justify-content-end gap-2">
          <ExportToExcel 
            data={getExportData()} 
            filename="المساعدات"
            buttonText="Excel تصدير"
            buttonProps={{ 
              size: "sm", 
              variant: "outline-success",
              className: "d-flex align-items-center"
            }}
          />

        </Col>
      </Row>

      <StatsComponent aid={filteredAids} />
      
      <AidFilters
        searchTerm={searchTerm}
        typeFilter={typeFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSearchChange={setSearchTerm}
        onTypeChange={setTypeFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onResetFilters={handleResetFilters}
      />

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="table-responsive aid-data-table">
            <Table striped bordered hover className="aid-table">
              <thead className="table-header">
                <tr>
                  <th><FaFileAlt className="me-2" /> المرجع</th>
                  <th>المستفيد</th>
                  <th><FaCalendarAlt className="me-2" /> تاريخ المساعدة</th>
                  <th>نوع المساعدة</th>
                  <th>القيمة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentAids.length > 0 ? (
                  currentAids.map((aidItem) => (
                    <tr key={aidItem.id} className="aid-row">
                      <td className="reference-cell">{aidItem.reference || '---'}</td>
                      <td>{aidItem.usage || '---'}</td>
                      <td>{formatDate(aidItem.dateOfAid)}</td>
                      <td>
                        <Badge 
                          pill 
                          bg={aidItem.aidType === 'نقدي' ? 'success' : 
                              aidItem.aidType === 'عيني' ? 'info' : 'warning'}
                          className="type-badge"
                        >
                          {aidItem.aidType === 'نقدي' ? (
                            <FaMoneyBillWave className="me-1" />
                          ) : aidItem.aidType === 'عيني' ? (
                            <FaBoxOpen className="me-1" />
                          ) : null}
                          {aidItem.aidType || '---'}
                        </Badge>
                      </td>
                      <td className="value-cell">{aidItem.monetaryValue?.toFixed(2) || '0.00'} د.ت</td>
                      <td className="actions-cell">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleViewDetails(aidItem)}
                          className="me-2 action-button"
                          title="عرض التفاصيل"
                        >
                          <FaEye />
                        </Button>
                        {aidItem.legalFilePath && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleDownloadFile(aidItem.id)}
                            className="me-2 action-button"
                            title="تحميل الملف"
                          >
                            <FaDownload />
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(aidItem)}
                          className="action-button"
                          title="حذف"
                          disabled={isDeleting}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center no-data">
                      {filteredAids.length === 0 ? 'لا توجد مساعدات تطابق معايير البحث' : 'لا توجد مساعدات متاحة'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination controls */}
          {totalItems > itemsPerPage && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination className="aid-pagination">
                <Pagination.First 
                  onClick={() => onPageChange && onPageChange(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))} 
                  disabled={currentPage === 1}
                />
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <Pagination.Item
                      key={page}
                      active={page === currentPage}
                      onClick={() => onPageChange && onPageChange(page)}
                    >
                      {page}
                    </Pagination.Item>
                  );
                })}
                
                <Pagination.Next 
                  onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))} 
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => onPageChange && onPageChange(totalPages)} 
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}

          {/* Aid Details Modal */}
          <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
            <Modal.Header closeButton>
              <Modal.Title>تفاصيل المساعدة: {selectedAid?.reference || '---'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedAid && (
                <div className="aid-details">
                  <Row className="mb-3">

                    <Col md={6}>
                      <h6>المستفيد:</h6>
                      <p>{selectedAid.usage || '---'}</p>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>تاريخ الدخول:</h6>
                      <p>{formatDate(selectedAid.dateOfAid)}</p>
                    </Col>

                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>نوع المساعدة:</h6>
                      <p>
                        <Badge 
                          pill 
                          bg={selectedAid.aidType === 'نقدي' ? 'success' : 
                              selectedAid.aidType === 'عيني' ? 'info' : 'warning'}
                        >
                          {selectedAid.aidType || '---'}
                        </Badge>
                      </p>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>القيمة النقدية:</h6>
                      <p>{selectedAid.monetaryValue?.toFixed(2) || '0.00'} د.ت</p>
                    </Col>
                    <Col md={6}>
                      <h6>الوصف:</h6>
                      <p>{selectedAid.description || '---'}</p>
                    </Col>
                  </Row>

                  {['عيني', 'نقدي وعيني'].includes(selectedAid.aidType) && selectedAid.items?.length > 0 && (
                    <Row className="mb-3">
                      <Col md={12}>
                        <h6>العناصر:</h6>
                        <div className="table-responsive">
                          <table className="table table-bordered">
                            <thead>
                              <tr>
                                <th>الفئة الفرعية</th>
                                <th>الكمية</th>
                                <th>سعر الوحدة</th>
                                <th>القيمة الإجمالية</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedAid.items.map((item, index) => (
                                <tr key={index}>
                                  <td>{item.subCategoryName || '---'}</td>
                                  <td>{item.quantity || '0'}</td>
                                  <td>{item.unitPrice?.toFixed(2) || '0.00'} د.ت</td>
                                  <td>{item.totalValue?.toFixed(2) || '0.00'} د.ت</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan="3" className="text-end">
                                  <strong>إجمالي العناصر:</strong>
                                </td>
                                <td>
                                  <strong>{calculateItemTotal(selectedAid.items).toFixed(2)} د.ت</strong>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </Col>
                    </Row>
                  )}

                  {selectedAid.legalFilePath && (
                    <Row className="mb-3">
                      <Col md={12}>
                        <h6>المستند القانوني:</h6>
                        <Button
                          variant="primary"
                          onClick={() => handleDownloadFile(selectedAid.id)}
                          className="download-btn"
                        >
                          <FaDownload className="me-2" /> تحميل الملف
                        </Button>
                      </Col>
                    </Row>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                إغلاق
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal show={showDeleteModal} onHide={() => !isDeleting && setShowDeleteModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>تأكيد الحذف</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              هل أنت متأكد أنك تريد حذف المساعدة ذو المرجع: <strong>{aidToDelete?.reference || '---'}</strong>؟
              <br />
              <span className="text-danger">هذا الإجراء لا يمكن التراجع عنه.</span>
            </Modal.Body>
            <Modal.Footer>
              <Button 
                variant="secondary" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                إلغاء
              </Button>
              <Button 
                variant="danger" 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    جاري الحذف...
                  </>
                ) : 'حذف'}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default AidTable;