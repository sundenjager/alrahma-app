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
import DonationFilters from './DonationFilters';
import './DonationTable.css';
import { downloadLegalFile } from '../../../services/suppliesService'; // Updated import
import ExportToExcel from '../../ExportToExcel';

const DonationTable = ({ 
  donations: allDonations, 
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
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Apply filters mechanically
  const filteredDonations = useMemo(() => {
    return allDonations.filter(donation => {
      // Search filter (reference or source)
      const matchesSearch = searchTerm === '' || 
        (donation.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (donation.source?.toLowerCase().includes(searchTerm.toLowerCase())));
      
      // Status filter
      const matchesStatus = statusFilter === '' || donation.status === statusFilter;
      
      // Type filter
      const matchesType = typeFilter === '' || donation.suppliesType === typeFilter; // Updated property name
      
      // Date range filter
      const entryDate = donation.dateOfEntry ? new Date(donation.dateOfEntry) : null;
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      const matchesDateFrom = !dateFrom || (entryDate && fromDate && entryDate >= new Date(fromDate.setHours(0, 0, 0, 0)));
      const matchesDateTo = !dateTo || (entryDate && toDate && entryDate <= new Date(toDate.setHours(23, 59, 59, 999)));
      
      return matchesSearch && matchesStatus && matchesType && matchesDateFrom && matchesDateTo;
    });
  }, [allDonations, searchTerm, statusFilter, typeFilter, dateFrom, dateTo]);

  // Pagination calculations
  const itemsPerPage = pagination.pageSize || 10;
  const totalItems = filteredDonations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = pagination.page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDonations = filteredDonations.slice(indexOfFirstItem, indexOfLastItem);

  // Handler functions
  const handleViewDetails = (donation) => {
    setSelectedDonation(donation);
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

  const handleDeleteClick = (donation) => {
    setDonationToDelete(donation);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!donationToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(donationToDelete.id);
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
    return filteredDonations.map(donation => ({
      'المرجع': donation.reference || '',
      'المصدر': donation.source || '',
      'الاستخدام': donation.usage || '',
      'تاريخ الدخول': donation.dateOfEntry ? formatDate(donation.dateOfEntry) : '',
      'تاريخ الخروج': donation.dateOfExit ? formatDate(donation.dateOfExit) : '',
      'نوع التبرع': donation.suppliesType || '', // Updated property name
      'الحالة': donation.status || '',
      'القيمة النقدية': donation.monetaryValue || 0,
      'الوصف': donation.description || '',
      'ملف قانوني': donation.legalFilePath ? 'موجود' : 'غير موجود',
      // Include item details for in-kind donations
      'إجمالي قيمة العناصر': ['عيني', 'نقدي وعيني'].includes(donation.suppliesType) && donation.items?.length > 0 ? // Updated property name
        calculateItemTotal(donation.items).toFixed(2) : 0,
      'عدد العناصر': donation.items?.length || 0
    }));
  };



  return (
    <div className="donation-table-container">
      {/* Export buttons row */}
      <Row className="mb-3">
        <Col className="d-flex justify-content-end gap-2">
          <ExportToExcel 
            data={getExportData()} 
            filename="التبرعات"
            buttonText="Excel تصدير"
            buttonProps={{ 
              size: "sm", 
              variant: "outline-success",
              className: "d-flex align-items-center"
            }}
          />

        </Col>
      </Row>

      <StatsComponent donations={filteredDonations} />
      
      <DonationFilters
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
          <div className="table-responsive donation-data-table">
            <Table striped bordered hover className="donations-table">
              <thead className="table-header">
                <tr>
                  <th><FaFileAlt className="me-2" /> المرجع</th>
                  <th>المصدر</th>
                  <th>الاستخدام</th>
                  <th><FaCalendarAlt className="me-2" /> تاريخ الدخول</th>
                  <th>نوع التبرع</th>
                  <th>الحالة</th>
                  <th>القيمة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentDonations.length > 0 ? (
                  currentDonations.map((donation) => (
                    <tr key={donation.id} className="donation-row">
                      <td className="reference-cell">{donation.reference || '---'}</td>
                      <td>{donation.source || '---'}</td>
                      <td>{donation.usage || '---'}</td>
                      <td>{formatDate(donation.dateOfEntry)}</td>
                      <td>
                        <Badge 
                          pill 
                          bg={donation.suppliesType === 'نقدي' ? 'success' : // Updated property name
                              donation.suppliesType === 'عيني' ? 'info' : 'warning'} // Updated property name
                          className="type-badge"
                        >
                          {donation.suppliesType === 'نقدي' ? ( // Updated property name
                            <FaMoneyBillWave className="me-1" />
                          ) : donation.suppliesType === 'عيني' ? ( // Updated property name
                            <FaBoxOpen className="me-1" />
                          ) : null}
                          {donation.suppliesType || '---'} {/* Updated property name */}
                        </Badge>
                      </td>
                      <td>
                        <Badge 
                          pill 
                          bg={donation.status === 'صالح' ? 'success' : 'danger'}
                          className="status-badge"
                        >
                          {donation.status === 'صالح' ? (
                            <FaCheckCircle className="me-1" />
                          ) : (
                            <FaTimesCircle className="me-1" />
                          )}
                          {donation.status || '---'}
                        </Badge>
                      </td>
                      <td className="value-cell">{donation.monetaryValue?.toFixed(2) || '0.00'} د.ت</td>
                      <td className="actions-cell">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleViewDetails(donation)}
                          className="me-2 action-button"
                          title="عرض التفاصيل"
                        >
                          <FaEye />
                        </Button>
                        {donation.legalFilePath && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleDownloadFile(donation.id)}
                            className="me-2 action-button"
                            title="تحميل الملف"
                          >
                            <FaDownload />
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(donation)}
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
                      {filteredDonations.length === 0 ? 'لا توجد تبرعات تطابق معايير البحث' : 'لا توجد تبرعات متاحة'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination controls */}
          {totalItems > itemsPerPage && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination className="donation-pagination">
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

          {/* Donation Details Modal */}
          <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
            <Modal.Header closeButton>
              <Modal.Title>تفاصيل التبرع: {selectedDonation?.reference || '---'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedDonation && (
                <div className="donation-details">
                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>المصدر:</h6>
                      <p>{selectedDonation.source || '---'}</p>
                    </Col>
                    <Col md={6}>
                      <h6>الاستخدام:</h6>
                      <p>{selectedDonation.usage || '---'}</p>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>تاريخ الدخول:</h6>
                      <p>{formatDate(selectedDonation.dateOfEntry)}</p>
                    </Col>
                    <Col md={6}>
                      <h6>تاريخ الخروج:</h6>
                      <p>{formatDate(selectedDonation.dateOfExit)}</p>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>نوع التبرع:</h6>
                      <p>
                        <Badge 
                          pill 
                          bg={selectedDonation.suppliesType === 'نقدي' ? 'success' : // Updated property name
                              selectedDonation.suppliesType === 'عيني' ? 'info' : 'warning'} // Updated property name
                        >
                          {selectedDonation.suppliesType || '---'} {/* Updated property name */}
                        </Badge>
                      </p>
                    </Col>
                    <Col md={6}>
                      <h6>الحالة:</h6>
                      <p>
                        <Badge 
                          pill 
                          bg={selectedDonation.status === 'صالح' ? 'success' : 'danger'}
                        >
                          {selectedDonation.status || '---'}
                        </Badge>
                      </p>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>القيمة النقدية:</h6>
                      <p>{selectedDonation.monetaryValue?.toFixed(2) || '0.00'} د.ت</p>
                    </Col>
                    <Col md={6}>
                      <h6>الوصف:</h6>
                      <p>{selectedDonation.description || '---'}</p>
                    </Col>
                  </Row>

                  {['عيني', 'نقدي وعيني'].includes(selectedDonation.suppliesType) && selectedDonation.items?.length > 0 && ( // Updated property name
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
                              {selectedDonation.items.map((item, index) => (
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
                                  <strong>{calculateItemTotal(selectedDonation.items).toFixed(2)} د.ت</strong>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </Col>
                    </Row>
                  )}

                  {selectedDonation.legalFilePath && (
                    <Row className="mb-3">
                      <Col md={12}>
                        <h6>المستند القانوني:</h6>
                        <Button
                          variant="primary"
                          onClick={() => handleDownloadFile(selectedDonation.id)}
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
              هل أنت متأكد أنك تريد حذف التبرع ذو المرجع: <strong>{donationToDelete?.reference || '---'}</strong>؟
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

export default DonationTable;