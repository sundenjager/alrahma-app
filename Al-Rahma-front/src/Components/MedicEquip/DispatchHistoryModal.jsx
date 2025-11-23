import React, { useState } from 'react';
import { Modal, Button, Table, Spinner, Badge, Row } from 'react-bootstrap';
import { FaDownload, FaFilePdf, FaHistory, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

const DispatchHistoryModal = ({ 
  show, 
  onHide, 
  equipment,
  dispatches = [], 
  isLoading = false 
}) => {
  const [downloadingFile, setDownloadingFile] = useState(null);

  const handleDownloadFile = async (filePath, dispatchId) => {
    if (!filePath) {
      toast.error('لا يوجد ملف مرفق');
      return;
    }

    setDownloadingFile(dispatchId);
    try {
      // Implement actual file download here
      const response = await fetch(filePath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dispatch_${dispatchId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('تم تحميل الملف بنجاح');
    } catch (error) {
      toast.error('فشل في تحميل الملف');
      console.error('خطأ في تحميل الملف:', error);
    } finally {
      setDownloadingFile(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-TN'); // Arabic date format
    } catch {
      return dateString;
    }
  };

  const getReturnStatus = (returnDate) => {
    return returnDate ? (
      <Badge bg="success" className="fw-normal">تم الاسترجاع</Badge>
    ) : (
      <Badge bg="warning" className="fw-normal">قيد الإعارة</Badge>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="xl" 
      centered
      backdrop={true}
      keyboard={true}
      dir="rtl"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="text-primary">
          <FaHistory className="me-2" />
          سجل إعارات المعدات
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="pt-0">
        {equipment && (
          <div className="mb-3 p-3 bg-light rounded">
            <h6>معلومات المعدات:</h6>
            <div className="row">
              <div className="col-md-4">
                <strong>رقم التسلسل:</strong> {equipment.reference}
              </div>
              <div className="col-md-4">
                <strong>الفئة:</strong> {equipment.category}
              </div>
              <div className="col-md-4">
                <strong>العلامة التجارية:</strong> {equipment.brand || 'غير محدد'}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">جاري تحميل بيانات الإعارات...</p>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                عدد الإعارات: <span className="text-primary">{dispatches?.length || 0}</span>
              </h5>
            </div>

            {dispatches && dispatches.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th width="5%">#</th>
                      <th width="10%">تاريخ الإعارة</th>
                      <th width="10%">تاريخ الاسترجاع</th>
                      <th width="8%">الحالة</th>
                      <th width="12%">المستفيد</th>
                      <th width="10%">هاتف المريض</th>
                      <th width="10%">بطاقة المريض</th>
                      <th width="10%">المسؤول</th>
                      <th width="10%">هاتف المسؤول</th>
                      <th width="10%">بطاقة المسؤول</th>
                      <th width="5%">المرفق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatches.map((dispatch, index) => (
                      <tr key={dispatch.id || index}>
                        <td>{index + 1}</td>
                        <td>{formatDate(dispatch.dispatchDate)}</td>
                        <td>{formatDate(dispatch.returnDate)}</td>
                        <td>{getReturnStatus(dispatch.returnDate)}</td>
                        <td>{dispatch.beneficiary || '-'}</td>
                        <td>{dispatch.patientPhone || '-'}</td>
                        <td>{dispatch.patientCIN || '-'}</td>
                        <td>{dispatch.coordinator || '-'}</td>
                        <td>{dispatch.responsiblePersonPhone || '-'}</td>
                        <td>{dispatch.responsiblePersonCIN || '-'}</td>
                        <td className="text-center">
                          {dispatch.PDFFilePath ? (
                            <Button
                              variant="link"
                              className="p-0 text-primary"
                              onClick={() => handleDownloadFile(dispatch.PDFFilePath, dispatch.id)}
                              disabled={downloadingFile === dispatch.id}
                              title="تحميل الملف"
                            >
                              {downloadingFile === dispatch.id ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <FaFilePdf size={20} />
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted small">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                لا توجد إعارات مسجلة لهذه المعدات
              </div>
            )}
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer className="border-0">
        <Button 
          variant="outline-secondary" 
          onClick={onHide}
          className="px-4"
        >
          إغلاق
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DispatchHistoryModal;