import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  Form, 
  Table, 
  Alert, 
  Spinner,
  Badge,
  Row,
  Col,
  Card
} from 'react-bootstrap';
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaSave, 
  FaTimes,
  FaList 
} from 'react-icons/fa';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../services/equipmentCategoryService';
import { toast } from 'react-toastify';

const EquipmentCategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('فشل في تحميل الفئات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'اسم الفئة مطلوب';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'اسم الفئة يجب أن يكون على الأقل حرفين';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const categoryData = {
        Name: formData.name.trim(),
        Description: formData.description.trim()
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        toast.success('تم تحديث الفئة بنجاح');
      } else {
        await createCategory(categoryData);
        toast.success('تم إضافة الفئة بنجاح');
      }

      await fetchCategories();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMessage = error.response?.data?.Error || 'فشل في حفظ الفئة';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (window.confirm(`هل أنت متأكد أنك تريد حذف الفئة "${category.name}"؟`)) {
      try {
        await deleteCategory(category.id);
        toast.success('تم حذف الفئة بنجاح');
        await fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        const errorMessage = error.response?.data?.Error || 'فشل في حذف الفئة';
        
        if (errorMessage.includes('in use')) {
          toast.error('لا يمكن حذف الفئة لأنها مستخدمة في معدات حالية');
        } else {
          toast.error(errorMessage);
        }
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="categories-manager" dir="rtl">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaList className="me-2" />
            إدارة فئات المعدات
          </h5>
          <Button 
            variant="primary" 
            onClick={() => handleShowModal()}
            className="d-flex align-items-center gap-1"
          >
            <FaPlus /> إضافة فئة جديدة
          </Button>
        </Card.Header>
        
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">جاري تحميل الفئات...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th width="5%">#</th>
                    <th width="25%">اسم الفئة</th>
                    <th width="45%">الوصف</th>
                    <th width="15%">تاريخ الإنشاء</th>
                    <th width="10%">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length > 0 ? (
                    categories.map((category, index) => (
                      <tr key={category.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{category.name}</strong>
                        </td>
                        <td>
                          {category.description || (
                            <span className="text-muted">لا يوجد وصف</span>
                          )}
                        </td>
                        <td>
                          {category.createdAt ? 
                            new Date(category.createdAt).toLocaleDateString('ar-TN') : 
                            '-'
                          }
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleShowModal(category)}
                              title="تعديل"
                            >
                              <FaEdit />
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
                      <td colSpan="5" className="text-center py-4">
                        <div className="text-muted">
                          <h6>لا توجد فئات</h6>
                          <p>قم بإضافة فئات جديدة للمعدات الطبية</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                اسم الفئة <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                isInvalid={!!errors.name}
                placeholder="أدخل اسم الفئة"
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>الوصف (اختياري)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="أدخل وصفاً للفئة (اختياري)"
              />
            </Form.Group>
          </Modal.Body>
          
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              <FaTimes className="me-1" /> إلغاء
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-1" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <FaSave className="me-1" /> حفظ
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentCategoriesManager;