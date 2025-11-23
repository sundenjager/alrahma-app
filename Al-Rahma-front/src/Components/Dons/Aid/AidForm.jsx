import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Modal, Table, Alert, FormCheck } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import LoadingSpinner from '../../shared/LoadingSpinner';
import ErrorAlert from '../../shared/ErrorAlert';
import { createAidBasic, addAidItems, getSubCategoriesWithStock } from '../../../services/aidService';
import ongoingProjectsService from '../../../services/ongoingProjectsService';

const AidTypes = [
  { value: 'نقدي', label: 'نقدي' },
  { value: 'عيني', label: 'عيني' },
  { value: 'نقدي وعيني', label: 'نقدي وعيني' }
];

const AidForm = ({ 
  show,
  onHide,
  aid, 
  onSubmit, 
  categories, 
  subCategories, 
  isLoading, 
  error
}) => {
  const [formData, setFormData] = useState({
    reference: '',
    usage: '',
    dateOfAid: new Date(),
    description: '',
    aidType: 'نقدي',
    legalFile: null,
    items: [],
    monetaryValue: 0,
    cashAmount: 0,
    linkToProject: false,
    ongoingProjectId: null
  });

  const [errors, setErrors] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    suppliesSubCategoryId: '',
    quantity: 1
  });
  const [itemIndex, setItemIndex] = useState(-1);
  const [stockErrors, setStockErrors] = useState([]);
  const [ongoingProjects, setOngoingProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Generate automatic reference based on date and project
  const generateReference = (project = null) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    if (project) {
      const projectCode = project.projectCode ? `-${project.projectCode}` : '';
      return `AID-${year}${month}${day}-${project.id}${projectCode}`;
    }
    
    return `AID-${year}${month}${day}-${hours}${minutes}`;
  };

  // Initialize form with aid data if editing
  useEffect(() => {
    if (aid) {
      setFormData({
        reference: aid.reference || '',
        usage: aid.usage || '',
        dateOfAid: aid.dateOfAid ? new Date(aid.dateOfAid) : new Date(),
        description: aid.description || '',
        aidType: aid.aidType || 'نقدي',
        legalFile: null,
        items: aid.items?.map(item => ({
          id: item.id,
          suppliesSubCategoryId: item.suppliesSubCategoryId,
          quantity: item.quantity,
          subCategoryName: item.subCategoryName,
          unitPrice: item.unitPrice,
          totalValue: item.totalValue
        })) || [],
        monetaryValue: aid.monetaryValue || 0,
        cashAmount: aid.aidType === 'نقدي وعيني' ? aid.monetaryValue - calculateTotal(aid.items || []) : aid.monetaryValue,
        linkToProject: !!aid.ongoingProjectId,
        ongoingProjectId: aid.ongoingProjectId || null
      });
    } else {
      // Reset form for new Aid
      setFormData({
        reference: generateReference(),
        usage: '',
        dateOfAid: new Date(),
        description: '',
        aidType: 'نقدي',
        legalFile: null,
        items: [],
        monetaryValue: 0,
        cashAmount: 0,
        linkToProject: false,
        ongoingProjectId: null
      });
    }
    setErrors({});
    setStockErrors([]);
  }, [aid, show]);

  // Load available subcategories with stock
  useEffect(() => {
    const loadAvailableSubCategories = async () => {
      try {
        const subCategoriesWithStock = await getSubCategoriesWithStock();
        
        if (subCategoriesWithStock && subCategoriesWithStock.length > 0) {
          setAvailableSubCategories(subCategoriesWithStock);
        } else {
          console.warn('No stock data available, using regular subcategories');
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
  }, [show]);

  // Load ongoing projects when form is shown
  useEffect(() => {
    const loadOngoingProjects = async () => {
      if (show) {
        setLoadingProjects(true);
        try {
          const projects = await ongoingProjectsService.getOngoingProjects();
          setOngoingProjects(projects);
        } catch (err) {
          console.error('Failed to load ongoing projects:', err);
          setOngoingProjects([]);
        } finally {
          setLoadingProjects(false);
        }
      }
    };

    loadOngoingProjects();
  }, [show]);

  // Handle project selection change
  const handleProjectChange = (e) => {
    const projectId = e.target.value ? parseInt(e.target.value) : null;
    const selectedProject = ongoingProjects.find(p => p.id === projectId);
    
    setFormData(prev => {
      const newData = {
        ...prev,
        ongoingProjectId: projectId
      };
      
      // If a project is selected, auto-fill usage and reference
      if (selectedProject) {
        newData.usage = selectedProject.project; // Set usage to project name
        newData.reference = generateReference(selectedProject); // Generate reference with project info
      } else {
        // If no project selected, reset usage and generate generic reference
        newData.usage = '';
        newData.reference = generateReference();
      }
      
      return newData;
    });
  };

  // Filter subcategories based on selected category and available stock
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
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // Clear project selection when checkbox is unchecked
        ongoingProjectId: checked ? prev.ongoingProjectId : null,
        // Reset usage and reference when unlinking project
        usage: checked ? prev.usage : '',
        reference: checked ? prev.reference : generateReference()
      }));
    } else if (name === 'ongoingProjectId') {
      // Use the dedicated handler for project selection
      handleProjectChange(e);
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: name === 'cashAmount' ? parseFloat(value) || 0 : value
        };
        
        // Update monetaryValue based on aid type
        if (name === 'cashAmount' && prev.aidType === 'نقدي وعيني') {
          newData.monetaryValue = calculateTotal(prev.items) + parseFloat(value || 0);
        } else if (name === 'cashAmount' && prev.aidType === 'نقدي') {
          newData.monetaryValue = parseFloat(value || 0);
        }
        
        return newData;
      });
    }
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

  const handleAidTypeChange = (e) => {
    const { value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        aidType: value,
        items: value === 'نقدي' ? [] : prev.items,
        cashAmount: value === 'عيني' ? 0 : prev.cashAmount
      };
      
      // Update monetaryValue based on aid type
      if (value === 'عيني') {
        newData.monetaryValue = calculateTotal(prev.items);
      } else if (value === 'نقدي') {
        newData.monetaryValue = prev.cashAmount;
      } else if (value === 'نقدي وعيني') {
        newData.monetaryValue = calculateTotal(prev.items) + prev.cashAmount;
      }
      
      return newData;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const newStockErrors = [];
    
    // Required fields validation
    if (!formData.reference) newErrors.reference = 'المرجع مطلوب';
    if (!formData.usage) newErrors.usage = 'المستفيد مطلوب';
    if (!formData.dateOfAid) newErrors.dateOfAid = 'تاريخ المساعدة مطلوب';
    if (!formData.aidType) newErrors.aidType = 'نوع المساعدة مطلوب';

    // Validate project selection if checkbox is checked
    if (formData.linkToProject && !formData.ongoingProjectId) {
      newErrors.ongoingProjectId = 'يجب اختيار مشروع';
    }

    // Items validation for in-kind Aid
    if (['عيني', 'نقدي وعيني'].includes(formData.aidType)) {
      if (formData.items.length === 0) {
        newErrors.items = 'يجب إضافة عنصر واحد على الأقل';
      }
      
      // Check stock availability for each item
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

    // Monetary value validation for cash Aid
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
      if (aid) {
        // Editing existing aid - use the parent component's update handler
        if (typeof onSubmit === 'function') {
          await onSubmit(formData);
        }
      } else {
        // Creating new aid - handle it entirely in this component
        
        // Step 1: Create basic Aid
        const formDataToSend = new FormData();
        formDataToSend.append('Reference', formData.reference);
        formDataToSend.append('Usage', formData.usage);
        formDataToSend.append('DateOfAid', formData.dateOfAid.toISOString());
        formDataToSend.append('Description', formData.description);
        formDataToSend.append('AidType', formData.aidType);
        
        // Set MonetaryValue based on aid type
        let monetaryValue = 0;
        if (formData.aidType === 'نقدي') {
          monetaryValue = formData.cashAmount;
        } else if (formData.aidType === 'عيني') {
          monetaryValue = calculateTotal(formData.items);
        } else if (formData.aidType === 'نقدي وعيني') {
          monetaryValue = formData.cashAmount; // Only cash amount initially
        }
        
        formDataToSend.append('MonetaryValue', monetaryValue.toString());
        
        // Add project ID if linked to project
        if (formData.linkToProject && formData.ongoingProjectId) {
          formDataToSend.append('OngoingProjectId', formData.ongoingProjectId.toString());
        }
        
        if (formData.legalFile) {
          formDataToSend.append('LegalFile', formData.legalFile);
        }

        const basicResponse = await createAidBasic(formDataToSend);
        const aidId = basicResponse.aidId;

        console.log('Basic aid created with ID:', aidId);

        // Step 2: Add items (only for in-kind aids)
        if (['عيني', 'نقدي وعيني'].includes(formData.aidType) && formData.items.length > 0) {
          const itemsToSend = formData.items.map(item => ({
            SuppliesSubCategoryId: parseInt(item.suppliesSubCategoryId),
            Quantity: parseInt(item.quantity)
          }));
          
          console.log('Sending items to server:', JSON.stringify(itemsToSend, null, 2));
          
          try {
            const itemsResponse = await addAidItems(aidId, itemsToSend);
            console.log('Items added successfully:', itemsResponse);
          } catch (itemsError) {
            console.error('Error adding items:', itemsError);
            
            let errorDetails = itemsError.message;
            if (itemsError.response?.data?.error) {
              errorDetails = itemsError.response.data.error;
            }
            if (itemsError.response?.data?.details) {
              errorDetails += ` - ${itemsError.response.data.details}`;
            }
            
            alert(`تم إنشاء المساعدة الأساسية ولكن فشل في إضافة العناصر: ${errorDetails}`);
            
            // Call onSubmit without parameters to just refresh data
            if (typeof onSubmit === 'function') {
              onSubmit(); // Just signal to refresh, don't pass formData
            }
            return;
          }
        }

        // Success - call onSubmit without parameters to refresh data only
        if (typeof onSubmit === 'function') {
          onSubmit(); // Just signal to refresh, don't pass formData
        }
        
        alert('تم إنشاء المساعدة بنجاح!');
      }
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      
      let errorMessage = 'حدث خطأ غير متوقع';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      }
      
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
          <Modal.Title>{aid ? 'تعديل مساعدة' : 'إضافة مساعدة جديدة'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <ErrorAlert message={error} />}
          
          {/* Stock availability warnings */}
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
                  disabled={formData.linkToProject && formData.ongoingProjectId} // Disable when project is selected
                />
                <Form.Control.Feedback type="invalid">
                  {errors.reference}
                </Form.Control.Feedback>
                {formData.linkToProject && formData.ongoingProjectId && (
                  <Form.Text className="text-muted">
                    المرجع تم توليده تلقائياً بناءً على المشروع
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="usage">
                <Form.Label>المستفيد *</Form.Label>
                <Form.Control
                  type="text"
                  name="usage"
                  value={formData.usage}
                  onChange={handleInputChange}
                  isInvalid={!!errors.usage}
                  disabled={formData.linkToProject && formData.ongoingProjectId} // Disable when project is selected
                />
                <Form.Control.Feedback type="invalid">
                  {errors.usage}
                </Form.Control.Feedback>
                {formData.linkToProject && formData.ongoingProjectId && (
                  <Form.Text className="text-muted">
                    المستفيد تم تعبئته تلقائياً بناءً على المشروع
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="dateOfAid">
                <Form.Label>تاريخ المساعدة *</Form.Label>
                <DatePicker
                  selected={formData.dateOfAid}
                  onChange={(date) => handleDateChange(date, 'dateOfAid')}
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

            {/* New: Project Link Section */}
            <Row className="mb-3">
              <Form.Group as={Col} md={12}>
                <Form.Check
                  type="checkbox"
                  id="linkToProject"
                  name="linkToProject"
                  label="ربط المساعدة بمشروع قيد التنفيذ"
                  checked={formData.linkToProject}
                  onChange={handleInputChange}
                  className="mb-2"
                />
                
                {formData.linkToProject && (
                  <Form.Group controlId="ongoingProjectId">
                    <Form.Label>اختر المشروع *</Form.Label>
                    <Form.Select
                      name="ongoingProjectId"
                      value={formData.ongoingProjectId || ''}
                      onChange={handleInputChange}
                      isInvalid={!!errors.ongoingProjectId}
                      disabled={loadingProjects}
                    >
                      <option value="">اختر المشروع</option>
                      {ongoingProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project} - {project.projectCode || 'بدون كود'}
                        </option>
                      ))}
                    </Form.Select>
                    {loadingProjects && (
                      <Form.Text className="text-muted">جاري تحميل المشاريع...</Form.Text>
                    )}
                    <Form.Control.Feedback type="invalid">
                      {errors.ongoingProjectId}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
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
                                  c => c.subCategories?.some(sc => sc.id === parseInt(item.suppliesSubCategoryId))
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

export default AidForm;