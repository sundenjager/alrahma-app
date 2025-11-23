import React, { useState } from 'react';
import { Table, Button, Badge, Spinner, Pagination, Form, Modal, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCheckCircle, FaFilePdf, FaEye, FaFileExcel, FaDownload } from 'react-icons/fa';
import moment from 'moment';
import '../styles/dispatchTable.css';
import DispatchDetailsModal from './DispatchDetailsModal';
import ExportToExcel from '../../ExportToExcel';
import { downloadDispatchFile } from '../../../services/medicalEquipmentService';

const DeleteConfirmationModal = ({ show, onHide, onConfirm, isLoading }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>تأكيد الحذف</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        هل أنت متأكد أنك تريد حذف هذه الإعارة؟ هذا الإجراء لا يمكن التراجع عنه.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          إلغاء
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" />
              <span className="ms-2">جاري الحذف...</span>
            </>
          ) : (
            'حذف'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const DispatchTable = ({ 
  dispatches, 
  onEdit, 
  onDelete, 
  onReturn,
  pagination,
  onPageChange,
  onItemsPerPageChange
}) => {
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(null);

  const handleDownloadFile = async (dispatchId, fileName) => {
    setDownloadingFile(dispatchId);
    try {
      const fileBlob = await downloadDispatchFile(dispatchId);
      
      // Create download link
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `dispatch_${dispatchId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('فشل في تحميل الملف');
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleItemsPerPageChange = (e) => {
    onItemsPerPageChange(Number(e.target.value));
  };

  const handlePageChange = (page) => {
    onPageChange(page);
  };

  const handleViewDetails = (dispatch) => {
    setSelectedDispatch(dispatch);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (id) => {
    const dispatchToDelete = dispatches.find(d => d.id === id);
    setSelectedDispatch(dispatchToDelete);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await onDelete(selectedDispatch.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting dispatch:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Prepare data for export (including modal data)
  const getExportData = () => {
    return dispatches.map(dispatch => ({
      'المعرف': dispatch.id,
      'المستفيد': dispatch.beneficiary,
      'هاتف المستفيد': dispatch.patientPhone,
      'بطاقة تعريف المستفيد': dispatch.patientCIN || '',
      'المعدات': dispatch.equipmentReference,
      'العلامة التجارية': dispatch.medicalEquipment?.brand || '',
      'الفئة': dispatch.medicalEquipment?.category || '',
      'تاريخ الإعارة': moment(dispatch.dispatchDate).format('DD/MM/YYYY'),
      'تاريخ الإرجاع': dispatch.returnDate ? moment(dispatch.returnDate).format('DD/MM/YYYY') : '',
      'الحالة': dispatch.returnDate ? 'مكتمل' : 'قيد التنفيذ',
      'المنسق': dispatch.coordinator || '',
      'الشخص المسؤول': dispatch.responsiblePerson || '',
      'هاتف المسؤول': dispatch.responsiblePersonPhone || '',
      'بطاقة المسؤول': dispatch.responsiblePersonCIN || '',
      'ملاحظات': dispatch.notes || '',
      'ملاحظات الإرجاع': dispatch.returnNotes || '',
      'مسار ملف PDF': dispatch.PDFFilePath || ''
    }));
  };



  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
  const pageNumbers = [];
  
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="dispatch-table-container">
      {/* Export buttons row */}
      <Row className="mb-3">
        <Col className="d-flex justify-content-end gap-2">
          <ExportToExcel 
            data={getExportData()} 
            filename="الإعارات"
            buttonText="Excel تصدير"
            buttonProps={{ 
              size: "sm", 
              variant: "outline-success",
              className: "d-flex align-items-center"
            }}
          />

        </Col>
      </Row>

      <div className="table-responsive">
        <Table striped bordered hover className="dispatch-table">
          <thead>
            <tr>
              <th>#</th>
              <th>المستفيد</th>
              <th>المعدات</th>
              <th>الفئة</th>
              <th>تاريخ الإعارة</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {dispatches.length > 0 ? (
              dispatches.map((dispatch, index) => (
                <tr key={dispatch.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="fw-bold">{dispatch.beneficiary}</div>
                    <div className="text-muted small">{dispatch.patientPhone}</div>
                  </td>
                  <td>
                    <div>{dispatch.equipmentReference}</div>
                    <div className="text-muted small">{dispatch.medicalEquipment?.brand}</div>
                  </td>
                  <td>
                    {dispatch.medicalEquipment?.category}
                  </td>
                  <td>
                    {moment(dispatch.dispatchDate).format('DD/MM/YYYY')}
                    {dispatch.returnDate && (
                      <div className="text-muted small">
                        تم الإرجاع: {moment(dispatch.returnDate).format('DD/MM/YYYY')}
                      </div>
                    )}
                  </td>
                  <td>
                    {dispatch.returnDate ? (
                      <Badge bg="success">مكتمل</Badge>
                    ) : (
                      <Badge bg="warning" text="dark">قيد التنفيذ</Badge>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2 flex-wrap">
                      <Button 
                        variant="outline-info" 
                        size="sm" 
                        onClick={() => handleViewDetails(dispatch)}
                        title="عرض التفاصيل"
                        className="d-flex align-items-center"
                      >
                        <FaEye />
                      </Button>
                      
                      
                      {!dispatch.returnDate && (
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          onClick={() => onReturn(dispatch)}
                          title="تم الإرجاع"
                          className="d-flex align-items-center"
                        >
                          <FaCheckCircle />
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => handleDeleteClick(dispatch.id)} 
                        title="حذف"
                        className="d-flex align-items-center"
                      >
                        <FaTrash />
                      </Button>
                      
                      { (dispatch.PDFFilePath || dispatch.pdfFilePath || dispatch.filePath) && (
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => handleDownloadFile(dispatch.id, `dispatch_${dispatch.equipmentReference}.pdf`)}
                          disabled={downloadingFile === dispatch.id}
                          title="تحميل PDF"
                          className="d-flex align-items-center"
                        >
                          {downloadingFile === dispatch.id ? (
                            <Spinner as="span" animation="border" size="sm" />
                          ) : (
                            <FaDownload />
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  لا توجد عمليات إعارة
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
      
      {dispatches.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="d-flex align-items-center">
            <span className="me-2">عرض</span>
            <Form.Select 
              size="sm" 
              style={{ width: '80px' }} 
              value={pagination.itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </Form.Select>
            <span className="ms-2">صفحات</span>
          </div>
          
          <div>
            <Pagination size="sm">
              <Pagination.First 
                onClick={() => handlePageChange(1)} 
                disabled={pagination.currentPage === 1} 
              />
              <Pagination.Prev 
                onClick={() => handlePageChange(pagination.currentPage - 1)} 
                disabled={pagination.currentPage === 1} 
              />
              
              {pageNumbers.map(number => (
                <Pagination.Item
                  key={number}
                  active={number === pagination.currentPage}
                  onClick={() => handlePageChange(number)}
                >
                  {number}
                </Pagination.Item>
              ))}
              
              <Pagination.Next 
                onClick={() => handlePageChange(pagination.currentPage + 1)} 
                disabled={pagination.currentPage === totalPages} 
              />
              <Pagination.Last 
                onClick={() => handlePageChange(totalPages)} 
                disabled={pagination.currentPage === totalPages} 
              />
            </Pagination>
          </div>
          
          <div>
            عرض من {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} إلى{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} من{' '}
            {pagination.totalItems} صفحة
          </div>
        </div>
      )}

      <DispatchDetailsModal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)} 
        dispatch={selectedDispatch} 
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default DispatchTable;