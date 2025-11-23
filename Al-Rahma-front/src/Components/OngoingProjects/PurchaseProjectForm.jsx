import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Modal, Table, Alert } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  createSuppliesBasic as createPurchaseBasic,
  addSuppliesItems as addPurchaseItems
} from '../../services/suppliesService';
import { getSuppliesCategories, getSuppliesSubCategories } from '../../services/suppliesCategoryService';

const PurchaseProjectForm = ({ 
  show,
  onHide,
  project,
  onSubmit, 
  isLoading, 
  error
}) => {
  const [formData, setFormData] = useState({
    reference: '',
    source: '',
    usage: '',
    dateOfEntry: new Date(),
    dateOfExit: null,
    status: 'صالح',
    description: '',
    suppliesType: 'عيني',
    suppliesScope: 'خاص',
    suppliesNature: 'Purchase',
    legalFile: null,
    items: [],
    monetaryValue: 0,
    ongoingProjectId: null
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    suppliesSubCategoryId: '',
    quantity: 1
  });
  const [itemIndex, setItemIndex] = useState(-1);

  // Initialize form with project data
  useEffect(() => {
    if (project) {
      // Generate reference based on project code and date
      const date = new Date();
      const reference = `PUR-${project.projectCode}-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        reference: reference,
        source: `مشروع: ${project.project}`,
        usage: `مشروع: ${project.project}`,
        description: `شراء مرتبط بالمشروع: ${project.project}`,
        ongoingProjectId: project.id
      }));
    }
    setErrors({});
  }, [project, show]);

  // Fetch categories and subcategories
  useEffect(() => {
    const fetchData = async () => {
      if (show) {
        try {
          const categoriesData = await getSuppliesCategories();
          setCategories(categoriesData);
          
          const subCategoriesData = await getSuppliesSubCategories();
          setSubCategories(subCategoriesData);
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      }
    };
    
    fetchData();
  }, [show]);

  // Filter subcategories based on selected category
  useEffect(() => {
    if (selectedCategory) {
      const filtered = subCategories.filter(sc => sc.suppliesCategoryId === parseInt(selectedCategory));
      setFilteredSubCategories(filtered);
    } else {
      setFilteredSubCategories(subCategories);
    }
  }, [selectedCategory, subCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      legalFile: e.target.files[0]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.reference) newErrors.reference = 'المرجع مطلوب';
    if (!formData.source) newErrors.source = 'المصدر مطلوب';
    if (!formData.usage) newErrors.usage = 'الاستخدام مطلوب';
    if (!formData.dateOfEntry) newErrors.dateOfEntry = 'تاريخ الدخول مطلوب';
    
    if (formData.items.length === 0) {
      newErrors.items = 'يجب إضافة عنصر واحد على الأقل';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('Reference', formData.reference);
      formDataToSend.append('Source', formData.source);
      formDataToSend.append('Usage', formData.usage);
      formDataToSend.append('DateOfEntry', formData.dateOfEntry.toISOString());
      
      if (formData.dateOfExit) {
        formDataToSend.append('DateOfExit', formData.dateOfExit.toISOString());
      }
      
      formDataToSend.append('Status', formData.status);
      formDataToSend.append('Description', formData.description);
      formDataToSend.append('SuppliesType', formData.suppliesType);
      formDataToSend.append('SuppliesScope', formData.suppliesScope);
      formDataToSend.append('SuppliesNature', formData.suppliesNature);
      formDataToSend.append('MonetaryValue', calculateTotal().toString());
      formDataToSend.append('OngoingProjectId', formData.ongoingProjectId.toString());
      
      if (formData.legalFile) {
        formDataToSend.append('LegalFile', formData.legalFile);
      }

      const basicResponse = await createPurchaseBasic(formDataToSend);
      const purchaseId = basicResponse.suppliesId;

      if (formData.items.length > 0) {
        const itemsToSend = formData.items.map(item => ({
          suppliesSubCategoryId: item.suppliesSubCategoryId,
          quantity: item.quantity
        }));
        
        await addPurchaseItems(purchaseId, itemsToSend);
      }

      if (typeof onSubmit === 'function') {
        onSubmit();
      }
      
      alert('تم إنشاء الشراء للمشروع بنجاح!');
      onHide();
      
    } catch (error) {
      console.error('Error creating project purchase:', error);
      alert(`حدث خطأ: ${error.message}`);
    }
  };

  const handleAddItem = () => {
    setCurrentItem({
      suppliesSubCategoryId: '',
      quantity: 1
    });
    setItemIndex(-1);
    setShowItemModal(true);
  };

  const handleEditItem = (index) => {
    setCurrentItem(formData.items[index]);
    setItemIndex(index);
    setShowItemModal(true);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      items: newItems,
      monetaryValue: calculateTotal(newItems)
    }));
  };

  const handleSaveItem = () => {
    if (!currentItem.suppliesSubCategoryId || !currentItem.quantity) {
      return;
    }

    const selectedSubCategory = subCategories.find(
      sc => sc.id === parseInt(currentItem.suppliesSubCategoryId)
    );

    const newItem = {
      suppliesSubCategoryId: currentItem.suppliesSubCategoryId,
      quantity: currentItem.quantity,
      subCategoryName: selectedSubCategory?.name,
      unitPrice: selectedSubCategory?.unitPrice,
      totalValue: currentItem.quantity * (selectedSubCategory?.unitPrice || 0)
    };

    let newItems;
    if (itemIndex >= 0) {
      newItems = [...formData.items];
      newItems[itemIndex] = newItem;
    } else {
      newItems = [...formData.items, newItem];
    }

    setFormData(prev => ({
      ...prev,
      items: newItems,
      monetaryValue: calculateTotal(newItems)
    }));

    setShowItemModal(false);
  };

  const calculateTotal = (items = formData.items) => {
    return items.reduce((sum, item) => sum + item.totalValue, 0);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>إضافة شراء للمشروع: {project?.project}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Form.Group as={Col} md={4} controlId="reference">
                <Form.Label>المرجع *</Form.Label>
                <Form.Control
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  isInvalid={!!errors.reference}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.reference}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="source">
                <Form.Label>المصدر *</Form.Label>
                <Form.Control
                  type="text"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  isInvalid={!!errors.source}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.source}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="usage">
                <Form.Label>الاستخدام *</Form.Label>
                <Form.Control
                  type="text"
                  name="usage"
                  value={formData.usage}
                  onChange={handleInputChange}
                  isInvalid={!!errors.usage}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.usage}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group as={Col} md={4} controlId="dateOfEntry">
                <Form.Label>تاريخ الدخول *</Form.Label>
                <DatePicker
                  selected={formData.dateOfEntry}
                  onChange={(date) => handleDateChange(date, 'dateOfEntry')}
                  dateFormat="yyyy/MM/dd"
                  className={`form-control ${errors.dateOfEntry ? 'is-invalid' : ''}`}
                />
                {errors.dateOfEntry && (
                  <div className="invalid-feedback d-block">
                    {errors.dateOfEntry}
                  </div>
                )}
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="dateOfExit">
                <Form.Label>تاريخ الخروج</Form.Label>
                <DatePicker
                  selected={formData.dateOfExit}
                  onChange={(date) => handleDateChange(date, 'dateOfExit')}
                  dateFormat="yyyy/MM/dd"
                  className="form-control"
                  isClearable
                />
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="monetaryValue">
                <Form.Label>القيمة الإجمالية</Form.Label>
                <Form.Control
                  type="number"
                  value={calculateTotal().toFixed(2)}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group as={Col} md={12} controlId="description">
                <Form.Label>الوصف</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group as={Col} controlId="legalFile">
                <Form.Label>المستند القانوني</Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleFileChange}
                />
              </Form.Group>
            </Row>

            <div className="mb-4">
              <h5>العناصر *</h5>
              <Button variant="primary" onClick={handleAddItem} className="mb-3">
                إضافة عنصر
              </Button>

              {formData.items?.length > 0 ? (
                <div className="table-responsive">
                  <Table bordered>
                    <thead>
                      <tr>
                        <th>الفئة</th>
                        <th>الفئة الفرعية</th>
                        <th>الكمية</th>
                        <th>سعر الوحدة</th>
                        <th>القيمة الإجمالية</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            {categories.find(
                              c => c.subCategories?.some(sc => sc.id === item.suppliesSubCategoryId)
                            )?.name || 'غير معروف'}
                          </td>
                          <td>{item.subCategoryName}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unitPrice?.toFixed(2)}</td>
                          <td>{item.totalValue?.toFixed(2)}</td>
                          <td>
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => handleEditItem(index)}
                              className="me-2"
                            >
                              تعديل
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              حذف
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="text-end">
                          <strong>المجموع:</strong>
                        </td>
                        <td>
                          <strong>{calculateTotal().toFixed(2)}</strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ) : (
                <div className="alert alert-warning">لا توجد عناصر مضافة</div>
              )}
              {errors.items && (
                <div className="text-danger">{errors.items}</div>
              )}
            </div>

            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={onHide}>
                إلغاء
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showItemModal} onHide={() => setShowItemModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{itemIndex >= 0 ? 'تعديل العنصر' : 'إضافة عنصر جديد'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="category">
              <Form.Label>الفئة</Form.Label>
              <Form.Select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">اختر الفئة</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="subCategory">
              <Form.Label>الفئة الفرعية *</Form.Label>
              <Form.Select
                value={currentItem.suppliesSubCategoryId || ''}
                onChange={(e) => setCurrentItem({
                  ...currentItem,
                  suppliesSubCategoryId: e.target.value
                })}
                disabled={!selectedCategory}
              >
                <option value="">اختر الفئة الفرعية</option>
                {filteredSubCategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.name} - {subCategory.unitPrice}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="quantity">
              <Form.Label>الكمية *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={currentItem.quantity || 1}
                onChange={(e) => setCurrentItem({
                  ...currentItem,
                  quantity: parseInt(e.target.value) || 1
                })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowItemModal(false)}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={handleSaveItem}>
            حفظ
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PurchaseProjectForm;