import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Modal, Table } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import LoadingSpinner from '../../shared/LoadingSpinner';
import ErrorAlert from '../../shared/ErrorAlert';
import { 
  createSuppliesBasic as createDonationBasic,
  addSuppliesItems as addDonationItems,
  updateSupplies as updateDonation // ✅ Added missing import
} from '../../../services/suppliesService';

const donationTypes = [
  { value: 'نقدي', label: 'نقدي' },
  { value: 'عيني', label: 'عيني' },
  { value: 'نقدي وعيني', label: 'نقدي وعيني' }
];

const donationScopes = [
  { value: 'عمومي', label: 'عمومي' },
  { value: 'خاص', label: 'خاص' }
];

const statusOptions = [
  { value: 'صالح', label: 'صالح' },
  { value: 'غير صالح', label: 'غير صالح' }
];

const DonationForm = ({ 
  show,
  onHide,
  donation, 
  onSubmit, 
  categories, 
  subCategories, 
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
    donationType: 'نقدي',
    donationScope: 'خاص',
    suppliesNature: 'Donation',
    legalFile: null,
    items: [],
    monetaryValue: 0,
    cashAmount: 0 
  });

  const [errors, setErrors] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    suppliesSubCategoryId: '',
    quantity: 1
  });
  const [itemIndex, setItemIndex] = useState(-1);

  // Helper function to generate reference
  const generateReference = (prefix = 'DONA') => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${prefix}-${year}${month}${day}-${hours}${minutes}${seconds}`;
  };

  // Initialize form with donation data if editing
  useEffect(() => {
    if (donation) {
      setFormData({
        reference: donation.reference || '',
        source: donation.source || '',
        usage: donation.usage || '',
        dateOfEntry: donation.dateOfEntry ? new Date(donation.dateOfEntry) : new Date(),
        dateOfExit: donation.dateOfExit ? new Date(donation.dateOfExit) : null,
        status: donation.status || 'صالح',
        description: donation.description || '',
        donationType: donation.suppliesType || 'نقدي',
        donationScope: donation.suppliesScope || 'خاص',
        suppliesNature: donation.suppliesNature || 'Donation',
        legalFile: null,
        items: donation.items?.map(item => ({
          id: item.id,
          suppliesSubCategoryId: item.suppliesSubCategoryId,
          quantity: item.quantity,
          subCategoryName: item.subCategoryName,
          unitPrice: item.unitPrice,
          totalValue: item.totalValue
        })) || [],
        monetaryValue: donation.monetaryValue || 0,
        cashAmount: donation.suppliesType === 'نقدي وعيني' ? donation.monetaryValue - calculateTotal(donation.items || []) : donation.monetaryValue
      });
    } else {
      // Reset form for new donation with auto-generated reference
      setFormData({
        reference: generateReference('DONA'), // ✅ Auto-generate reference
        source: '',
        usage: '',
        dateOfEntry: new Date(),
        dateOfExit: null,
        status: 'صالح',
        description: '',
        donationType: 'نقدي',
        donationScope: 'خاص',
        suppliesNature: 'Donation',
        legalFile: null,
        items: [],
        monetaryValue: 0,
        cashAmount: 0
      });
    }
    setErrors({});
  }, [donation, show]);

  useEffect(() => {
    if (selectedCategory) {
      const filtered = subCategories.filter(sc => sc.suppliesCategoryId === parseInt(selectedCategory));
      setFilteredSubCategories(filtered);
    } else {
      setFilteredSubCategories([]);
    }
  }, [selectedCategory, subCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name === 'cashAmount' ? parseFloat(value) || 0 : value
      };
      // Update monetaryValue based on donation type
      if (name === 'cashAmount' && prev.donationType === 'نقدي وعيني') {
        newData.monetaryValue = calculateTotal(prev.items) + parseFloat(value || 0);
      } else if (name === 'cashAmount' && prev.donationType === 'نقدي') {
        newData.monetaryValue = parseFloat(value || 0);
      }
      return newData;
    });
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

  const handleDonationTypeChange = (e) => {
    const { value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        donationType: value,
        items: value === 'نقدي' ? [] : prev.items
      };
      // Update monetaryValue based on donation type
      if (value === 'عيني') {
        newData.monetaryValue = calculateTotal(prev.items);
        newData.cashAmount = 0;
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
    
    // Required fields validation
    if (!formData.reference) newErrors.reference = 'المرجع مطلوب';
    if (!formData.source) newErrors.source = 'المصدر مطلوب';
    if (!formData.usage) newErrors.usage = 'الاستخدام مطلوب';
    if (!formData.dateOfEntry) newErrors.dateOfEntry = 'تاريخ الدخول مطلوب';
    if (!formData.status) newErrors.status = 'الحالة مطلوبة';
    if (!formData.donationType) newErrors.donationType = 'نوع التبرع مطلوب';
    if (!formData.donationScope) newErrors.donationScope = 'نطاق التبرع مطلوب';
    
    // Items validation for in-kind donations
    if (['عيني', 'نقدي وعيني'].includes(formData.donationType) && formData.items.length === 0) {
      newErrors.items = 'يجب إضافة عنصر واحد على الأقل';
    }

    // Monetary value validation for cash donations
    if (['نقدي', 'نقدي وعيني'].includes(formData.donationType) && formData.cashAmount <= 0) {
      newErrors.cashAmount = 'القيمة النقدية يجب أن تكون أكبر من 0';
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
      // Prepare FormData for the basic donation
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
      formDataToSend.append('SuppliesType', formData.donationType);
      formDataToSend.append('SuppliesScope', formData.donationScope);
      formDataToSend.append('SuppliesNature', 'Donation');
      formDataToSend.append('MonetaryValue', formData.monetaryValue);
      
      if (formData.legalFile) {
        formDataToSend.append('LegalFile', formData.legalFile);
      }

      if (donation) {
        // UPDATE existing donation
        formData.items.forEach((item, index) => {
          formDataToSend.append(`Items[${index}].Id`, item.id || 0);
          formDataToSend.append(`Items[${index}].SuppliesSubCategoryId`, item.suppliesSubCategoryId);
          formDataToSend.append(`Items[${index}].Quantity`, item.quantity);
        });
        
        await updateDonation(donation.id, formDataToSend);
        alert('تم تحديث التبرع بنجاح!');
      } else {
        // CREATE new donation
        const basicResponse = await createDonationBasic(formDataToSend);
        const donationId = basicResponse.suppliesId;

        // Add items (only for in-kind donations)
        if (['عيني', 'نقدي وعيني'].includes(formData.donationType) && formData.items.length > 0) {
          const itemsToSend = formData.items.map(item => ({
            suppliesSubCategoryId: item.suppliesSubCategoryId,
            quantity: item.quantity
          }));
          
          await addDonationItems(donationId, itemsToSend);
        }
        
        alert('تم إنشاء التبرع بنجاح!');
      }

      // Notify parent component to refresh
      if (typeof onSubmit === 'function') {
        onSubmit(); // Just signal success, no data needed
      }
      
      onHide(); // Close the modal
      
    } catch (error) {
      console.error('Error saving donation:', error);
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
    setFormData(prev => {
      const newData = {
        ...prev,
        items: newItems
      };
      // Update monetaryValue based on donation type
      if (prev.donationType === 'عيني') {
        newData.monetaryValue = calculateTotal(newItems);
      } else if (prev.donationType === 'نقدي وعيني') {
        newData.monetaryValue = calculateTotal(newItems) + prev.cashAmount;
      }
      return newData;
    });
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

    setFormData(prev => {
      const newData = {
        ...prev,
        items: newItems
      };
      // Update monetaryValue based on donation type
      if (prev.donationType === 'عيني') {
        newData.monetaryValue = calculateTotal(newItems);
      } else if (prev.donationType === 'نقدي وعيني') {
        newData.monetaryValue = calculateTotal(newItems) + prev.cashAmount;
      }
      return newData;
    });

    setShowItemModal(false);
  };

  const calculateTotal = (items = formData.items) => {
    return items.reduce((sum, item) => sum + item.totalValue, 0);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>{donation ? 'تعديل التبرع' : 'إضافة تبرع جديد'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <ErrorAlert message={error} />}
          
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Form.Group as={Col} md={4} controlId="reference">
                <Form.Label>المرجع *</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    isInvalid={!!errors.reference}
                  />
                  {!donation && ( // Only show regenerate button for new donations
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        reference: generateReference('DONA')
                      }))}
                      title="إعادة توليد المرجع"
                      style={{ minWidth: '45px' }}
                    >
                      🔄
                    </Button>
                  )}
                </div>
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
              <Form.Group as={Col} md={3} controlId="dateOfEntry">
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

              <Form.Group as={Col} md={3} controlId="dateOfExit">
                <Form.Label>تاريخ الخروج</Form.Label>
                <DatePicker
                  selected={formData.dateOfExit}
                  onChange={(date) => handleDateChange(date, 'dateOfExit')}
                  dateFormat="yyyy/MM/dd"
                  className="form-control"
                  isClearable
                />
              </Form.Group>

              <Form.Group as={Col} md={3} controlId="status">
                <Form.Label>الحالة *</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  isInvalid={!!errors.status}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.status}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} md={3} controlId="donationType">
                <Form.Label>نوع التبرع *</Form.Label>
                <Form.Select
                  name="donationType"
                  value={formData.donationType}
                  onChange={handleDonationTypeChange}
                  isInvalid={!!errors.donationType}
                >
                  {donationTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.donationType}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group as={Col} md={4} controlId="donationScope">
                <Form.Label>نطاق التبرع *</Form.Label>
                <Form.Select
                  name="donationScope"
                  value={formData.donationScope}
                  onChange={handleInputChange}
                  isInvalid={!!errors.donationScope}
                >
                  {donationScopes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.donationScope}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="cashAmount">
                <Form.Label>القيمة النقدية *</Form.Label>
                <Form.Control
                  type="number"
                  name="cashAmount"
                  value={formData.cashAmount}
                  onChange={handleInputChange}
                  isInvalid={!!errors.cashAmount}
                  disabled={formData.donationType === 'عيني'}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.cashAmount}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} md={4} controlId="monetaryValue">
                <Form.Label>القيمة الإجمالية</Form.Label>
                <Form.Control
                  type="number"
                  name="monetaryValue"
                  value={formData.monetaryValue}
                  readOnly
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
                {donation?.legalFilePath && (
                  <div className="mt-2">
                    <a 
                      href={`/Uploads/${donation.legalFilePath}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      عرض الملف الحالي
                    </a>
                  </div>
                )}
              </Form.Group>
            </Row>

            {['عيني', 'نقدي وعيني'].includes(formData.donationType) && (
              <div className="mb-4">
                <h5>العناصر</h5>
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
                            <td>{item.unitPrice}</td>
                            <td>{item.totalValue}</td>
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
                            <strong>{calculateTotal()}</strong>
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

export default DonationForm;