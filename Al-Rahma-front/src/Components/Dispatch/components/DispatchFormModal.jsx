import React, { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { getAvailableEquipment } from '../../../services/medicalEquipmentService';
import { getCategories } from '../../../services/equipmentCategoryService';

const DispatchFormModal = ({ 
  show, 
  onHide, 
  onSubmit, 
  formState, 
  onChange, 
  onFileChange, 
  errors, 
  isLoading 
}) => {
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState({
    category: '',
    search: ''
  });
  const [fileError, setFileError] = useState('');

  // تحميل المعدات المتاحة والفئات
  useEffect(() => {
    const loadData = async () => {
      setLoadingEquipment(true);
      try {
        const [equipment, cats] = await Promise.all([
          getAvailableEquipment(),
          getCategories()
        ]);
        setAvailableEquipment(equipment);
        setCategories(cats);
      } catch (error) {
        console.error('خطأ في تحميل بيانات المعدات:', error);
      } finally {
        setLoadingEquipment(false);
      }
    };

    if (show) {
      loadData();
      // Reset form when modal opens
      setFileError('');
    }
  }, [show]);

  // تصفية المعدات بناءً على الفئة المحددة ومصطلح البحث
  const filteredEquipment = availableEquipment.filter(equip => {
    const matchesCategory = !equipmentFilter.category || equip.category === equipmentFilter.category;
    const matchesSearch = !equipmentFilter.search || 
      equip.reference.toLowerCase().includes(equipmentFilter.search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEquipmentFilterChange = (e) => {
    const { name, value } = e.target;
    setEquipmentFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');

    if (!file) {
      onFileChange(null);
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setFileError('يجب أن يكون الملف من نوع PDF فقط');
      onFileChange(null);
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('حجم الملف يجب أن لا يتجاوز 5MB');
      onFileChange(null);
      return;
    }

    onFileChange(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFileError('');
    
    // Validate form
    if (!formState.medicalEquipmentId) {
      return;
    }

    if (!formState.dispatchDate) {
      return;
    }

    // Submit the form
    onSubmit(e);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="dispatch-modal">
      <Modal.Header closeButton>
        <Modal.Title>إنشاء إعارة جديدة</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {errors.general && (
            <Alert variant="danger" className="mb-3">
              {errors.general}
            </Alert>
          )}

          <Row>
            <Form.Group as={Col} md={6} controlId="dispatchDate" className="mb-3">
              <Form.Label>تاريخ الإعارة <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="date"
                name="dispatchDate"
                value={formatDateForInput(formState.dispatchDate)}
                onChange={onChange}
                required
                isInvalid={!!errors.dispatchDate}
                max={formatDateForInput(new Date())} // Cannot select future dates
              />
              <Form.Control.Feedback type="invalid">
                {errors.dispatchDate}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group as={Col} md={6} controlId="medicalEquipmentId" className="mb-3">
              <Form.Label>اختر المعدات <span className="text-danger">*</span></Form.Label>
              {loadingEquipment ? (
                <div className="text-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>جاري تحميل المعدات...</span>
                </div>
              ) : (
                <>
                  <Row className="mb-2">
                    <Col md={6}>
                      <Form.Select
                        name="category"
                        value={equipmentFilter.category}
                        onChange={handleEquipmentFilterChange}
                        className="mb-2"
                      >
                        <option value="">كل الفئات</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={6}>
                      <Form.Control
                        type="text"
                        name="search"
                        placeholder="البحث بالرقم المرجعي"
                        value={equipmentFilter.search}
                        onChange={handleEquipmentFilterChange}
                      />
                    </Col>
                  </Row>
                  <Form.Select
                    name="medicalEquipmentId"
                    value={formState.medicalEquipmentId || ''}
                    onChange={(e) => {
                      const selected = availableEquipment.find(
                        eq => eq.id === parseInt(e.target.value)
                      );
                      onChange(e); // تحديث المعرف
                      // تحديث المرجع أيضًا
                      if (selected) {
                        onChange({
                          target: {
                            name: 'equipmentReference',
                            value: selected.reference
                          }
                        });
                      }
                    }}
                    isInvalid={!!errors.medicalEquipmentId}
                    required
                  >
                    <option value="">اختر المعدات</option>
                    {filteredEquipment.length > 0 ? (
                      filteredEquipment.map(equip => (
                        <option key={equip.id} value={equip.id}>
                          {equip.reference} - {equip.category} ({equip.brand || 'بدون علامة'}) - {equip.status}
                        </option>
                      ))
                    ) : (
                      <option disabled>لا توجد معدات متاحة</option>
                    )}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.medicalEquipmentId}
                  </Form.Control.Feedback>
                  {filteredEquipment.length === 0 && equipmentFilter.search && (
                    <Form.Text className="text-muted">
                      لا توجد نتائج للبحث: "{equipmentFilter.search}"
                    </Form.Text>
                  )}
                </>
              )}
            </Form.Group>
          </Row>

          <Row>
            <Form.Group as={Col} md={6} controlId="equipmentReference" className="mb-3">
              <Form.Label>الرقم المرجعي للمعدات <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="equipmentReference"
                value={formState.equipmentReference || ''}
                onChange={onChange}
                isInvalid={!!errors.equipmentReference}
                required
                readOnly
                placeholder="سيتم ملؤه تلقائياً"
              />
              <Form.Control.Feedback type="invalid">
                {errors.equipmentReference}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group as={Col} md={6} controlId="beneficiary" className="mb-3">
              <Form.Label>اسم المستفيد <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="beneficiary"
                value={formState.beneficiary || ''}
                onChange={onChange}
                isInvalid={!!errors.beneficiary}
                required
                placeholder="أدخل اسم المستفيد"
              />
              <Form.Control.Feedback type="invalid">
                {errors.beneficiary}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group as={Col} md={6} controlId="patientPhone" className="mb-3">
              <Form.Label>هاتف المستفيد <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="tel"
                name="patientPhone"
                value={formState.patientPhone || ''}
                onChange={onChange}
                isInvalid={!!errors.patientPhone}
                required
                pattern="[0-9]{8}"
                placeholder="12345678"
                maxLength="8"
              />
              <Form.Control.Feedback type="invalid">
                {errors.patientPhone || 'يجب أن يكون 8 أرقام'}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group as={Col} md={6} controlId="patientCIN" className="mb-3">
              <Form.Label>بطاقة تعريف المستفيد <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="patientCIN"
                value={formState.patientCIN || ''}
                onChange={onChange}
                isInvalid={!!errors.patientCIN}
                required
                placeholder="أدخل رقم البطاقة"
              />
              <Form.Control.Feedback type="invalid">
                {errors.patientCIN}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group as={Col} md={6} controlId="coordinator" className="mb-3">
              <Form.Label>المنسق <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="coordinator"
                value={formState.coordinator || ''}
                onChange={onChange}
                isInvalid={!!errors.coordinator}
                required
                placeholder="أدخل اسم المنسق"
              />
              <Form.Control.Feedback type="invalid">
                {errors.coordinator}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group as={Col} md={6} controlId="responsiblePerson" className="mb-3">
              <Form.Label>الشخص المسؤول <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="responsiblePerson"
                value={formState.responsiblePerson || ''}
                onChange={onChange}
                isInvalid={!!errors.responsiblePerson}
                required
                placeholder="أدخل اسم الشخص المسؤول"
              />
              <Form.Control.Feedback type="invalid">
                {errors.responsiblePerson}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group as={Col} md={6} controlId="responsiblePersonPhone" className="mb-3">
              <Form.Label>هاتف الشخص المسؤول <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="tel"
                name="responsiblePersonPhone"
                value={formState.responsiblePersonPhone || ''}
                onChange={onChange}
                isInvalid={!!errors.responsiblePersonPhone}
                required
                pattern="[0-9]{8}"
                placeholder="12345678"
                maxLength="8"
              />
              <Form.Control.Feedback type="invalid">
                {errors.responsiblePersonPhone || 'يجب أن يكون 8 أرقام'}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group as={Col} md={6} controlId="responsiblePersonCIN" className="mb-3">
              <Form.Label>بطاقة تعريف الشخص المسؤول <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="responsiblePersonCIN"
                value={formState.responsiblePersonCIN || ''}
                onChange={onChange}
                isInvalid={!!errors.responsiblePersonCIN}
                required
                placeholder="أدخل رقم البطاقة"
              />
              <Form.Control.Feedback type="invalid">
                {errors.responsiblePersonCIN}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Form.Group controlId="notes" className="mb-3">
            <Form.Label>ملاحظات</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="notes"
              value={formState.notes || ''}
              onChange={onChange}
              placeholder="أدخل أي ملاحظات إضافية..."
            />
          </Form.Group>

          <Form.Group controlId="PDFFile" className="mb-3">
            <Form.Label>ملف الإعارة (PDF) - اختياري</Form.Label>
            <Form.Control 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              isInvalid={!!fileError}
            />
            <Form.Text className="text-muted">
              الحد الأقصى لحجم الملف: 5MB. المسموح: PDF فقط
            </Form.Text>
            {formState.PDFFile && (
              <div className="mt-2">
                <small className="text-success">
                  ✓ الملف المحدد: {formState.PDFFile.name} 
                  ({(formState.PDFFile.size / 1024 / 1024).toFixed(2)} MB)
                </small>
              </div>
            )}
            {fileError && (
              <Form.Control.Feedback type="invalid" className="d-block">
                {fileError}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isLoading}>
            إلغاء
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isLoading || loadingEquipment}
            className="px-4"
          >
            {isLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">جاري الحفظ...</span>
              </>
            ) : (
              'إنشاء إعارة'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DispatchFormModal;