import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import MedicalEquipmentTable from './MedicalEquipmentTable';
import MedicalEquipmentForm from './MedicalEquipmentForm';
import MedicalEquipmentFilters from './MedicalEquipmentFilters';
import MedicalEquipmentStats from './MedicalEquipmentStats';
import { 
  getMedicalEquipment,
  createEquipment,
  updateEquipmentDetails
} from '../../services/medicalEquipmentService';
import { 
  createCategory,
  getCategories as getEquipmentCategories
} from '../../services/equipmentCategoryService';
import './styles/MedicalEquipment.css';
import AddButton from '../AddButton';
import EquipmentCategoriesManager from './EquipmentCategoriesManager';


const MedicalEquipment = () => {
  const [activeTab, setActiveTab] = useState('equipment');
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    usage: 'all',
    searchQuery: ''
  });

  const fetchEquipment = async () => {
    setIsLoading(true);
    try {
      const data = await getMedicalEquipment();
      setEquipment(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getEquipmentCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchCategories();
  }, []);

  const handleAddCategory = async (categoryName) => {
    if (!categoryName?.trim()) return;

    try {
      await createCategory(categoryName);  // Pass string → service adds { Name: ... }
      await fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const handleCreateEquipment = async (equipmentData) => {
    try {
      await createEquipment(equipmentData);
      await fetchEquipment();
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
  };

  const handleUpdateEquipment = async (id, equipmentData) => {
    try {
      await updateEquipmentDetails(id, equipmentData);
      await fetchEquipment();
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  };

  const filteredEquipment = equipment.filter(item => {
    return (
      (filters.category === 'all' || item.category === filters.category) &&
      (filters.status === 'all' || item.status === filters.status) &&
      (filters.usage === 'all' || item.usage === filters.usage) &&
      (filters.searchQuery === '' || 
        item.reference.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.source?.toLowerCase().includes(filters.searchQuery.toLowerCase()))
    );
  });

return (
    <div className="medical-equipment-container">
      <ToastContainer position="top-center" />
      
      {/* Add tabs navigation */}
      <div className="mb-4">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'equipment' ? 'active' : ''}`}
              onClick={() => setActiveTab('equipment')}
            >
              المعدات الطبية
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              إدارة الفئات
            </button>
          </li>
        </ul>
      </div>

      {activeTab === 'equipment' ? (
        <>
          <div className="medical-equipment-header">
            <h1>إدارة المعدات الطبية</h1>
            <AddButton handleAdd={() => setShowForm(true)} />
            <MedicalEquipmentStats equipment={filteredEquipment} />
          </div>

          <MedicalEquipmentFilters 
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            onAddCategory={handleAddCategory}
          />

          <MedicalEquipmentTable
            equipment={filteredEquipment}
            isLoading={isLoading}
            onEdit={(equip) => {
              setEditingId(equip.id);
              setShowForm(true);
            }}
            onRefresh={fetchEquipment}
          />

          <MedicalEquipmentForm
            show={showForm}
            onHide={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            categories={categories}
            initialData={editingId ? equipment.find(e => e.id === editingId) : null}
            onSubmit={editingId ? 
              (data) => handleUpdateEquipment(editingId, data) : 
              handleCreateEquipment}
            onAddCategory={handleAddCategory}
          />
        </>
      ) : (
        <EquipmentCategoriesManager />
      )}
    </div>
  );
};

export default MedicalEquipment;