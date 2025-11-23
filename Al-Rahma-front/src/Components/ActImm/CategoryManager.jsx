import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import actImmService from '../../services/actImmService';

const CategoryManager = ({ show, onHide, onCategoryUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      fetchCategories();
    }
  }, [show]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await actImmService.getCategories();
      setCategories(data);
    } catch (error) {
      showAlert('فشل في تحميل الفئات', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingCategory(null);
    setErrors({});
    setSubmitting(false);
  };

  const handleShowForm = (category = null) => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || ''
      });
      setEditingCategory(category);
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'اسم الفئة مطلوب';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'اسم الفئة يجب أن يكون على الأقل حرفين';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'الوصف يجب ألا يتجاوز 500 حرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      if (editingCategory) {
        // Update existing category - include all required fields
        const updateData = {
          name: formData.name,
          description: formData.description,
          isActive: editingCategory.isActive, // Preserve existing status
          createdAt: editingCategory.createdAt, // Preserve creation date
          updatedAt: new Date().toISOString()
        };
        
        await actImmService.updateCategory(editingCategory.id, updateData);
        showAlert('تم تحديث الفئة بنجاح');
      } else {
        // Create new category
        await actImmService.createCategory(formData);
        showAlert('تم إضافة الفئة بنجاح');
      }
      
      await fetchCategories();
      setShowForm(false);
      resetForm();
      if (onCategoryUpdate) onCategoryUpdate();
    } catch (error) {
      console.error('Error saving category:', error);
      
      // Better error handling
      let errorMessage = 'حدث خطأ أثناء الحفظ';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 400) {
          errorMessage = 'بيانات غير صالحة. يرجى التحقق من المدخلات.';
        } else if (error.response.status === 409) {
          errorMessage = 'اسم الفئة موجود مسبقاً';
        } else if (error.response.data) {
          errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : 'حدث خطأ في الخادم';
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'لا يمكن الاتصال بالخادم';
      }
      
      showAlert(errorMessage, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`هل أنت متأكد من حذف الفئة "${category.name}"؟`)) {
      return;
    }

    try {
      await actImmService.deleteCategory(category.id);
      showAlert('تم حذف الفئة بنجاح');
      await fetchCategories();
      if (onCategoryUpdate) onCategoryUpdate();
    } catch (error) {
      console.error('Error deleting category:', error);
      
      let errorMessage = 'حدث خطأ أثناء الحذف';
      if (error.response?.status === 400) {
        errorMessage = 'لا يمكن حذف الفئة لأنها مستخدمة في أصول حالية';
      } else if (error.response?.data) {
        errorMessage = error.response.data;
      }
      
      showAlert(errorMessage, 'danger');
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      const updateData = {
        name: category.name,
        description: category.description || '',
        isActive: !category.isActive,
        createdAt: category.createdAt,
        updatedAt: new Date().toISOString()
      };
      
      await actImmService.updateCategory(category.id, updateData);
      showAlert(`تم ${category.isActive ? 'تعطيل' : 'تفعيل'} الفئة بنجاح`);
      await fetchCategories();
      if (onCategoryUpdate) onCategoryUpdate();
    } catch (error) {
      console.error('Error toggling category status:', error);
      showAlert('حدث خطأ أثناء تغيير حالة الفئة', 'danger');
    }
  };

  return (
    <>
      {/* Main Categories Modal */}
      <Modal show={show} onHide={onHide} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>إدارة فئات الأصول الثابتة</Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {alert.show && (
            <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
              {alert.message}
            </Alert>
          )}

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">قائمة الفئات ({categories.length})</h6>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => handleShowForm()}
              className="d-flex align-items-center"
            >
              <FaPlus className="me-1" />
              إضافة فئة جديدة
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">جاري تحميل الفئات...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th width="25%">اسم الفئة</th>
                    <th width="40%">الوصف</th>
                    <th width="15%">الحالة</th>
                    <th width="15%">العمليات</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length > 0 ? (
                    categories.map((category, index) => (
                      <tr key={category.id}>
                        <td>{index + 1}</td>
                        <td>{category.name}</td>
                        <td>
                          {category.description || (
                            <span className="text-muted">لا يوجد وصف</span>
                          )}
                        </td>
                        <td>
                          <Badge bg={category.isActive ? 'success' : 'secondary'}>
                            {category.isActive ? 'مفعل' : 'معطل'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleShowForm(category)}
                              title="تعديل"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleToggleStatus(category)}
                              title={category.isActive ? 'تعطيل' : 'تفعيل'}
                            >
                              {category.isActive ? '✗' : '✓'}
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(category)}
                              title="حذف"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        لا توجد فئات مضافة
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Category Form Modal */}
      <Modal show={showForm} onHide={() => !submitting && setShowForm(false)}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>اسم الفئة <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
                placeholder="أدخل اسم الفئة"
                disabled={submitting}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label>الوصف</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                isInvalid={!!errors.description}
                placeholder="أدخل وصفاً للفئة (اختياري)"
                disabled={submitting}
              />
              <Form.Control.Feedback type="invalid">
                {errors.description}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                {formData.description.length}/500 حرف
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  {editingCategory ? 'جاري التحديث...' : 'جاري الحفظ...'}
                </>
              ) : (
                editingCategory ? 'تحديث' : 'حفظ'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default CategoryManager;