import React, { useState, useMemo } from 'react';
import { Table, Button, Badge, Pagination, Modal, Spinner, Row, Col } from 'react-bootstrap';
import { 
  FaEye, FaTrash, FaFileAlt, 
  FaMoneyBillWave, FaBoxOpen, FaCheckCircle,
  FaTimesCircle, FaCalendarAlt, FaDownload 
} from 'react-icons/fa';

import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorAlert from '../shared/ErrorAlert';
import StatsComponent from './StatsComponent';
import PurchaseFilters from './PurchaseFilters';
import './PurchaseTable.css';
import { downloadLegalFile } from '../../services/suppliesService';
import ExportToExcel from '../ExportToExcel';

const PurchaseTable = ({ 
  purchases: allPurchases, 
  onDelete, 
  isLoading, 
  error,
  pagination,
  onPageChange
}) => {
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Apply filters mechanically
  const filteredPurchases = useMemo(() => {
    return allPurchases.filter(purchase => {
      // Search filter (reference or source)
      const matchesSearch = searchTerm === '' || 
        (purchase.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (purchase.source?.toLowerCase().includes(searchTerm.toLowerCase())));
      
      // Status filter
      const matchesStatus = statusFilter === '' || purchase.status === statusFilter;
      
      // Type filter
      const matchesType = typeFilter === '' || purchase.suppliesType === typeFilter;
      
      // Date range filter
      const entryDate = purchase.dateOfEntry ? new Date(purchase.dateOfEntry) : null;
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      const matchesDateFrom = !dateFrom || (entryDate && fromDate && entryDate >= new Date(fromDate.setHours(0, 0, 0, 0)));
      const matchesDateTo = !dateTo || (entryDate && toDate && entryDate <= new Date(toDate.setHours(23, 59, 59, 999)));
      
      return matchesSearch && matchesStatus && matchesType && matchesDateFrom && matchesDateTo;
    });
  }, [allPurchases, searchTerm, statusFilter, typeFilter, dateFrom, dateTo]);

  // Pagination calculations
  const itemsPerPage = pagination.pageSize || 10;
  const totalItems = filteredPurchases.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = pagination.page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);

  // Handler functions
  const handleViewDetails = (purchase) => {
    setSelectedPurchase(purchase);
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
    onPageChange(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilter();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setDateFrom(null);
    setDateTo(null);
    handleFilter();
  };

  const handleDeleteClick = (purchase) => {
    setPurchaseToDelete(purchase);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!purchaseToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(purchaseToDelete.id);
      setShowDeleteModal(false);
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
    return filteredPurchases.map(purchase => ({
      'المرجع': purchase.reference || '',
      'المصدر': purchase.source || '',
      'الاستخدام': purchase.usage || '',
      'تاريخ الدخول': purchase.dateOfEntry ? formatDate(purchase.dateOfEntry) : '',
      'تاريخ الخروج': purchase.dateOfExit ? formatDate(purchase.dateOfExit) : '',
      'نوع الشراء': purchase.suppliesType || '',
      'الحالة': purchase.status || '',
      'القيمة النقدية': purchase.monetaryValue || 0,
      'الوصف': purchase.description || '',
      'ملف قانوني': purchase.legalFilePath ? 'موجود' : 'غير موجود',
      // Include item details for in-kind purchases
      'إجمالي قيمة العناصر': ['عيني', 'نقدي وعيني'].includes(purchase.suppliesType) && purchase.items?.length > 0 ?
        calculateItemTotal(purchase.items).toFixed(2) : 0,
      'عدد العناصر': purchase.items?.length || 0
    }));
  };



  return (
    <div className="purchase-table-container">
      {/* Export buttons row */}
      <Row className="mb-3">
        <Col className="d-flex justify-content-end gap-2">
          <ExportToExcel 
            data={getExportData()} 
            filename="الشرائات"
            buttonText="Excel تصدير"
            buttonProps={{ 
              size: "sm", 
              variant: "outline-success",
              className: "d-flex align-items-center"
            }}
          />

        </Col>
      </Row>

      <StatsComponent purchases={filteredPurchases} />
      
      <PurchaseFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
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
          <div className="table-responsive purchase-data-table">
            <Table striped bordered hover className="purchases-table">
              <thead className="table-header">
                <tr>
                  <th><FaFileAlt className="me-2" /> المرجع</th>
                  <th>المصدر</th>
                  <th>الاستخدام</th>
                  <th><FaCalendarAlt className="me-2" /> تاريخ الدخول</th>
                  <th>القيمة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentPurchases.length > 0 ? (
                  currentPurchases.map((purchase) => (
                    <tr key={purchase.id} className="purchase-row">
                      <td className="reference-cell">{purchase.reference || '---'}</td>
                      <td>{purchase.source || '---'}</td>
                      <td>{purchase.usage || '---'}</td>
                      <td>{formatDate(purchase.dateOfEntry)}</td>
                      <td className="value-cell">{purchase.monetaryValue?.toFixed(2) || '0.00'} د.ت</td>
                      <td className="actions-cell">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleViewDetails(purchase)}
                          className="me-2 action-button"
                          title="عرض التفاصيل"
                        >
                          <FaEye />
                        </Button>
                        {purchase.legalFilePath && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleDownloadFile(purchase.id)}
                            className="me-2 action-button"
                            title="تحميل الملف"
                          >
                            <FaDownload />
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(purchase)}
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
                      {filteredPurchases.length === 0 ? 'لا توجد شرائات تطابق معايير البحث' : 'لا توجد شرائات متاحة'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination controls */}
          {totalItems > itemsPerPage && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination className="purchase-pagination">
                <Pagination.First 
                  onClick={() => onPageChange(1)} 
                  disabled={pagination.page === 1}
                />
                <Pagination.Prev 
                  onClick={() => onPageChange(Math.max(1, pagination.page - 1))} 
                  disabled={pagination.page === 1}
                />
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (pagination.page <= 3) {
                    page = i + 1;
                  } else if (pagination.page >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = pagination.page - 2 + i;
                  }
                  
                  return (
                    <Pagination.Item
                      key={page}
                      active={page === pagination.page}
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Pagination.Item>
                  );
                })}
                
                <Pagination.Next 
                  onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))} 
                  disabled={pagination.page === totalPages}
                />
                <Pagination.Last 
                  onClick={() => onPageChange(totalPages)} 
                  disabled={pagination.page === totalPages}
                />
              </Pagination>
            </div>
          )}

          {/* Purchase Details Modal */}
          <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
            <Modal.Header closeButton>
              <Modal.Title>تفاصيل الشراء: {selectedPurchase?.reference || '---'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedPurchase && (
                <div className="purchase-details">
                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>المصدر:</h6>
                      <p>{selectedPurchase.source || '---'}</p>
                    </Col>
                    <Col md={6}>
                      <h6>الاستخدام:</h6>
                      <p>{selectedPurchase.usage || '---'}</p>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>تاريخ الدخول:</h6>
                      <p>{formatDate(selectedPurchase.dateOfEntry)}</p>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>القيمة النقدية:</h6>
                      <p>{selectedPurchase.monetaryValue?.toFixed(2) || '0.00'} د.ت</p>
                    </Col>
                    <Col md={6}>
                      <h6>الوصف:</h6>
                      <p>{selectedPurchase.description || '---'}</p>
                    </Col>
                  </Row>

                  {['عيني', 'نقدي وعيني'].includes(selectedPurchase.suppliesType) && selectedPurchase.items?.length > 0 && (
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
                              {selectedPurchase.items.map((item, index) => (
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
                                  <strong>{calculateItemTotal(selectedPurchase.items).toFixed(2)} د.ت</strong>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </Col>
                    </Row>
                  )}

                  {selectedPurchase.legalFilePath && (
                    <Row className="mb-3">
                      <Col md={12}>
                        <h6>المستند القانوني:</h6>
                        <Button
                          variant="primary"
                          onClick={() => handleDownloadFile(selectedPurchase.id)}
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
              هل أنت متأكد أنك تريد حذف الشراء ذو المرجع: <strong>{purchaseToDelete?.reference || '---'}</strong>؟
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

export default PurchaseTable;