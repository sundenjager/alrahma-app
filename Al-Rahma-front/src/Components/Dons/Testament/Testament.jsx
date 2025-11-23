import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaInfoCircle } from 'react-icons/fa';
import TestamentTable from './TestamentTable';
import TestamentForm from './TestamentForm';
import AddButton from '../../AddButton';
import {
  createDons,
  updateDons,
  getDons,
  deleteDons
} from '../../../services/donsService';
import './testament.css';

const Testament = () => {
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
  donsScope: 'خاص',
  monetaryValue: '0',
  nature: 'testament',
  testatorNationality: null,
  testamentNature: null,
  testamentStatus: null,
  registrationDate: new Date().toISOString().split('T')[0],
  executionDate: null
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
      console.error('Failed to fetch testament:', error);
      setApiError('فشل في تحميل الوصايا. حاول مرة أخرى.');
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
      legalFile: e.target.files[0],
    });
  };

  const handleEditDons = (dons) => {
    setFormData({
      ...dons,
      dateOfEntry: dons.dateOfEntry?.split('T')[0] || '',
      dateOfExit: dons.dateOfExit?.split('T')[0] || '',
      registrationDate: dons.registrationDate?.split('T')[0] || '',
      executionDate: dons.executionDate?.split('T')[0] || '',
      legalFile: null,
    });
    setEditingDons(dons);
    setShowModal(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reference?.trim()) newErrors.reference = 'رقم التسلسل مطلوب';
    if (!formData.category?.trim()) newErrors.category = 'الفئة مطلوبة';
    if (!formData.brand?.trim()) newErrors.brand = 'العلامة التجارية مطلوبة';
    if (!formData.source?.trim()) newErrors.source = 'المصدر مطلوب';
    if (!formData.usage?.trim()) newErrors.usage = 'المستفيد مطلوب';
    if (!formData.dateOfEntry) newErrors.dateOfEntry = 'تاريخ الدخول مطلوب';
    if (!formData.status) newErrors.status = 'الحالة مطلوبة';
    if (!formData.donsType) newErrors.donsType = 'نوع الوصية مطلوب';
    if (!formData.donsScope) newErrors.donsScope = 'الجهة مطلوبة';
    if (!formData.nature) newErrors.nature = 'الطبيعة مطلوبة';
    if (formData.dateOfExit && new Date(formData.dateOfExit) < new Date(formData.dateOfEntry)) {
      newErrors.dateOfExit = 'تاريخ الخروج يجب أن يكون بعد تاريخ الدخول';
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'الوصف يجب أن لا يتجاوز 500 حرف';
    }
    if (formData.legalFile && !formData.legalFile.name.endsWith('.pdf')) {
      newErrors.legalFile = 'الملف القانوني يجب أن يكون بصيغة PDF';
    }
    if (formData.monetaryValue && formData.monetaryValue.trim() === '') {
      newErrors.monetaryValue = 'القيمة مطلوبة';
    }


    if (formData.monetaryValue && isNaN(parseFloat(formData.monetaryValue))) {
      newErrors.monetaryValue = 'يجب أن تكون القيمة رقمية';
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

    const fieldsToAdd = {
      Reference: formData.reference,
      Category: formData.category,
      Brand: formData.brand,
      Source: formData.source,
      Usage: formData.usage,
      DateOfEntry: new Date(formData.dateOfEntry).toISOString(),
      Status: formData.status,
      Description: formData.description,
      DonsType: formData.donsType,
      DonsScope: formData.donsScope,
      Nature: formData.nature,
      TestatorNationality: formData.testatorNationality,
      TestamentNature: formData.testamentNature,
      TestamentStatus: formData.testamentStatus,
      RegistrationDate: formData.registrationDate ? new Date(formData.registrationDate).toISOString() : new Date().toISOString(),
    };

    if (formData.dateOfExit) {
      fieldsToAdd.DateOfExit = new Date(formData.dateOfExit).toISOString();
    }

    if (formData.executionDate) {
      fieldsToAdd.ExecutionDate = new Date(formData.executionDate).toISOString();
    }

    if (!isNaN(parseFloat(formData.monetaryValue))) {
      fieldsToAdd.MonetaryValue = parseFloat(formData.monetaryValue);
    }

    Object.entries(fieldsToAdd).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

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
      const errorMap = { 
          Reference: 'reference',
          Category: 'category',
          Brand: 'brand',
          Source: 'source',
          Usage: 'usage',
          DateOfEntry: 'dateOfEntry',
          DateOfExit: 'dateOfExit',
          Status: 'status',
          Description: 'description',
          LegalFile: 'legalFile',
          DonsType: 'donsType',
          DonsScope: 'donsScope',
          MonetaryValue: 'monetaryValue',
          Nature: 'nature',
          TestatorNationality: 'testatorNationality',
          TestamentNature: 'testamentNature',
          TestamentStatus: 'testamentStatus',
          RegistrationDate: 'registrationDate',
          ExecutionDate: 'executionDate'

        };

        const frontendErrors = {};
        Object.keys(backendErrors).forEach(backendField => {
          const frontendField = errorMap[backendField] || backendField.toLowerCase();
          frontendErrors[frontendField] = Array.isArray(backendErrors[backendField])
            ? backendErrors[backendField].join(', ')
            : backendErrors[backendField];
        });

        setErrors(frontendErrors);
      } else {
        setApiError(err.response?.data?.title || 'فشل في حفظ الوصية. حاول مرة أخرى.');
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
      console.error('Failed to delete testament:', error);
      setApiError('فشل في حذف الوصية. حاول مرة أخرى.');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const testamentDefinition = (
    <div>
      <h5>تعريف الوصايا</h5>
      <p>
        الوصايا هي تبرعات يتم تحديدها وفقاً لرغبة المتوفى كما وردت في وصيته القانونية، حيث يتم تخصيص جزء من ممتلكاته أو أمواله للجمعية بعد وفاته.
      </p>
      <p>
        خصائص الوصايا:
      </p>
      <ul>
        <li>تتم بناءً على وثيقة وصية قانونية</li>
        <li>تكون نافذة بعد وفاة الواهب</li>
        <li>قد تكون نقدية أو عينية (عقارات، مجوهرات، إلخ)</li>
        <li>تخضع للشروط والقيود التي حددها الواهب في وصيته</li>
      </ul>
      <p>
        يجب توثيق كل وصية بالوثائق القانونية الكاملة وتنفيذها وفقاً للشروط القانونية والشرعية.
      </p>
    </div>
  );

  return (
    <div className="testament-container">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <h1 className="page-title">إدارة الوصايا</h1>
          <OverlayTrigger
            placement="right"
            overlay={<Tooltip id="info-tooltip">تعريف الوصايا</Tooltip>}
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

      <TestamentTable
        testament={dons}
        onEdit={handleEditDons}
        onDeleteSuccess={fetchDons}
      />

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingDons ? 'تعديل وصية' : 'إضافة وصية جديدة'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TestamentForm
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleFileChange={handleFileChange}
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
        <Modal.Header closeButton>
          <Modal.Title>تأكيد الحذف</Modal.Title>
        </Modal.Header>
        <Modal.Body>هل أنت متأكد أنك تريد حذف هذه الوصية؟ لا يمكن التراجع عن هذا الإجراء.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>إلغاء</Button>
          <Button variant="danger" onClick={confirmDelete}>حذف</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showInfoModal} onHide={() => setShowInfoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>معلومات عن الوصايا</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {testamentDefinition}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowInfoModal(false)}>
            فهمت
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Testament;