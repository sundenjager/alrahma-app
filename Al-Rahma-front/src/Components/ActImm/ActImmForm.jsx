import React, { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { apiClient } from '../../config/api';
import actImmService from '../../services/actImmService';

const ActImmForm = ({ show, onHide, onSubmit, initialData }) => {
  // State management
  const [formData, setFormData] = useState({
    categoryId: '',
    brand: '',
    number: '',
    monetaryValue: 0,
    usageLocation: '',
    source: '',
    sourceNature: 'شراء',
    dateOfDeployment: '',
    isActive: true,
    dateOfEnd: '',
    status: 'صالح',
    legalFile: null,
    legalFileName: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Fetch categories on component mount
  useEffect(() => {
    if (show) {
      fetchCategories();
    }
  }, [show]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiClient.get('/ActImmCategory');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.error('Error details:', error.response?.data);
      
      // Better error handling
      if (error.response?.status === 401) {
        setErrors(prev => ({
          ...prev,
          form: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.'
        }));
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        setErrors(prev => ({
          ...prev,
          form: 'فشل في تحميل الفئات. يرجى المحاولة مرة أخرى.'
        }));
      }
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Initialize form
  useEffect(() => {
    if (initialData) {
      setFormData({
        categoryId: initialData.categoryId,
        brand: initialData.brand,
        number: initialData.number,
        monetaryValue: initialData.monetaryValue || 0,
        usageLocation: initialData.usageLocation,
        source: initialData.source,
        sourceNature: initialData.sourceNature,
        dateOfDeployment: initialData.dateOfDeployment ? initialData.dateOfDeployment.split('T')[0] : '',
        isActive: initialData.isActive,
        dateOfEnd: initialData.dateOfEnd ? initialData.dateOfEnd.split('T')[0] : '',
        status: initialData.status,
        legalFile: null,
        legalFileName: '',
      });
    } else {
      resetForm();
    }
  }, [initialData, show]);

  const resetForm = () => {
    setFormData({
      categoryId: '',
      brand: '',
      number: '',
      monetaryValue: 0,
      usageLocation: '',
      source: '',
      sourceNature: 'شراء',
      dateOfDeployment: '',
      isActive: true,
      dateOfEnd: '',
      status: 'صالح',
      legalFile: null,
      legalFileName: '',
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Update form data
    const updatedFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };
    
    // Automatically set isActive based on status
    if (name === 'status') {
      updatedFormData.isActive = !(value === 'معطب' || value === 'تم إتلافه');
    }
    
    setFormData(updatedFormData);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, legalFile: 'يجب أن يكون الملف من نوع PDF أو صورة' }));
        return;
      }
      
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, legalFile: 'حجم الملف يجب أن لا يتجاوز 5MB' }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        legalFile: file,
        legalFileName: file.name
      }));
      setErrors(prev => ({ ...prev, legalFile: undefined }));
    } else {
      // Clear file when user removes selection
      setFormData(prev => ({
        ...prev,
        legalFile: null,
        legalFileName: ''
      }));
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setErrors({...errors, newCategory: 'يرجى إدخال فئة جديدة'});
      return;
    }

    try {
      const response = await apiClient.post('/ActImmCategory', {
        name: newCategory,
        description: '',
        isActive: true
      });
      
      setCategories([...categories, response.data]);
      setFormData(prev => ({...prev, categoryId: response.data.id}));
      setNewCategory('');
      setShowCategoryModal(false);
      setErrors({...errors, newCategory: undefined});
    } catch (error) {
      console.error('Error adding category:', error);
      setErrors({...errors, newCategory: error.response?.data || 'حدث خطأ أثناء إضافة الفئة'});
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.categoryId) newErrors.categoryId = 'الفئة مطلوبة';
    if (!formData.brand.trim()) newErrors.brand = 'العلامة التجارية مطلوبة';
    if (!formData.number.trim()) newErrors.number = 'رقم التسلسل مطلوب';
    if (formData.monetaryValue < 0) newErrors.monetaryValue = 'القيمة النقدية يجب أن تكون موجبة';
    if (!formData.usageLocation.trim()) newErrors.usageLocation = 'موقع الاستخدام مطلوب';
    if (!formData.source.trim()) newErrors.source = 'المصدر مطلوب';
    
    if ((formData.status === 'معطب' || formData.status === 'تم إتلافه') && !formData.dateOfEnd) {
      newErrors.dateOfEnd = 'تاريخ الانتهاء مطلوب للأصول المعطوبة أو المتهالكة';
    }
    
    // Fix date comparison - only validate if both dates are provided
    if (formData.dateOfEnd && formData.dateOfDeployment && new Date(formData.dateOfEnd) < new Date(formData.dateOfDeployment)) {
      newErrors.dateOfEnd = 'تاريخ الانتهاء يجب أن يكون بعد تاريخ الدخول';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitFormData = async () => {
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('CategoryId', formData.categoryId);
      formDataToSend.append('Brand', formData.brand);
      formDataToSend.append('Number', formData.number);
      formDataToSend.append('MonetaryValue', formData.monetaryValue);
      formDataToSend.append('UsageLocation', formData.usageLocation);
      formDataToSend.append('Source', formData.source);
      formDataToSend.append('SourceNature', formData.sourceNature);
      formDataToSend.append('Status', formData.status);
      
      // Only append date if provided
      if (formData.dateOfDeployment) {
        formDataToSend.append('DateOfDeployment', formData.dateOfDeployment);
      }
      
      if (formData.dateOfEnd) {
        formDataToSend.append('DateOfEnd', formData.dateOfEnd);
      }
      
      // Only append file if provided
      if (formData.legalFile) {
        formDataToSend.append('LegalFile', formData.legalFile);
      }
      
      formDataToSend.append('IsActive', formData.isActive);

      const url = initialData ? `/ActImm/${initialData.id}` : '/ActImm';
      const method = initialData ? 'put' : 'post';

      const response = await apiClient({
        method,
        url,
        data: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Submission error:', error);
      
      if (error.response) {
        if (error.response.data.errors) {
          const serverErrors = {};
          Object.entries(error.response.data.errors).forEach(([key, messages]) => {
            serverErrors[key] = Array.isArray(messages) ? messages.join(' ') : messages;
          });
          throw serverErrors;
        } else if (error.response.data.error) {
          throw { form: error.response.data.error };
        }
      }
      throw { form: 'حدث خطأ أثناء الحفظ' };
    } finally {
      setIsSubmitting(false);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  try {
    const result = await submitFormData(); // This already makes the API call
    onSubmit(result); // Just notify parent that we're done
    onHide(); // Close the form
    resetForm(); // Reset form state
  } catch (error) {
    setErrors(error);
  }
};

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" backdrop="static">
        <Form onSubmit={handleSubmit} noValidate>
          <Modal.Header closeButton>
            <Modal.Title>{initialData ? 'تعديل الأصل' : 'إضافة أصل جديد'}</Modal.Title>
          </Modal.Header>
          
          <Modal.Body>
            {errors.form && <Alert variant="danger">{errors.form}</Alert>}
            
            <Row>
              <Form.Group as={Col} md={4} controlId="formCategory">
                <Form.Label>الفئة <span className="text-danger">*</span></Form.Label>
                <div className="d-flex">
                  {loadingCategories ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <Form.Control
                        as="select"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        isInvalid={!!errors.categoryId}
                        required
                      >
                        <option value="">اختر فئة</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </Form.Control>
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setShowCategoryModal(true)}
                        className="ms-2"
                      >
                        +
                      </Button>
                    </>
                  )}
                </div>
                <Form.Control.Feedback type="invalid">
                  {errors.categoryId}
                </Form.Control.Feedback>
              </Form.Group>
             
              <Form.Group as={Col} md={4} controlId="formBrand">
                <Form.Label>العلامة التجارية <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  isInvalid={!!errors.brand}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.brand}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="formNumber">
                <Form.Label>رقم التسلسل <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  isInvalid={!!errors.number}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.number}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>

            <Row className="mt-3">
              <Form.Group as={Col} md={4} controlId="formMonetaryValue">
                <Form.Label>القيمة المالية</Form.Label>
                <Form.Control
                  type="number"
                  name="monetaryValue"
                  value={formData.monetaryValue}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="formUsageLocation">
                <Form.Label>موقع الاستخدام <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="usageLocation"
                  value={formData.usageLocation}
                  onChange={handleChange}
                  isInvalid={!!errors.usageLocation}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.usageLocation}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="formSource">
                <Form.Label>المصدر <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  isInvalid={!!errors.source}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.source}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>

            <Row className="mt-3">
              <Form.Group as={Col} md={4}>
                <Form.Label>طبيعة المصدر</Form.Label>
                <div className="d-flex mt-2">
                  <Form.Check
                    inline
                    type="radio"
                    label="تبرعات"
                    name="sourceNature"
                    id="sourceNatureDonation"
                    value="تبرع"
                    checked={formData.sourceNature === 'تبرع'}
                    onChange={handleChange}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    label="شراء"
                    name="sourceNature"
                    id="sourceNaturePurchase"
                    value="شراء"
                    checked={formData.sourceNature === 'شراء'}
                    onChange={handleChange}
                  />
                </div>
              </Form.Group>

              {/* FIXED: Remove asterisk from dateOfDeployment label */}
              <Form.Group as={Col} md={4} controlId="formDateOfDeployment">
                <Form.Label>تاريخ الدخول</Form.Label>
                <Form.Control
                  type="date"
                  name="dateOfDeployment"
                  value={formData.dateOfDeployment}
                  onChange={handleChange}
                  isInvalid={!!errors.dateOfDeployment}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.dateOfDeployment}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="formStatus">
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

            {(formData.status === 'معطب' || formData.status === 'تم إتلافه') && (
              <Row className="mt-3">
                <Form.Group as={Col} md={4} controlId="formDateOfEnd">
                  <Form.Label>تاريخ الانتهاء <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="dateOfEnd"
                    value={formData.dateOfEnd}
                    onChange={handleChange}
                    isInvalid={!!errors.dateOfEnd}
                    min={formData.dateOfDeployment}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.dateOfEnd}
                  </Form.Control.Feedback>
                </Form.Group>
              </Row>
            )}

            <Row className="mt-3">
              <Form.Group as={Col} md={6} controlId="formLegalFile">
                <Form.Label>الملف القانوني</Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  isInvalid={!!errors.legalFile}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.legalFile}
                </Form.Control.Feedback>
                {formData.legalFileName && (
                  <Form.Text className="text-muted">
                    الملف المحدد: {formData.legalFileName}
                  </Form.Text>
                )}
              </Form.Group>
            </Row>

            {initialData?.legalFilePath && (
              <Row className="mt-3">
                <Form.Group as={Col} md={6}>
                  <Form.Label>الملف الحالي</Form.Label>
                  <div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => actImmService.previewFile(initialData.legalFilePath)}
                      className="me-2"
                    >
                      معاينة الملف الحالي
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={() => actImmService.downloadFile(initialData.legalFilePath)}
                    >
                      تحميل الملف الحالي
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    سيتم استبدال هذا الملف إذا قمت بتحميل ملف جديد
                  </Form.Text>
                </Form.Group>
              </Row>
            )}
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner as="span" size="sm" animation="border" role="status" />
                  <span className="ms-2">جاري الحفظ...</span>
                </>
              ) : (
                initialData ? 'تحديث' : 'حفظ'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Category Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>إضافة فئة جديدة</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="formNewCategory">
            <Form.Label>اسم الفئة الجديدة</Form.Label>
            <Form.Control
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              isInvalid={!!errors.newCategory}
            />
            <Form.Control.Feedback type="invalid">
              {errors.newCategory}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={handleAddCategory}>
            إضافة
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ActImmForm;