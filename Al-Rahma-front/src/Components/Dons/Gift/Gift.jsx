import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaInfoCircle, FaFileContract } from 'react-icons/fa';
import GiftTable from './GiftTable';
import GiftForm from './GiftForm';
import AddButton from '../../AddButton';
import {
  createDons,
  updateDons,
  getDons,
  deleteDons
} from '../../../services/donsService';
import './gift.css';

const Gift = () => {
  const [dons, setDons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDons, setEditingDons] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const getEmptyForm = () => ({
    reference: null,
    category: null,
    brand: null,
    source: null,
    usage: null,
    dateOfEntry: new Date().toISOString().split('T')[0],
    dateOfExit: null,
    status: 'صالح',
    description: null,
    legalFile: null,
    donsType: 'نقدي',
    donsScope: 'عمومي',
    monetaryValue: '0',
    nature: 'gift',
    

  });

  const [formData, setFormData] = useState(getEmptyForm());

  useEffect(() => {
    fetchDons();
  }, []);

  const fetchDons = async () => {
    try {
      const { data } = await getDons();
      setDons(data);
    } catch (error) {
      console.error('Failed to fetch gifts:', error);
      setApiError('فشل في تحميل الهبات. حاول مرة أخرى.');
    }
  };

  const handleShowModal = () => {
    setFormData(getEmptyForm());
    setEditingDons(null);
    setErrors({});
    setApiError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.files[0],
    });
  };

  const handleEditDons = (dons) => {
    setFormData({
      ...dons,
      dateOfEntry: dons.dateOfEntry?.split('T')[0] || '',
      dateOfExit: dons.dateOfExit?.split('T')[0] || '',
      legalFile: null,
      contractFile: null
    });
    setEditingDons(dons);
    setShowModal(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reference?.trim()) newErrors.reference = 'رقم التسلسل مطلوب';
    if (!formData.category?.trim()) newErrors.category = 'الفئة مطلوبة';
    if (!formData.source?.trim()) newErrors.source = 'المصدر مطلوب';
    if (!formData.usage?.trim()) newErrors.usage = 'المستفيد مطلوب';
    if (!formData.dateOfEntry) newErrors.dateOfEntry = 'تاريخ الدخول مطلوب';
    if (!formData.status) newErrors.status = 'الحالة مطلوبة';
    if (!formData.donsType) newErrors.donsType = 'نوع الهبة مطلوب';
    if (!formData.donsScope) newErrors.donsScope = 'الجهة مطلوبة';

    // Validate monetary value
    if (formData.monetaryValue && isNaN(parseFloat(formData.monetaryValue))) {
      newErrors.monetaryValue = 'يجب أن تكون القيمة رقمية';
    }

    // Validate files for high value gifts
    if (formData.isHighValue) {
      if (!formData.legalFile && !editingDons?.legalFileUrl) {
        newErrors.legalFile = 'الملف القانوني مطلوب للهبات عالية القيمة';
      }
      if (!formData.contractFile && !editingDons?.contractFileUrl) {
        newErrors.contractFile = 'عقد الهبة مطلوب للهبات عالية القيمة';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setIsSubmitting(true);
  setApiError(null);

  try {
    const formDataToSend = new FormData();

    // Required fields - using PascalCase to match backend
    formDataToSend.append('Reference', formData.reference || '');
    formDataToSend.append('Category', formData.category || '');
    formDataToSend.append('Brand', formData.brand || '');
    formDataToSend.append('Source', formData.source || '');
    formDataToSend.append('Usage', formData.usage || '');
    formDataToSend.append('DateOfEntry', new Date(formData.dateOfEntry).toISOString());
    formDataToSend.append('Status', formData.status || 'صالح');
    formDataToSend.append('DonsType', formData.donsType || 'نقدي');
    formDataToSend.append('DonsScope', formData.donsScope || 'عمومي');
    formDataToSend.append('Nature', formData.nature || 'gift');

    // Optional fields
    if (formData.dateOfExit) {
      formDataToSend.append('DateOfExit', new Date(formData.dateOfExit).toISOString());
    }
    if (formData.description) {
      formDataToSend.append('Description', formData.description);
    }
    if (formData.monetaryValue) {
      formDataToSend.append('MonetaryValue', formData.monetaryValue);
    }
    if (formData.legalFile) {
      formDataToSend.append('LegalFile', formData.legalFile);
    }



    const response = editingDons
      ? await updateDons(editingDons.id, formDataToSend)
      : await createDons(formDataToSend);

    fetchDons();
    handleCloseModal();
  } catch (err) {
    console.error('Full error details:', {
      message: err.message,
      response: err.response,
      config: err.config,
      stack: err.stack
    });

    if (err.response?.data?.errors) {
      const backendErrors = err.response.data.errors;
      const frontendErrors = {};
      
      Object.keys(backendErrors).forEach(backendField => {
        const frontendField = backendField.toLowerCase();
        frontendErrors[frontendField] = Array.isArray(backendErrors[backendField])
          ? backendErrors[backendField].join(', ')
          : backendErrors[backendField];
      });

      setErrors(frontendErrors);
    } else {
      setApiError(err.response?.data?.title || 'فشل في حفظ الهبة. حاول مرة أخرى.');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDons(deletingId);
      fetchDons();
    } catch (error) {
      console.error('Failed to delete gift:', error);
      setApiError('فشل في حذف الهبة. حاول مرة أخرى.');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const giftDefinition = (
    <div>
      <h5 className="mb-4">
        <FaFileContract className="me-2" />
        تعريف الهبات 
      </h5>
      <div className="alert alert-warning">
        <strong>ملاحظة هامة:</strong> الهبات  تتطلب توثيقًا قانونيًا كاملاً وعقودًا رسمية
      </div>
      <p className="lead">
        الهبات  هي تبرعات عينية أو نقدية ذات قيمة تقدم للجمعية وتخضع لشروط وإجراءات خاصة.
      </p>
      <div className="border-start border-4 border-primary ps-3 mb-3">
        <h6>خصائص الهبات :</h6>
        <ul className="list-unstyled">
          <li className="mb-2"><strong>✓</strong> تكون عادةً ذات قيمة مالية أو أصول مهمة</li>
          <li className="mb-2"><strong>✓</strong> تتطلب عقدًا رسميًا موقعًا من الطرفين</li>
          <li className="mb-2"><strong>✓</strong> قد تشمل عقارات أو مركبات أو أصول ثابتة</li>
          <li className="mb-2"><strong>✓</strong> يجب توثيقها بسندات قانونية كاملة</li>
        </ul>
      </div>
      <div className="alert alert-info mt-4">
        <h6>متطلبات التسجيل:</h6>
        <ol>
          <li>صورة من العقد الرسمي</li>
          <li>مستندات ملكية الأصول (إن وجدت)</li>
          <li>تقرير تقييم القيمة (للأصول العينية)</li>
          <li>محضر استلام موقع من الطرفين</li>
        </ol>
      </div>
    </div>
  );

  return (
    <div className="gifts-container">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <h1 className="page-title">إدارة الهبات </h1>
          <OverlayTrigger
            placement="right"
            overlay={<Tooltip id="info-tooltip">تعريف الهبات </Tooltip>}
          >
            <Button 
              variant="link" 
              className="p-0 ms-2 text-info" 
              onClick={() => setShowInfoModal(true)}
            >
              <FaInfoCircle size={20} />
            </Button>
          </OverlayTrigger>
        </div>
        <AddButton handleAdd={handleShowModal} />
      </div>

      {apiError && (
        <Alert variant="danger" onClose={() => setApiError(null)} dismissible>
          {apiError}
        </Alert>
      )}

      <GiftTable
        gifts={dons}
        onEdit={handleEditDons}
        onDelete={handleDeleteClick}
      />

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileContract className="me-2" />
            {editingDons ? 'تعديل هبة' : 'إضافة هبة جديدة'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <GiftForm
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleFileChange={handleFileChange}
            isEditing={!!editingDons}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>إلغاء</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : editingDons ? 'تحديث' : 'حفظ'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>تأكيد حذف الهبة</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>تحذير:</strong> حذف الهبة  سيؤدي إلى إزالة جميع السجلات والملفات المرتبطة بها بشكل دائم
          </Alert>
          <p>هل أنت متأكد أنك تريد حذف هذه الهبة ؟ لا يمكن التراجع عن هذا الإجراء.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>إلغاء</Button>
          <Button variant="danger" onClick={confirmDelete}>
            <i className="fas fa-trash me-2"></i>حذف نهائي
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showInfoModal} onHide={() => setShowInfoModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaFileContract className="me-2" />
            نظام إدارة الهبات 
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {giftDefinition}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowInfoModal(false)}>
            فهمت السياسة
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Gift;