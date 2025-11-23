// MedicalEquipmentTable.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Spinner, 
  Badge, 
  Dropdown, 
  Pagination, 
  Modal, 
  Row, 
  Col,
  Form
} from 'react-bootstrap';
import { 
  FaEdit, 
  FaTrash, 
  FaHistory,
  FaDownload,
  FaEllipsisV,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import { 
  deleteEquipment, 
  getDispatchHistory,
  updateEquipmentDetails  
} from '../../services/medicalEquipmentService';
import DispatchHistoryModal from './DispatchHistoryModal';
import './styles/MedicalEquipmentTable.css';
import ExportToExcel from '../ExportToExcel';
import { apiClient } from '../../config/api'; // ← Use centralized client

const MedicalEquipmentTable = ({ equipment, isLoading, onRefresh }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [showDispatches, setShowDispatches] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [dispatchHistory, setDispatchHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedEquipment, setEditedEquipment] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page on data change
  useEffect(() => {
    setCurrentPage(1);
  }, [equipment.length]);

  // Pagination
  const totalItems = equipment.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = equipment.slice(indexOfFirstItem, indexOfLastItem);

  // Fetch dispatch history
  const fetchDispatchHistory = async (equipmentId) => {
    setIsLoadingHistory(true);
    try {
      const history = await getDispatchHistory(equipmentId);
      setDispatchHistory(history);
    } catch (error) {
      console.error('Error fetching dispatch history:', error);
      setDispatchHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleViewDispatches = async (equip) => {
    setSelectedEquipment(equip);
    await fetchDispatchHistory(equip.id);
    setShowDispatches(true);
  };

  const handleDeleteClick = (equip) => {
    setEquipmentToDelete(equip);
    setShowDeleteModal(true);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteEquipment(id);
      onRefresh();
    } catch (error) {
      console.error('Error deleting equipment:', error);
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
    }
  };

  // START QUICK EDIT — ONLY 4 FIELDS
  const handleStartEdit = (equip) => {
    setEditingId(equip.id);
    setEditedEquipment({
      id: equip.id,
      dateOfEntry: equip.dateOfEntry ? formatDateForInput(equip.dateOfEntry) : '',
      dateOfExit: equip.dateOfExit ? formatDateForInput(equip.dateOfExit) : '',
      status: equip.status || 'صالح',
      legalFile: null
    });
  };

  const handleSaveEdit = async () => {
    try {
      const formData = new FormData();
      formData.append('Id', editedEquipment.id);

      if (editedEquipment.dateOfEntry) {
        const d = new Date(editedEquipment.dateOfEntry);
        if (!isNaN(d)) formData.append('DateOfEntry', d.toISOString());
      }
      if (editedEquipment.dateOfExit) {
        const d = new Date(editedEquipment.dateOfExit);
        if (!isNaN(d)) formData.append('DateOfExit', d.toISOString());
      }
      if (editedEquipment.status) {
        formData.append('Status', editedEquipment.status);
      }
      if (editedEquipment.legalFile) {
        formData.append('LegalFile', editedEquipment.legalFile);
      }


      // ✅ Call the service function (it handles FormData conversion)
      await updateEquipmentDetails(editedEquipment.id, editedEquipment);

      // ✅ On 204 success, clear edit mode and refresh
      setEditingId(null);
      setEditedEquipment(null);
      
      // ✅ Refresh the equipment list
      onRefresh();

    } catch (err) {
      const msg = err.response?.data?.title || 'فشل التحديث';
      console.error('UPDATE FAILED:', err.response?.data || err.message);
      alert(msg);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedEquipment(null);
  };

  const handleInputChange = (field, value) => {
    setEditedEquipment(prev => ({ ...prev, [field]: value }));
  };

  // Date formatting
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date) ? '' : date.toLocaleDateString('ar-TN');
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'صالح': return 'success';
      case 'معطب': return 'warning';
      case 'تم اتلافه': return 'danger';
      default: return 'secondary';
    }
  };

  const getAcquisitionTypeBadge = (type) => {
    switch (type) {
      case 'هبات': return 'info';
      case 'تبرعات': return 'info';
      case 'شراء': return 'primary';
      case 'وصية': return 'secondary';
      default: return 'light';
    }
  };

  // Download file using apiClient
  const downloadFile = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await apiClient.get(`/MedicalEquipment/download/${id}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });

      const equip = equipment.find(e => e.id === id);
      const filename = equip?.legalFilePath?.split('/').pop() || 'file';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      alert(error.response?.status === 404 ? 'الملف غير موجود' : 'فشل التحميل');
    }
  };

  const getExportData = () => {
    return equipment.map(equip => ({
      'رقم التسلسل': equip.reference || '',
      'الفئة': equip.category || '',
      'العلامة التجارية': equip.brand || '',
      'المصدر': equip.source || '',
      'نوع المصدر': equip.acquisitionType || '',
      'القيمة المالية': equip.monetaryValue || 0,
      'المستفيد': equip.usage || '',
      'تاريخ الدخول': equip.dateOfEntry ? formatDateForDisplay(equip.dateOfEntry) : '',
      'تاريخ الخروج': equip.dateOfExit ? formatDateForDisplay(equip.dateOfExit) : '',
      'الحالة': equip.status || '',
      'الوصف': equip.description || '',
      'ملف قانوني': equip.legalFilePath ? 'موجود' : 'غير موجود',
      'عدد الإعارات': equip.dispatches?.length || 0
    }));
  };

  const renderTableRow = (equip, index) => (
    <tr key={equip.id}>
      <td>{indexOfFirstItem + index + 1}</td>
      <td className="font-weight-bold">{equip.reference || '-'}</td>
      <td>{equip.category || '-'}</td>
      <td>{equip.brand || '-'}</td>
      <td>{equip.source || '-'}</td>
      <td><Badge bg={getAcquisitionTypeBadge(equip.acquisitionType)}>{equip.acquisitionType || 'غير محدد'}</Badge></td>
      <td>{equip.monetaryValue || 0}</td>
      <td>{equip.usage || '-'}</td>

      {/* Date of Entry */}
      <td>
        {editingId === equip.id ? (
          <Form.Control
            type="date"
            size="sm"
            value={editedEquipment.dateOfEntry || ''}
            onChange={(e) => handleInputChange('dateOfEntry', e.target.value)}
          />
        ) : formatDateForDisplay(equip.dateOfEntry) || '-'}
      </td>

      {/* Date of Exit */}
      <td>
        {editingId === equip.id ? (
          <Form.Control
            type="date"
            size="sm"
            value={editedEquipment.dateOfExit || ''}
            onChange={(e) => handleInputChange('dateOfExit', e.target.value)}
          />
        ) : formatDateForDisplay(equip.dateOfExit) || '-'}
      </td>

      {/* Status */}
      <td>
        {editingId === equip.id ? (
          <Form.Select
            size="sm"
            value={editedEquipment.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
          >
            <option value="صالح">صالح</option>
            <option value="معطب">معطب</option>
            <option value="تم اتلافه">تم اتلافه</option>
          </Form.Select>
        ) : (
          <Badge bg={getStatusBadge(equip.status)}>{equip.status}</Badge>
        )}
      </td>

      <td className="text-truncate" style={{ maxWidth: '150px' }}>
        {equip.description || '-'}
      </td>

      {/* Legal File */}
      <td>
        {editingId === equip.id ? (
          <Form.Control
            type="file"
            size="sm"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) setEditedEquipment(prev => ({ ...prev, legalFile: file }));
            }}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        ) : equip.legalFilePath ? (
          <Button variant="link" size="sm" onClick={() => downloadFile(equip.id)}>
            <FaDownload /> تحميل
          </Button>
        ) : (
          'لا يوجد'
        )}
      </td>

      <td>{equip.dispatches?.length || 0}</td>

      {/* Actions */}
      <td>
        {editingId === equip.id ? (
          <div className="d-flex gap-1">
            <Button variant="success" size="sm" onClick={handleSaveEdit}>
              <FaSave /> حفظ
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
              <FaTimes /> إلغاء
            </Button>
          </div>
        ) : (
          <div className="d-flex gap-1">
            <Button variant="info" size="sm" onClick={() => handleViewDispatches(equip)}>
              <FaHistory />
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="light" size="sm">
                <FaEllipsisV />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleStartEdit(equip)}>
                  <FaEdit className="me-2" /> تعديل سريع
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleDeleteClick(equip)} className="text-danger">
                  <FaTrash className="me-2" /> حذف
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        )}
      </td>
    </tr>
  );

  // Pagination items (unchanged)
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxBefore = Math.floor(maxVisiblePages / 2);
      const maxAfter = Math.ceil(maxVisiblePages / 2) - 1;
      if (currentPage <= maxBefore) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage + maxAfter >= totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxBefore;
        endPage = currentPage + maxAfter;
      }
    }

    if (startPage > 1) {
      items.push(<Pagination.Item key={1} active={1 === currentPage} onClick={() => setCurrentPage(1)}>1</Pagination.Item>);
      if (startPage > 2) items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(<Pagination.Item key={i} active={i === currentPage} onClick={() => setCurrentPage(i)}>{i}</Pagination.Item>);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
      items.push(<Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => setCurrentPage(totalPages)}>{totalPages}</Pagination.Item>);
    }

    return items;
  };

  return (
    <div className="medical-equipment-table-container" dir="rtl">
      {/* Export + Pagination Info */}
      <Row className="mb-3 align-items-center">
        <Col md={6}>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">
              عرض {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} من {totalItems} عنصر
            </span>
            <Form.Select size="sm" value={itemsPerPage} onChange={(e) => { setItemsPerPage(+e.target.value); setCurrentPage(1); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Form.Select>
          </div>
        </Col>
        <Col md={6} className="d-flex justify-content-end">
          <ExportToExcel data={getExportData()} filename="المعدات الطبية" />
        </Col>
      </Row>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">جاري التحميل...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped bordered hover className="medical-equipment-table">
              <thead className="table-header">
                <tr>
                  <th>#</th>
                  <th>رقم التسلسل</th>
                  <th>الفئة</th>
                  <th>العلامة التجارية</th>
                  <th>المصدر</th>
                  <th>نوع المصدر</th>
                  <th>القيمة المالية</th>
                  <th>المستفيد</th>
                  <th>تاريخ الدخول</th>
                  <th>تاريخ الخروج</th>
                  <th>الحالة</th>
                  <th>الوصف</th>
                  <th>الملف القانوني</th>
                  <th>عدد الإعارات</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((equip, index) => renderTableRow(equip, index))
                ) : (
                  <tr>
                    <td colSpan="15" className="text-center py-4">
                      <h5>لا توجد بيانات</h5>
                      <p>لم يتم إضافة أي معدات طبية بعد</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center mt-4 gap-3">
              <Pagination className="mb-0">
                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                {renderPaginationItems()}
                <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
              <span className="text-muted">صفحة {currentPage} من {totalPages}</span>
            </div>
          )}

          {/* Modals */}
          {selectedEquipment && (
            <DispatchHistoryModal
              show={showDispatches}
              onHide={() => setShowDispatches(false)}
              equipment={selectedEquipment}
              dispatches={dispatchHistory}
              isLoading={isLoadingHistory}
            />
          )}

          <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
            <Modal.Header closeButton><Modal.Title>تأكيد الحذف</Modal.Title></Modal.Header>
            <Modal.Body>
              هل أنت متأكد من حذف المعدات: <strong>{equipmentToDelete?.reference}</strong>؟
              <br /><span className="text-danger">لا يمكن التراجع.</span>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>إلغاء</Button>
              <Button 
                variant="danger" 
                onClick={() => handleDelete(equipmentToDelete?.id)}
                disabled={deletingId === equipmentToDelete?.id}
              >
                {deletingId ? 'جاري الحذف...' : 'حذف'}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default MedicalEquipmentTable;