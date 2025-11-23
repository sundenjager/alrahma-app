  import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Modal, Alert, Table } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorAlert from '../shared/ErrorAlert';
import { createAidBasic, addAidItems, getSubCategoriesWithStock } from '../../services/aidService';
import { getSuppliesCategories, getSuppliesSubCategories } from '../../services/suppliesCategoryService';

const AidTypes = [
  { value: 'نقدي', label: 'نقدي' },
  { value: 'عيني', label: 'عيني' },
  { value: 'نقدي وعيني', label: 'نقدي وعيني' }
];

const AidProjectForm = ({ 
  show,
  onHide,
  project,
  onSubmit, 
  isLoading, 
  error
}) => {
  const [formData, setFormData] = useState({
    reference: '',
    dateOfAid: new Date(),
    description: '',
    aidType: 'نقدي',
    legalFile: null,
    items: [],
    monetaryValue: 0,
    cashAmount: 0
  });

  const [errors, setErrors] = useState({});
  const [aid, setAid] = useState(null); // For editing existing aid 
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    suppliesSubCategoryId: '',
    quantity: 1
  });
  const [itemIndex, setItemIndex] = useState(-1);
  const [stockErrors, setStockErrors] = useState([]);

  // Initialize form with project data
  useEffect(() => {
    if (project) {
      // Generate reference based on project code and date
      const date = new Date();
      const reference = `AID-${project.projectCode}-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      
      setFormData({
        reference: reference,
        usage: `مشروع: ${project.project}`, // Auto-set usage to project name
        dateOfAid: new Date(),
        description: `مساعدة مرتبطة بالمشروع: ${project.project}`,
        aidType: 'نقدي',
        legalFile: null,
        items: [],
        monetaryValue: 0,
        cashAmount: 0
      });
    }
    setErrors({});
    setStockErrors([]);
  }, [project, show]);

  // Fetch categories when component mounts or show changes
  useEffect(() => {
    const fetchCategories = async () => {
      if (show) {
        setIsLoadingCategories(true);
        try {
          const categoriesData = await getSuppliesCategories();
          setCategories(categoriesData);
          
          const subCategoriesData = await getSuppliesSubCategories();
          setSubCategories(subCategoriesData);
        } catch (error) {
          console.error('Error fetching categories:', error);
        } finally {
          setIsLoadingCategories(false);
        }
      }
    };
    
    fetchCategories();
  }, [show]);


  // Load available subcategories with stock
  useEffect(() => {
    const loadAvailableSubCategories = async () => {
      try {
        const subCategoriesWithStock = await getSubCategoriesWithStock();
        
        if (subCategoriesWithStock && subCategoriesWithStock.length > 0) {
          setAvailableSubCategories(subCategoriesWithStock);
        } else {
          setAvailableSubCategories(subCategories);
        }
      } catch (err) {
        console.error('Failed to load available subcategories:', err);
        setAvailableSubCategories(subCategories);
      }
    };

    if (show) {
      loadAvailableSubCategories();
    }
  }, [show, subCategories]);

  // Filter subcategories based on selected category
  useEffect(() => {
    if (selectedCategory) {
      const filtered = availableSubCategories.filter(sc => 
        sc.suppliesCategoryId === parseInt(selectedCategory)
      );
      setFilteredSubCategories(filtered);
    } else {
      setFilteredSubCategories(availableSubCategories);
    }
  }, [selectedCategory, availableSubCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cashAmount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dateOfAid: date
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      legalFile: e.target.files[0]
    }));
  };

  const handleAidTypeChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      aidType: value,
      items: value === 'نقدي' ? [] : prev.items,
      cashAmount: value === 'عيني' ? 0 : prev.cashAmount
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const newStockErrors = [];
    
    if (!formData.reference) newErrors.reference = 'المرجع مطلوب';
    if (!formData.dateOfAid) newErrors.dateOfAid = 'تاريخ المساعدة مطلوب';

    if (['عيني', 'نقدي وعيني'].includes(formData.aidType)) {
      if (formData.items.length === 0) {
        newErrors.items = 'يجب إضافة عنصر واحد على الأقل';
      }
      
      formData.items.forEach((item, index) => {
        const availableSubCat = availableSubCategories.find(
          sc => sc.id === parseInt(item.suppliesSubCategoryId)
        );
        
        if (availableSubCat && item.quantity > availableSubCat.availableQuantity) {
          newStockErrors.push({
            index,
            message: `الكمية المتاحة لـ ${availableSubCat.name} هي ${availableSubCat.availableQuantity} فقط`
          });
        }
      });
    }

    if (['نقدي', 'نقدي وعيني'].includes(formData.aidType) && formData.cashAmount <= 0) {
      newErrors.cashAmount = 'القيمة النقدية يجب أن تكون أكبر من 0';
    }
    
    setErrors(newErrors);
    setStockErrors(newStockErrors);
    
    return Object.keys(newErrors).length === 0 && newStockErrors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('Reference', formData.reference);
      formDataToSend.append('Usage', formData.usage);
      formDataToSend.append('DateOfAid', formData.dateOfAid.toISOString());
      formDataToSend.append('Description', formData.description);
      formDataToSend.append('AidType', formData.aidType);
      formDataToSend.append('OngoingProjectId', project.id.toString());
      
      if (formData.aidType === 'نقدي') {
        formDataToSend.append('MonetaryValue', formData.cashAmount.toString());
      } else {
        formDataToSend.append('MonetaryValue', '0');
      }
      
      if (formData.legalFile) {
        formDataToSend.append('LegalFile', formData.legalFile);
      }

      const basicResponse = await createAidBasic(formDataToSend);
      const aidId = basicResponse.aidId;

      if (['عيني', 'نقدي وعيني'].includes(formData.aidType) && formData.items.length > 0) {
        const itemsToSend = formData.items.map(item => ({
          SuppliesSubCategoryId: parseInt(item.suppliesSubCategoryId),
          Quantity: parseInt(item.quantity)
        }));
        
        await addAidItems(aidId, itemsToSend);
      }

      if (typeof onSubmit === 'function') {
        onSubmit();
      }
      
      alert('تم إنشاء المساعدة للمشروع بنجاح!');
      onHide();
      
    } catch (error) {
      console.error('Error creating project aid:', error);
      let errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      alert(`حدث خطأ: ${errorMessage}`);
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
      setFormData(prev => {
        const newData = {
          ...prev,
          items: newItems
        };
        // Update monetaryValue based on Aid type
        if (prev.aidType === 'عيني') {
          newData.monetaryValue = calculateTotal(newItems);
        } else if (prev.aidType === 'نقدي وعيني') {
          newData.monetaryValue = calculateTotal(newItems) + prev.cashAmount;
        }
        return newData;
      });
    };

    const handleSaveItem = () => {
      if (!currentItem.suppliesSubCategoryId || !currentItem.quantity) {
        return;
      }

      const selectedSubCategory = availableSubCategories.find(
        sc => sc.id === parseInt(currentItem.suppliesSubCategoryId)
      );

      if (!selectedSubCategory) {
        alert('الفئة الفرعية غير متوفرة');
        return;
      }

      // Check if quantity exceeds available stock
      if (currentItem.quantity > selectedSubCategory.availableQuantity) {
        alert(`الكمية المتاحة لـ ${selectedSubCategory.name} هي ${selectedSubCategory.availableQuantity} فقط`);
        return;
      }

      const newItem = {
        suppliesSubCategoryId: currentItem.suppliesSubCategoryId,
        quantity: currentItem.quantity,
        subCategoryName: selectedSubCategory.name,
        unitPrice: selectedSubCategory.unitPrice,
        totalValue: currentItem.quantity * selectedSubCategory.unitPrice
      };

      let newItems;
      if (itemIndex >= 0) {
        newItems = [...formData.items];
        newItems[itemIndex] = newItem;
      } else {
        newItems = [...formData.items, newItem];
      }

      setFormData(prev => {
        const newData = {
          ...prev,
          items: newItems
        };
        // Update monetaryValue based on Aid type
        if (prev.aidType === 'عيني') {
          newData.monetaryValue = calculateTotal(newItems);
        } else if (prev.aidType === 'نقدي وعيني') {
          newData.monetaryValue = calculateTotal(newItems) + prev.cashAmount;
        }
        return newData;
      });

      setShowItemModal(false);
    };

    const calculateTotal = (items = formData.items) => {
      return items.reduce((sum, item) => sum + item.totalValue, 0);
    };

    const getAvailableQuantity = (subCategoryId) => {
      const subCategory = availableSubCategories.find(sc => sc.id === parseInt(subCategoryId));
      return subCategory ? subCategory.availableQuantity : 0;
    };

    return (
      <>
        <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>إضافة مساعدة للمشروع: {project?.project}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <ErrorAlert message={error} />}
        
        {stockErrors.length > 0 && (
          <Alert variant="danger" className="mb-3">
            <h6>أخطاء في توفر المخزون:</h6>
            <ul className="mb-0">
              {stockErrors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </Alert>
        )}

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

            <Form.Group as={Col} md={4} controlId="usage">
              <Form.Label>المستفيد</Form.Label>
              <Form.Control
                type="text"
                name="usage"
                value={formData.usage}
                readOnly
                className="bg-light"
              />
              <Form.Text className="text-muted">معلومات المشروع (غير قابلة للتعديل)</Form.Text>
            </Form.Group>

            <Form.Group as={Col} md={4} controlId="dateOfAid">
              <Form.Label>تاريخ المساعدة *</Form.Label>
              <DatePicker
                selected={formData.dateOfAid}
                onChange={handleDateChange}
                dateFormat="yyyy/MM/dd"
                className={`form-control ${errors.dateOfAid ? 'is-invalid' : ''}`}
              />
              {errors.dateOfAid && (
                <div className="invalid-feedback d-block">
                  {errors.dateOfAid}
                </div>
              )}
            </Form.Group>
          </Row>

              <Row className="mb-3">

                <Form.Group as={Col} md={3} controlId="aidType">
                  <Form.Label>نوع المساعدة *</Form.Label>
                  <Form.Select
                    name="aidType"
                    value={formData.aidType}
                    onChange={handleAidTypeChange}
                    isInvalid={!!errors.aidType}
                  >
                    {AidTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.aidType}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group as={Col} md={3} controlId="cashAmount">
                  <Form.Label>القيمة النقدية *</Form.Label>
                  <Form.Control
                    type="number"
                    name="cashAmount"
                    value={formData.cashAmount}
                    onChange={handleInputChange}
                    isInvalid={!!errors.cashAmount}
                    disabled={formData.aidType === 'عيني'}
                    min="0"
                    step="0.01"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.cashAmount}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group as={Col} md={3} controlId="monetaryValue">
                  <Form.Label>القيمة الإجمالية</Form.Label>
                  <Form.Control
                    type="number"
                    name="monetaryValue"
                    value={formData.monetaryValue.toFixed(2)}
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
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {aid?.legalFilePath && (
                    <div className="mt-2">
                      <a 
                        href={`/Uploads/${aid.legalFilePath}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        عرض الملف الحالي
                      </a>
                    </div>
                  )}
                </Form.Group>
              </Row>

              {['عيني', 'نقدي وعيني'].includes(formData.aidType) && (
                <div className="mb-4">
                  <h5>العناصر</h5>
                  <Button variant="primary" onClick={handleAddItem} className="mb-3">
                    إضافة عنصر
                  </Button>

                  {formData.items?.length > 0 ? (
                    <div className="table-responsive">
                      <Table bordered striped>
                        <thead className="table-dark">
                          <tr>
                            <th>الفئة</th>
                            <th>الفئة الفرعية</th>
                            <th>الكمية</th>
                            <th>المتاح</th>
                            <th>سعر الوحدة</th>
                            <th>القيمة الإجمالية</th>
                            <th>الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, index) => {
                            const availableQty = getAvailableQuantity(item.suppliesSubCategoryId);
                            const isLowStock = item.quantity > availableQty;
                            
                            return (
                              <tr key={index} className={isLowStock ? 'table-warning' : ''}>
                                <td>
                                  {categories.find(
                                    c => c.id === availableSubCategories.find(sc => sc.id === parseInt(item.suppliesSubCategoryId))?.suppliesCategoryId
                                  )?.name || 'غير معروف'}
                                </td>
                                <td>{item.subCategoryName}</td>
                                <td>{item.quantity}</td>
                                <td className={isLowStock ? 'text-danger fw-bold' : ''}>
                                  {availableQty}
                                  {isLowStock && ' ⚠️'}
                                </td>
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
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="5" className="text-end">
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
              )}

              <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={onHide}>
                  إلغاء
                </Button>
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'حفظ'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Item Modal */}
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
                >
                  <option value="">اختر الفئة الفرعية</option>
                  {filteredSubCategories.map((subCategory) => (
                    <option 
                      key={subCategory.id} 
                      value={subCategory.id}
                      disabled={subCategory.availableQuantity <= 0}
                    >
                      {subCategory.name} - 
                      سعر: {subCategory.unitPrice} - 
                      متاح: {subCategory.availableQuantity}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="quantity">
                <Form.Label>الكمية *</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max={currentItem.suppliesSubCategoryId ? 
                    getAvailableQuantity(currentItem.suppliesSubCategoryId) : 1}
                  value={currentItem.quantity || 1}
                  onChange={(e) => setCurrentItem({
                    ...currentItem,
                    quantity: parseInt(e.target.value) || 1
                  })}
                />
                {currentItem.suppliesSubCategoryId && (
                  <Form.Text className="text-muted">
                    الكمية المتاحة: {getAvailableQuantity(currentItem.suppliesSubCategoryId)}
                  </Form.Text>
                )}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowItemModal(false)}>
              إلغاء
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveItem}
              disabled={!currentItem.suppliesSubCategoryId || !currentItem.quantity}
            >
              حفظ
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  };

export default AidProjectForm;
