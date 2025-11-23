import React, { useState } from 'react';
import { Button, Modal, Col, Row, Form } from 'react-bootstrap';
import AddButton from '../AddButton';
import DonsTable from './DonsTable';

const Dons = () => {
  const [dons, setDons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    id: '',
    reference: '',
    categorie: '',
    brand: '',
    sourceNature: '',
    source: '',
    usage: '',
    dateOfEntry: '',
    dateOfExit: '',
    status: 'صالح',
    description: '',
    legalFile: null,
    isMonetary: 'نقدي',
    isPrivate: 'عمومي',
    monetaryValue: '',
  });

  const handleShowModal = () => {
    setFormData({
      id: '',
      reference: '',
      categorie: '',
      brand: '',
      sourceNature: '',
      source: '',
      usage: '',
      dateOfEntry: '',
      dateOfExit: '',
      status: 'صالح',
      description: '',
      legalFile: null,
      isMonetary: 'نقدي',
      isPrivate: 'عمومي',
      monetaryValue: '',
    });
    setEditingIndex(null);
    setErrors({});
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reference) newErrors.reference = 'رقم التسلسل مطلوب';
    if (!formData.categorie) newErrors.categorie = 'الفئة مطلوبة';
    if (!formData.sourceNature) newErrors.sourceNature = 'طبيعة المصدر مطلوبة';
    if (!formData.brand) newErrors.brand = 'العلامة التجارية مطلوبة';
    if (!formData.source) newErrors.source = 'المصدر مطلوب';
    if (!formData.usage) newErrors.usage = 'الاستخدام مطلوب';
    if (!formData.dateOfEntry) newErrors.dateOfEntry = 'تاريخ الدخول مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    const newDon = {
      ...formData,
      dateOfExit: formData.isFixedAsset ? '' : formData.dateOfExit,
      status: formData.isFixedAsset ? 'Fixed' : 'Not Fixed',
    };
  
    if (editingIndex === null) {
      setDons((prevDons) => [...prevDons, newDon]);
    } else {
      const updatedDons = [...dons];
      updatedDons[editingIndex] = newDon;
      setDons(updatedDons);
    }
    handleCloseModal();
  };
  
  return (
    <div className="position-relative">
      <div className="page-title">
        <h1> التبرعات والمساعدات و الهبات و الوصايا</h1>
      </div>

      <DonsTable dons={dons} />

      <AddButton handleAdd={handleShowModal} />

      {/* Add/Edit Don Modal */}
      <Modal show={showModal} onHide={handleCloseModal} dialogClassName='add-modal'>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingIndex === null ? 'إضافة تبرع' : 'تعديل التبرع'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Form.Group as={Col} md={4} controlId="reference">
                <Form.Label>رقم التسلسل</Form.Label>
                <Form.Control
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  isInvalid={!!errors.reference}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.reference}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md={4} controlId="categorie">
                <Form.Label>الفئة</Form.Label>
                <Form.Control
                  as="select"
                  name="categorie"
                  value={formData.categorie} // Value is an array for multiple select
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categorie: Array.from(e.target.selectedOptions, option => option.value), // Convert selected options to array
                    })
                  }
                  isInvalid={!!errors.categorie}
                >
                  <option value="Electronics">إلكترونيات</option>
                  <option value="Furniture">أثاث</option>
                  <option value="Clothing">ملابس</option>
                  <option value="Medical Equipment">معدات طبية</option>
                  <option value="Stationery">أدوات مكتبية</option>
                  <option value="Vehicles">مركبات</option>
                </Form.Control>
                <Form.Control.Feedback type="invalid">
                  {errors.categorie}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md={4} controlId="sourceNature">
                <Form.Label>طبيعة المصدر</Form.Label>
                <Form.Control
                  as="select"
                  name="sourceNature"
                  value={formData.sourceNature}
                  onChange={handleChange}
                  isInvalid={!!errors.sourceNature}
                >
                  <option value="">اختر طبيعة المصدر</option>
                  <option value="هبة">هبة</option>
                  <option value="مساعدة">مساعدة</option>
                  <option value="تبرع">تبرع</option>
                  <option value="وصية">وصية</option>
                </Form.Control>
                <Form.Control.Feedback type="invalid">
                  {errors.sourceNature}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col} md={4} controlId="isMonetary">
                <Form.Label>نوع التبرع</Form.Label>
                <Form.Control
                  as="select"
                  name="isMonetary"
                  value={formData.isMonetary}
                  onChange={handleChange}
                >
                  <option value="نقدي">نقدي</option>
                  <option value="عيني">عيني</option>
                </Form.Control>
              </Form.Group>
              <Form.Group as={Col} md={4} controlId="isPrivate">
                <Form.Label>خاص / عمومي</Form.Label>
                <Form.Control
                  as="select"
                  name="isPrivate"
                  value={formData.isPrivate}
                  onChange={handleChange}
                >
                  <option value="خاص">خاص</option>
                  <option value="عمومي">عمومي</option>
                </Form.Control>
              </Form.Group>
              <Form.Group as={Col} md={4} controlId="monetaryValue">
                <Form.Label>القيمة النقدية بالدينار</Form.Label>
                <Form.Control
                  type="number"
                  name="monetaryValue"
                  value={formData.monetaryValue}
                  onChange={handleChange}
                  isInvalid={!!errors.monetaryValue}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.monetaryValue}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} md={4} controlId="brand">
                <Form.Label>العلامة التجارية</Form.Label>
                <Form.Control
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  isInvalid={!!errors.brand}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.brand}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md={4} controlId="source">
                <Form.Label>المصدر</Form.Label>
                <Form.Control
                  type="text"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  isInvalid={!!errors.source}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.source}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md={4} controlId="usage">
                <Form.Label>المستفيد</Form.Label>
                <Form.Control
                  as="select"
                  name="usage"
                  value={formData.usage}
                  onChange={handleChange}
                  isInvalid={!!errors.usage}
                >
                  <option value="">اختر المستفيد</option>
                  <option value="للتبرع">للتبرع</option>
                  <option value="للاعارة">للاعارة</option>
                </Form.Control>
                <Form.Control.Feedback type="invalid">
                  {errors.usage}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col} md={4} controlId="dateOfEntry">
                <Form.Label>تاريخ الدخول</Form.Label>
                <Form.Control
                  type="date"
                  name="dateOfEntry"
                  value={formData.dateOfEntry}
                  onChange={handleChange}
                  isInvalid={!!errors.dateOfEntry}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.dateOfEntry}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md={4} controlId="dateOfExit">
                <Form.Label>تاريخ الخروج</Form.Label>
                <Form.Control
                  type="date"
                  name="dateOfExit"
                  value={formData.dateOfExit}
                  onChange={handleChange}
                  isInvalid={!!errors.dateOfExit}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.dateOfExit}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col} md={4} controlId="status">
                <Form.Label>الحالة</Form.Label>
                <Form.Control
                  as="select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="صالح">صالح</option>
                  <option value="معطب">معطب</option>
                  <option value="تم إتلافه">تم إتلافه</option>
                </Form.Control>
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col} md={12} controlId="description">
                <Form.Label>المواصفات و الملاحظات</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group as={Col} md={12} controlId="legalFile">
                <Form.Label>الملف القانوني</Form.Label>
                <Form.Control
                  type="file"
                  name="legalFile"
                  onChange={handleFileChange}
                />
              </Form.Group>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" className='custom-btn'>
              {editingIndex === null ? 'إضافة' : 'تحديث'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Dons;
