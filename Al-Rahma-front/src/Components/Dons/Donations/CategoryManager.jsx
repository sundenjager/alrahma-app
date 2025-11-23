import React, { useState } from 'react';
import { Modal, Button, Form, Table, Alert, Card } from 'react-bootstrap';
import LoadingSpinner from '../../shared/LoadingSpinner';
import ErrorAlert from '../../shared/ErrorAlert';

const CategoryManager = ({ 
  categories, 
  onCreate, 
  onUpdate, 
  onDelete, 
  isLoading, 
  error 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleShowModal = (category = null) => {
    setCurrentCategory(category);
    setName(category?.name || '');
    setDescription(category?.description || '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentCategory(null);
    setName('');
    setDescription('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const categoryData = {
      name,
      description
    };

    if (currentCategory) {
      onUpdate(currentCategory.id, categoryData);
    } else {
      onCreate(categoryData);
    }
    
    handleCloseModal();
  };

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>إدارة الفئات</h4>
        <Button variant="primary" onClick={() => handleShowModal()}>
          إضافة فئة جديدة
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>الوصف</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((category, index) => (
                <tr key={category.id}>
                  <td>{index + 1}</td>
                  <td>{category.name}</td>
                  <td>{category.description || '---'}</td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleShowModal(category)}
                      className="me-2"
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(category.id)}
                    >
                      حذف
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  لا توجد فئات متاحة
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* Category Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="categoryName">
              <Form.Label>اسم الفئة *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="categoryDescription">
              <Form.Label>الوصف</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit">
              {currentCategory ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManager;