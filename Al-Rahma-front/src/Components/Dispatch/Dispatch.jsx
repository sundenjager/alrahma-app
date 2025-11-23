import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import DispatchFilters from './components/DispatchFilters';
import DispatchTable from './components/DispatchTable';
import DispatchStats from './components/DispatchStats';
import DispatchFormModal from './components/DispatchFormModal';
import ReturnModal from './components/ReturnModal';
import { 
  getAllDispatches, 
  createDispatch, 
  deleteDispatch,
  markDispatchReturned,
  getOngoingDispatches,
  getCompletedDispatches,
  searchDispatches
} from '../../services/medicalEquipmentService';
import './styles/dispatch.css';
import AddButton from '../AddButton';

const Dispatch = () => {
  // إدارة الحالة
  const [dispatches, setDispatches] = useState([]);
  const [filteredDispatches, setFilteredDispatches] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: 'all',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const formInitialState = {
    medicalEquipmentId: '',
    beneficiary: '',
    patientPhone: '',
    patientCIN: '',
    coordinator: '',
    responsiblePerson: '',
    responsiblePersonPhone: '',
    responsiblePersonCIN: '',
    notes: '',
    PDFFile: null,  // Fixed property name
    equipmentReference: '',
    dispatchDate: new Date().toISOString().split('T')[0]
  };

  const [formState, setFormState] = useState(formInitialState);

  // تحميل عمليات الإعارة بناء على علامة التبويب النشطة والمرشحات
  useEffect(() => {
    loadDispatches();
  }, [activeTab, pagination.currentPage, filters]);

  const loadDispatches = async () => {
    setIsLoading(true);
    try {
      let data;
      if (activeTab === 'ongoing') {
        data = await getOngoingDispatches();
      } else if (activeTab === 'history') {
        data = await getCompletedDispatches();
      } else {
        data = await getAllDispatches();
      }
      
      // تطبيق المرشحات
      let filteredData = applyFilters(data);
      
      setDispatches(data);
      setFilteredDispatches(filteredData);
      setPagination(prev => ({
        ...prev,
        totalItems: filteredData.length
      }));
    } catch (error) {
      showAlert('فشل في تحميل عمليات الإعارة', 'danger');
      console.error('خطأ في تحميل عمليات الإعارة:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // تطبيق جميع المرشحات على البيانات
  const applyFilters = (data) => {
    let result = [...data];
    
    // مرشح البحث
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(dispatch => 
        dispatch.beneficiary.toLowerCase().includes(query) ||
        dispatch.coordinator.toLowerCase().includes(query) ||
        dispatch.notes?.toLowerCase().includes(query) ||
        dispatch.responsiblePerson.toLowerCase().includes(query) ||
        dispatch.equipmentReference.toLowerCase().includes(query)
      );
    }
    
    // مرشح نطاق التاريخ
    if (filters.dateRange.start && filters.dateRange.end) {
      result = result.filter(dispatch => {
        const dispatchDate = new Date(dispatch.dispatchDate);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        return dispatchDate >= startDate && dispatchDate <= endDate;
      });
    }
    
    return result;
  };

  // دالة مساعدة للتنبيهات
  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ ...alert, show: false }), 5000);
  };

  // معالجات النماذج المنبثقة
  const handleShowFormModal = () => {
    setFormState(formInitialState);
    setErrors({});
    setShowFormModal(true);
  };

  // معالجات النموذج
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for equipment selection
    if (name === 'medicalEquipmentId') {
      if (!value) {
        // Clear equipment reference if no equipment selected
        setFormState(prev => ({
          ...prev,
          [name]: value,
          equipmentReference: ''
        }));
        return;
      }
    }
    
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleFileChange = (file) => {
  setFormState(prev => ({
    ...prev,
    PDFFile: file  // file is already the File object or null
  }));
};

  const validateForm = () => {
    const newErrors = {};
    
    // Check MedicalEquipmentId first since it's causing the crash
    if (!formState.medicalEquipmentId || formState.medicalEquipmentId === '') {
      newErrors.medicalEquipmentId = 'معرف المعدات الطبية مطلوب';
    }
    
    if (!formState.beneficiary) newErrors.beneficiary = 'اسم المستفيد مطلوب';
    if (!formState.patientPhone) newErrors.patientPhone = 'هاتف المريض مطلوب';
    if (!formState.patientCIN) newErrors.patientCIN = 'بطاقة تعريف المريض مطلوبة';
    if (!formState.coordinator) newErrors.coordinator = 'اسم المنسق مطلوب';
    if (!formState.responsiblePerson) newErrors.responsiblePerson = 'الشخص المسؤول مطلوب';
    if (!formState.responsiblePersonPhone) newErrors.responsiblePersonPhone = 'هاتف الشخص المسؤول مطلوب';
    if (!formState.responsiblePersonCIN) newErrors.responsiblePersonCIN = 'بطاقة تعريف الشخص المسؤول مطلوبة';
    
    // Phone number format validation
    if (formState.patientPhone && !/^[0-9]{8}$/.test(formState.patientPhone)) {
      newErrors.patientPhone = 'تنسيق الهاتف غير صالح (يجب أن يكون 8 أرقام)';
    }

    if (formState.responsiblePersonPhone && !/^[0-9]{8}$/.test(formState.responsiblePersonPhone)) {
      newErrors.responsiblePersonPhone = 'تنسيق الهاتف غير صالح (يجب أن يكون 8 أرقام)';
    }

    // File validation
    if (formState.PDFFile && formState.PDFFile.size > 5 * 1024 * 1024) {
      newErrors.PDFFile = 'حجم الملف يجب أن لا يتجاوز 5MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Validate required fields before creating FormData
      if (!formState.medicalEquipmentId) {
        showAlert('يرجى اختيار المعدات الطبية', 'danger');
        return;
      }
      
      if (!formState.beneficiary) {
        showAlert('يرجى إدخال اسم المستفيد', 'danger');
        return;
      }

      // Append all fields with proper validation
      formData.append('MedicalEquipmentId', formState.medicalEquipmentId.toString());
      formData.append('Beneficiary', formState.beneficiary);
      formData.append('PatientPhone', formState.patientPhone);
      formData.append('PatientCIN', formState.patientCIN);
      formData.append('Coordinator', formState.coordinator);
      formData.append('ResponsiblePerson', formState.responsiblePerson);
      formData.append('ResponsiblePersonPhone', formState.responsiblePersonPhone);
      formData.append('ResponsiblePersonCIN', formState.responsiblePersonCIN);
      formData.append('Notes', formState.notes || '');
      formData.append('EquipmentReference', formState.equipmentReference);
      formData.append('DispatchDate', formState.dispatchDate);
      
      // Handle file upload
      if (formState.PDFFile) {
        // Double-check file validity
        if (formState.PDFFile.size > 5 * 1024 * 1024) {
          showAlert('حجم الملف يجب أن لا يتجاوز 5MB', 'danger');
          return;
        }
        if (formState.PDFFile.type !== 'application/pdf') {
          showAlert('يجب أن يكون الملف من نوع PDF فقط', 'danger');
          return;
        }
        formData.append('PDFFile', formState.PDFFile);
      }

      await createDispatch(formData);
      showAlert('تم إنشاء عملية الإعارة بنجاح');
      loadDispatches();
      setShowFormModal(false);
      setFormState(formInitialState); // Reset form after successful submission
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data || 
                          error.message || 
                          'فشل في حفظ عملية الإعارة';
      showAlert(errorMessage, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // عمليات الإعارة
  const handleDeleteClick = async (id) => {
    setIsLoading(true);
    try {
      await deleteDispatch(id);
      showAlert('تم حذف عملية الإعارة بنجاح', 'success');
      loadDispatches();
    } catch (error) {
      showAlert('فشل في حذف عملية الإعارة', 'danger');
      console.error('Error deleting dispatch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      await deleteDispatch(deleteId);
      showAlert('تم حذف عملية الإعارة بنجاح');
      loadDispatches();
    } catch (error) {
      showAlert('فشل في حذف عملية الإعارة', 'danger');
      console.error('خطأ في حذف عملية الإعارة:', error);
    } finally {
      setIsLoading(false);
      // إخفاء نموذج التأكيد (تنفيذ هذا)
    }
  };

  // In your handleReturnDispatch function:
  const handleReturnDispatch = async (returnDate, returnNotes) => {
    setIsLoading(true);
    try {
      await markDispatchReturned(selectedDispatch.id, { 
        returnDate: new Date(returnDate).toISOString(), // Ensure proper date format
        returnNotes: returnNotes || 'لا توجد ملاحظات' 
      });
      showAlert('تم تسجيل عودة الإعارة');
      loadDispatches();
    } catch (error) {
      showAlert('فشل في تسجيل عودة الإعارة', 'danger');
      console.error('خطأ في عودة الإعارة:', error);
    } finally {
      setIsLoading(false);
      setShowReturnModal(false);
    }
  };

  // معالجات البحث والتصفية
  const handleSearch = (query) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query
    }));
  };

  const handleDateRangeChange = (range) => {
    setFilters(prev => ({
      ...prev,
      dateRange: range
    }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({
      ...prev,
      status
    }));
  };

  // معالجات الترقيم
  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  const handleItemsPerPageChange = (items) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: items,
      currentPage: 1 // العودة إلى الصفحة الأولى
    }));
  };

  // حساب البيانات المرقمة
  const getPaginatedData = () => {
    const { currentPage, itemsPerPage } = pagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDispatches.slice(startIndex, endIndex);
  };

  return (
    <div className="dispatch-container">

      <AddButton handleAdd={handleShowFormModal} />

      <Container fluid className="mt-4">
        {alert.show && (
          <Alert variant={alert.variant} onClose={() => setAlert({ ...alert, show: false })} dismissible>
            {alert.message}
          </Alert>
        )}
        
        <Row className="mb-4">
          <Col>
            <h2 className="dispatch-title">إدارة الإعارات</h2>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col>
            <DispatchStats 
              total={dispatches.length} 
              ongoing={dispatches.filter(d => !d.returnDate).length} 
              completed={dispatches.filter(d => d.returnDate).length} 
            />
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col>
            <DispatchFilters
              onSearch={handleSearch}
              onDateRangeChange={handleDateRangeChange}
              onStatusFilter={handleStatusFilter}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </Col>
        </Row>
        
        <Row>
          <Col>
            {isLoading ? (
              <div className="text-center my-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">جار التحميل...</span>
                </Spinner>
              </div>
            ) : (
              <DispatchTable
                dispatches={getPaginatedData()}
                
                onDelete={handleDeleteClick}
                onReturn={(dispatch) => {
                  setSelectedDispatch(dispatch);
                  setShowReturnModal(true);
                }}
                pagination={pagination}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            )}
          </Col>
        </Row>
      </Container>
      
      <DispatchFormModal
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        onSubmit={handleSubmit}
        formState={formState}
        onChange={handleChange}
        onFileChange={handleFileChange}
        errors={errors}
        isLoading={isLoading}
      />
      
      <ReturnModal
        show={showReturnModal}
        onHide={() => setShowReturnModal(false)}
        onSubmit={handleReturnDispatch}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Dispatch;