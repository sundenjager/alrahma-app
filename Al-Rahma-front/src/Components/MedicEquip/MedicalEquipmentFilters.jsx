import React, { useState } from 'react';
import { Form, Row, Col, Button, InputGroup, Modal } from 'react-bootstrap';
import { FaSearch, FaFilter, FaPlus } from 'react-icons/fa';
import './styles/MedicalEquipment.css';

const MedicalEquipmentFilters = ({ 
  filters, 
  setFilters, 
  categories,
  onAddCategory
}) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleSearchChange = (e) => {
    setFilters({...filters, searchQuery: e.target.value});
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory);
      setNewCategory('');
      setShowCategoryModal(false);
    }
  };

  return (
    <div className="equipment-filters mb-4 p-3 bg-light rounded">
      <Row>
        <Col md={4}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="ابحث بالمعدات..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
            />
            <Button variant="outline-secondary">
              <FaSearch />
            </Button>
          </InputGroup>
        </Col>
        
        <Col md={2}>
          <Form.Select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            <option value="all">كل الفئات</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        
        <Col md={2}>
          <Form.Select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">كل الحالات</option>
            <option value="صالح">صالح</option>
            <option value="معطب">معطب</option>
            <option value="تم اتلافه">تم اتلافه</option>
          </Form.Select>
        </Col>
        
        <Col md={2}>
          <Form.Select
            value={filters.usage}
            onChange={(e) => setFilters({...filters, usage: e.target.value})}
          >
            <option value="all">كل الاستخدامات</option>
            <option value="للاعارة">للاعارة</option>
            <option value="للمساعدات">للمساعدات</option>
          </Form.Select>
        </Col>
        
        <Col md={2}>
          <Button 
            
            onClick={() => setShowCategoryModal(true)}
            className="custom-btn"
          >
            <FaPlus /> فئة جديدة
          </Button>
        </Col>
      </Row>

      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>إضافة فئة جديدة</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>اسم الفئة الجديدة</Form.Label>
            <Form.Control
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="أدخل اسم الفئة الجديدة"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
            إلغاء
          </Button>
          <Button className='custom-btn' onClick={handleAddNewCategory}>
            إضافة
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MedicalEquipmentFilters;