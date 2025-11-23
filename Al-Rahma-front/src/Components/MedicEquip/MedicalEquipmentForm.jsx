import React, { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import './styles/MedicalEquipmentForm.css';

const MedicalEquipmentForm = ({ 
  show, 
  onHide, 
  initialData, 
  onSubmit, 
  categories,
  onAddCategory 
}) => {
  const [formData, setFormData] = useState({
    category: '',
    brand: '',
    source: '',
    usage: 'للاعارة',
    dateOfEntry: new Date().toISOString().split('T')[0],
    monetaryValue: 0,
    dateOfExit: '',
    acquisitionType: 'هبات',
    status: 'صالح',
    description: '',
    legalFile: null,
    quantity: 1 // Add quantity field, default to 1
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || '',
        brand: initialData.brand || '',
        source: initialData.source || '',
        usage: initialData.usage || 'للاعارة',
        dateOfEntry: initialData.dateOfEntry ? 
          new Date(initialData.dateOfEntry).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        monetaryValue: initialData.monetaryValue || 0,
        dateOfExit: initialData.dateOfExit ? 
          new Date(initialData.dateOfExit).toISOString().split('T')[0] : '',
        acquisitionType: initialData.acquisitionType || 'هبات',
        status: initialData.status || 'صالح',
        description: initialData.description || '',
        legalFile: null,
        quantity: 1 // For editing, quantity is always 1
      });
    } else {
      setFormData({
        category: '',
        brand: '',
        source: '',
        usage: 'للاعارة',
        dateOfEntry: new Date().toISOString().split('T')[0],
        monetaryValue: 0,
        dateOfExit: '',
        acquisitionType: 'هبات',
        status: 'صالح',
        description: '',
        legalFile: null,
        quantity: 1
      });
    }
    setErrors({});
  }, [initialData, show]);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    
    if (name === 'legalFile' && files && files.length > 0) {
      setFormData({
        ...formData,
        legalFile: files[0]
      });
    } else if (name === 'monetaryValue') {
      const numValue = parseFloat(value) || 0;
      setFormData({
        ...formData,
        [name]: Math.max(0, numValue)
      });
    } else if (name === 'quantity') {
      const quantity = parseInt(value) || 1;
      setFormData({
        ...formData,
        [name]: Math.max(1, Math.min(100, quantity)) // Limit between 1-100
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // For new items, category is required
    if (!initialData && !formData.category.trim()) newErrors.category = 'مطلوب';
    if (!formData.usage.trim()) newErrors.usage = 'مطلوب';
    if (!formData.dateOfEntry) newErrors.dateOfEntry = 'مطلوب';
    
    // Validate dates - convert to Date objects for comparison
    const entryDate = new Date(formData.dateOfEntry);
    const exitDate = formData.dateOfExit ? new Date(formData.dateOfExit) : null;
    
    if (exitDate && exitDate < entryDate) {
      newErrors.dateOfExit = 'تاريخ الخروج يجب أن يكون بعد تاريخ الدخول';
    }
    
    if (formData.monetaryValue < 0) {
      newErrors.monetaryValue = 'القيمة المالية لا يمكن أن تكون سالبة';
    }

    if (!initialData && (formData.quantity < 1 || formData.quantity > 100)) {
      newErrors.quantity = 'الكمية يجب أن تكون بين 1 و 100';
    }

    if (formData.acquisitionType.trim() === '') newErrors.acquisitionType = 'مطلوب';
    if (formData.status.trim() === '') newErrors.status = 'مطلوب';
    
    if (formData.legalFile && !['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(formData.legalFile.type)) {
      newErrors.legalFile = 'الملف يجب أن يكون PDF أو صورة أو مستند Word';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddNewCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('يرجى إدخال اسم الفئة');
      return;
    }

    setIsAddingCategory(true);
    try {
      await onAddCategory(newCategory);
      setFormData({...formData, category: newCategory});
      setShowCategoryInput(false);
      setNewCategory('');
      toast.success('تمت إضافة الفئة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الفئة');
      console.error('Error adding category:', error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // FIX: Better date handling to preserve exact dates
      const formatDateForBackend = (dateString) => {
        if (!dateString) return null;
        // Create date in UTC to avoid timezone shifts
        const date = new Date(dateString);
        return new Date(Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        )).toISOString();
      };

      const baseData = {
        ...formData,
        dateOfEntry: formatDateForBackend(formData.dateOfEntry),
        dateOfExit: formatDateForBackend(formData.dateOfExit),
        monetaryValue: formData.monetaryValue || 0
      };

      // Remove quantity from the base data
      const { quantity, ...equipmentData } = baseData;

      if (initialData) {
        // For editing, include the ID and exclude category
        const updateData = {
          Id: initialData.id,
          Brand: equipmentData.brand,
          Source: equipmentData.source,
          Usage: equipmentData.usage,
          MonetaryValue: equipmentData.monetaryValue,
          AcquisitionType: equipmentData.acquisitionType,
          Status: equipmentData.status,
          Description: equipmentData.description,
          DateOfEntry: equipmentData.dateOfEntry,
          DateOfExit: equipmentData.dateOfExit,
          LegalFile: equipmentData.legalFile
          // Note: Category and Reference are excluded - they cannot be updated
        };
        await onSubmit(updateData);
      } else {
        // FIX: Submit requests sequentially to avoid database conflicts
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < formData.quantity; i++) {
          try {
            await onSubmit(equipmentData);
            successCount++;
            
            // Small delay between requests to prevent race conditions
            if (i < formData.quantity - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            errorCount++;
            console.error(`Error creating equipment ${i + 1}:`, error);
            // Continue with other requests even if one fails
          }
        }

        if (errorCount === 0) {
          toast.success(`تم إضافة ${successCount} عنصر بنجاح`);
        } else if (successCount > 0) {
          toast.warning(`تم إضافة ${successCount} عنصر بنجاح، وفشل إضافة ${errorCount} عنصر`);
        } else {
          toast.error(`فشل إضافة جميع العناصر (${errorCount} أخطاء)`);
        }
      }

      onHide();
    } catch (error) {
      const errorMessage = error.response?.data?.title || 
                          error.response?.data?.errors ? 
                          JSON.stringify(error.response.data.errors) :
                          'حدث خطأ أثناء حفظ البيانات';
      toast.error(errorMessage);
      console.error('Submission error:', error.response?.data || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {initialData ? 'تعديل المعدات' : 'إضافة معدات جديدة'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Display Reference Number (Read-only) for editing */}
          {initialData && (
            <Row className="mb-3">
              <Form.Group as={Col} md={6} controlId="reference">
                <Form.Label>رقم التسلسل</Form.Label>
                <Form.Control
                  type="text"
                  value={initialData.reference || 'غير محدد'}
                  disabled
                  readOnly
                  className="bg-light"
                />
                <Form.Text className="text-muted">
                  رقم التسلسل لا يمكن تعديله
                </Form.Text>
              </Form.Group>
            </Row>
          )}

          {/* Display Category (Read-only) for editing, Editable for new items */}
          <Row className="mb-3">
            <Form.Group as={Col} md={6} controlId="category">
              <Form.Label>
                الفئة {!initialData && <span className="text-danger">*</span>}
              </Form.Label>
              {initialData ? (
                // Display only for editing
                <Form.Control
                  type="text"
                  value={formData.category}
                  disabled
                  readOnly
                  className="bg-light"
                />
              ) : (
                // Editable for new items
                <div className="d-flex">
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    isInvalid={!!errors.category}
                  >
                    <option value="">اختر الفئة</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Button 
                    variant="outline-secondary" 
                    className="ms-2"
                    onClick={() => setShowCategoryInput(!showCategoryInput)}
                    disabled={isAddingCategory}
                  >
                    +
                  </Button>
                </div>
              )}
              {showCategoryInput && !initialData && (
                <div className="mt-2 d-flex">
                  <Form.Control
                    type="text"
                    placeholder="أدخل فئة جديدة"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    disabled={isAddingCategory}
                  />
                  <Button 
                    variant="primary" 
                    className="ms-2"
                    onClick={handleAddNewCategory}
                    disabled={isAddingCategory}
                  >
                    {isAddingCategory ? (
                      <Spinner as="span" size="sm" animation="border" role="status" />
                    ) : (
                      'حفظ'
                    )}
                  </Button>
                </div>
              )}
              <Form.Control.Feedback type="invalid">
                {errors.category}
              </Form.Control.Feedback>
              {initialData && (
                <Form.Text className="text-muted">
                  الفئة لا يمكن تعديلها
                </Form.Text>
              )}
            </Form.Group>

            {/* Quantity Field - Only show for new items, not for editing */}
            {!initialData && (
              <Form.Group as={Col} md={6} controlId="quantity">
                <Form.Label>الكمية <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  placeholder="1"
                  isInvalid={!!errors.quantity}
                />
                <Form.Text className="text-muted">
                  أدخل عدد المعدات المماثلة التي تريد إضافتها (الحد الأقصى 100)
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {errors.quantity}
                </Form.Control.Feedback>
              </Form.Group>
            )}
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={4} controlId="brand">
              <Form.Label>العلامة التجارية</Form.Label>
              <Form.Control
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="أدخل العلامة التجارية"
              />
            </Form.Group>

            <Form.Group as={Col} md={4} controlId="source">
              <Form.Label>المصدر</Form.Label>
              <Form.Control
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="أدخل المصدر"
              />
            </Form.Group>

            <Form.Group as={Col} md={4} controlId="monetaryValue">
              <Form.Label>القيمة المالية</Form.Label>
              <Form.Control
                type="number"
                name="monetaryValue"
                value={formData.monetaryValue}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              {errors.monetaryValue && (
                <Form.Text className="text-danger">
                  {errors.monetaryValue}
                </Form.Text>
              )}
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6} controlId="acquisitionType">
              <Form.Label>طبيعة المصدر <span className="text-danger">*</span></Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="هبات"
                  name="acquisitionType"
                  id="acquisitionType1"
                  value="هبات"
                  checked={formData.acquisitionType === 'هبات'}
                  onChange={handleChange}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="تبرعات"
                  name="acquisitionType"
                  id="acquisitionType2"
                  value="تبرعات"
                  checked={formData.acquisitionType === 'تبرعات'}
                  onChange={handleChange}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="وصية"
                  name="acquisitionType"
                  id="acquisitionType3"
                  value="وصية"
                  checked={formData.acquisitionType === 'وصية'}
                  onChange={handleChange}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="شراء"
                  name="acquisitionType"
                  id="acquisitionType4"
                  value="شراء"
                  checked={formData.acquisitionType === 'شراء'}
                  onChange={handleChange}
                />
              </div>
              {errors.acquisitionType && (
                <Form.Text className="text-danger">
                  {errors.acquisitionType}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group as={Col} md={6} controlId="usage">
              <Form.Label>المستفيد <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="usage"
                value={formData.usage}
                onChange={handleChange}
                isInvalid={!!errors.usage}
              >
                <option value="للاعارة">للاعارة</option>
                <option value="للمساعدات">للمساعدات</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.usage}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6} controlId="status">
              <Form.Label>الحالة <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                isInvalid={!!errors.status}
              >
                <option value="صالح">صالح</option>
                <option value="معطب">معطب</option>
                <option value="تم اتلافه">تم اتلافه</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.status}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group as={Col} md={6} controlId="dateOfEntry">
              <Form.Label>تاريخ الدخول <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="date"
                name="dateOfEntry"
                value={formData.dateOfEntry}
                onChange={handleChange}
                isInvalid={!!errors.dateOfEntry}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
              />
              <Form.Control.Feedback type="invalid">
                {errors.dateOfEntry}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6} controlId="dateOfExit">
              <Form.Label>تاريخ الخروج <small className="text-muted">(اختياري)</small></Form.Label>
              <Form.Control
                type="date"
                name="dateOfExit"
                value={formData.dateOfExit}
                onChange={handleChange}
                isInvalid={!!errors.dateOfExit}
                min={formData.dateOfEntry} // Prevent dates before entry date
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
              />
              <Form.Control.Feedback type="invalid">
                {errors.dateOfExit}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Form.Group className="mb-3" controlId="description">
            <Form.Label>ملاحظات إضافية <small className="text-muted">(اختياري)</small></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="أضف أي ملاحظات إضافية هنا..."
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="legalFile">
            <Form.Label>الملف القانوني <small className="text-muted">(اختياري)</small></Form.Label>
            <Form.Control
              type="file"
              name="legalFile"
              onChange={handleChange}
              accept=".pdf,.doc,.docx,.jpg,.png"
            />
            <Form.Text className="text-muted">
              يمكنك رفع ملف PDF، صورة، أو مستند Word (اختياري)
            </Form.Text>
            {initialData?.legalFilePath && !formData.legalFile && (
              <div className="mt-2">
                <small>الملف الحالي: {initialData.legalFilePath.split('/').pop()}</small>
                <br />
                <small className="text-muted">اختر ملف جديد لاستبدال الملف الحالي</small>
              </div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button className='custom-btn' type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner as="span" size="sm" animation="border" role="status" />
                <span className="ms-2">
                  {initialData ? 'جاري الحفظ...' : `جاري إضافة ${formData.quantity} عنصر...`}
                </span>
              </>
            ) : (
              initialData ? 'حفظ التغييرات' : `إضافة ${formData.quantity > 1 ? formData.quantity + ' عناصر' : 'عنصر'}`
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MedicalEquipmentForm;