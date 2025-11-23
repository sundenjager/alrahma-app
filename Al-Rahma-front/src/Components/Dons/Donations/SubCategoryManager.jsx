import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert, Card } from 'react-bootstrap';
import LoadingSpinner from '../../shared/LoadingSpinner';
import ErrorAlert from '../../shared/ErrorAlert';

const SubCategoryManager = ({ 
  subCategories, 
  categories,
  onCreate, 
  onUpdate, 
  onDelete, 
  isLoading, 
  error 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [currentSubCategory, setCurrentSubCategory] = useState(null);
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  const handleShowModal = (subCategory = null) => {
    setCurrentSubCategory(subCategory);
    setName(subCategory?.name || '');
    setUnitPrice(subCategory?.unitPrice || 0);
    // Updated property name from donationCategoryId to suppliesCategoryId
    setCategoryId(subCategory?.suppliesCategoryId || (categories[0]?.id || ''));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentSubCategory(null);
    setName('');
    setUnitPrice(0);
    setCategoryId(categories[0]?.id || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const subCategoryData = {
      name,
      unitPrice: parseFloat(unitPrice),
      // Updated property name from donationCategoryId to suppliesCategoryId
      suppliesCategoryId: parseInt(categoryId)
    };

    if (currentSubCategory) {
      onUpdate(currentSubCategory.id, subCategoryData);
    } else {
      onCreate(subCategoryData);
    }
    
    handleCloseModal();
  };

  // Filter subcategories based on selected category
  const filteredSubCategories = selectedCategoryId
    ? subCategories.filter(subCategory => subCategory.suppliesCategoryId === parseInt(selectedCategoryId))
    : subCategories;

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>إدارة الفئات الفرعية</h4>
        <Button variant="primary" onClick={() => handleShowModal()}>
          إضافة فئة فرعية جديدة
        </Button>
      </div>

      {/* Category Filter Dropdown */}
      <Form.Group className="mb-3" controlId="categoryFilter">
        <Form.Label>تصفية حسب الفئة</Form.Label>
        <Form.Select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
        >
          <option value="">جميع الفئات</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>سعر الوحدة</th>
              <th>الفئة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubCategories.length > 0 ? (
              filteredSubCategories.map((subCategory, index) => (
                <tr key={subCategory.id}>
                  <td>{index + 1}</td>
                  <td>{subCategory.name}</td>
                  <td>{subCategory.unitPrice}</td>
                  <td>
                    {/* Updated property name from donationCategoryId to suppliesCategoryId */}
                    {categories.find(c => c.id === subCategory.suppliesCategoryId)?.name || 'غير معروف'}
                  </td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleShowModal(subCategory)}
                      className="me-2"
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(subCategory.id)}
                    >
                      حذف
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  لا توجد فئات فرعية متاحة
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* SubCategory Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentSubCategory ? 'تعديل الفئة الفرعية' : 'إضافة فئة فرعية جديدة'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="subCategoryName">
              <Form.Label>اسم الفئة الفرعية *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="subCategoryPrice">
              <Form.Label>سعر الوحدة *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="subCategoryCategory">
              <Form.Label>الفئة *</Form.Label>
              <Form.Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit">
              {currentSubCategory ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default SubCategoryManager;