import React, { useState } from 'react';
import { Table, Button, ButtonGroup, Badge, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSearch, FaDownload, FaEye } from 'react-icons/fa';
import ActImmFilters from './ActImmFilters';
import ActImmPagination from './ActImmPagination';
import ExportToExcel from '../ExportToExcel';
import actImmService from '../../services/actImmService';
import './actImm.css';

const ActImmTable = ({ 
  actimms, 
  onEdit, 
  onDelete, 
  filters, 
  onFilterChange,
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
  categories
}) => {
  const [downloadingFile, setDownloadingFile] = useState(null);

  // Function to extract date part from datetime string
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  };

  const handleDownload = async (filePath, assetName, assetId) => {
    try {
      setDownloadingFile(assetId);
      await actImmService.downloadFile(filePath, `${assetName}_document.pdf`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('فشل في تحميل الملف');
    } finally {
      setDownloadingFile(null);
    }
  };

  const handlePreview = async (filePath, assetId) => {
    try {
      setDownloadingFile(assetId);
      await actImmService.previewFile(filePath);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('فشل في معاينة الملف');
    } finally {
      setDownloadingFile(null);
    }
  };

  const statusVariant = (status) => {
    switch(status) {
      case 'صالح': return 'success';
      case 'معطب': return 'warning';
      case 'تم إتلافه': return 'danger';
      default: return 'secondary';
    }
  };

  const statuses = [...new Set(actimms.map(a => a.status))];
  const sourceNatures = [...new Set(actimms.map(a => a.sourceNature))];

  // Prepare data for export (fetch all data without pagination for export)
  const getExportData = () => {
    return actimms.map(actimm => ({
      'المعرف': actimm.id || '',
      'الفئة': actimm.category || '',
      'العلامة التجارية': actimm.brand || '',
      'رقم التسلسل': actimm.number || '',
      'القيمة المالية': actimm.monetaryValue ? `${actimm.monetaryValue.toFixed(3)} د.ت` : '',
      'موقع الاستخدام': actimm.usageLocation || '',
      'المصدر': actimm.source || '',
      'طبيعة المصدر': actimm.sourceNature || '',
      'تاريخ الدخول': formatDate(actimm.dateOfDeployment),
      'تاريخ الخروج': formatDate(actimm.dateOfEnd),
      'الحالة': actimm.status || '',
      'الملف القانوني': actimm.legalFilePath ? 'موجود' : 'غير موجود',
      'الوصف': actimm.description || ''
    }));
  };



  // Calculate display indices
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(indexOfFirstItem + actimms.length, totalCount);

  return (
    <div className="actimm-table-container">
      {/* Export buttons row */}
      <Row className="mb-3">
        <Col className="d-flex justify-content-end gap-2">
          <ExportToExcel 
            data={getExportData()} 
            filename="الأصول الثابتة"
            buttonText="Excel تصدير"
            buttonProps={{ 
              size: "sm", 
              variant: "outline-success",
              className: "d-flex align-items-center"
            }}
          />

        </Col>
      </Row>

      <ActImmFilters 
        filters={filters}
        onFilterChange={onFilterChange}
        categories={categories}
        statuses={statuses}
        sourceNatures={sourceNatures}
      />
      
      <div className="table-responsive">
        <Table striped bordered hover className="actimm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>الفئة</th>
              <th>العلامة التجارية</th>
              <th>رقم التسلسل</th>
              <th>القيمة المالية</th>
              <th>موقع الاستخدام</th>
              <th>المصدر</th>
              <th>طبيعة المصدر</th>
              <th>تاريخ الدخول</th>
              <th>تاريخ الخروج</th>
              <th>الحالة</th>
              <th>الملف القانوني</th>
              <th>العمليات</th>
            </tr>
          </thead>
          <tbody>
            {actimms.length > 0 ? (
              actimms.map((actimm, index) => (
                <tr key={actimm.id || index}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{actimm.category}</td>
                  <td>{actimm.brand}</td>
                  <td>{actimm.number}</td>
                  <td>{actimm.monetaryValue ? `${actimm.monetaryValue.toFixed(3)} د.ت` : '0.000 د.ت'}</td>
                  <td>{actimm.usageLocation}</td>
                  <td>{actimm.source}</td>
                  <td>{actimm.sourceNature}</td>
                  <td>{formatDate(actimm.dateOfDeployment)}</td>
                  <td>{formatDate(actimm.dateOfEnd)}</td>
                  <td>
                    <Badge pill bg={statusVariant(actimm.status)}>
                      {actimm.status}
                    </Badge>
                  </td>
                  <td>
                    {actimm.legalFilePath ? (
                      <ButtonGroup size="sm">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handlePreview(actimm.legalFilePath, actimm.id)}
                          disabled={downloadingFile === actimm.id}
                          title="معاينة الملف"
                          className="d-flex align-items-center"
                        >
                          {downloadingFile === actimm.id ? (
                            <div className="spinner-border spinner-border-sm" role="status">
                              <span className="visually-hidden">جاري التحميل...</span>
                            </div>
                          ) : (
                            <FaEye className="me-1" />
                          )}
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          onClick={() => handleDownload(actimm.legalFilePath, actimm.brand, actimm.id)}
                          disabled={downloadingFile === actimm.id}
                          title="تحميل الملف"
                          className="d-flex align-items-center"
                        >
                          {downloadingFile === actimm.id ? (
                            <div className="spinner-border spinner-border-sm" role="status">
                              <span className="visually-hidden">جاري التحميل...</span>
                            </div>
                          ) : (
                            <FaDownload className="me-1" />
                          )}
                        </Button>
                      </ButtonGroup>
                    ) : (
                      <span className="text-muted">لا يوجد</span>
                    )}
                  </td>
                  <td>
                    <ButtonGroup size="sm">
                      <Button 
                        variant="outline-primary" 
                        onClick={() => onEdit(actimm.id)}
                        title="تعديل"
                        className="d-flex align-items-center"
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        onClick={() => onDelete(actimm.id)}
                        title="حذف"
                        className="d-flex align-items-center"
                      >
                        <FaTrash />
                      </Button>
                    </ButtonGroup>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="13" className="text-center text-muted py-4">
                  <FaSearch size={24} className="mb-2" />
                  <p>لا توجد بيانات متاحة</p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {totalCount > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="showing-items">
            عرض {indexOfFirstItem + 1} إلى {indexOfLastItem} من {totalCount} عنصر
          </div>
          <ActImmPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default ActImmTable;