import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { FaCog } from 'react-icons/fa';
import ActImmTable from './ActImmTable';
import ActImmForm from './ActImmForm';
import CategoryManager from './CategoryManager';
import AddButton from '../AddButton';
import actImmService from '../../services/actImmService';

const ActImm = () => {
  const [actimms, setActimms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    sourceNature: '',
    period: {
      startDate: '',
      endDate: ''
    }
  });

  useEffect(() => {
    fetchData();
  }, [filters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, totalCount } = await actImmService.getAll({
        type: filters.sourceNature === 'تبرع' ? 'dons' : 
              filters.sourceNature === 'شراء' ? 'achat' : 'all',
        status: filters.status || 'all',
        categoryId: filters.category || null,
        search: filters.search || null,
        startDate: filters.period?.startDate || null,
        endDate: filters.period?.endDate || null,
        page: currentPage,
        pageSize: itemsPerPage
      });
      setActimms(data);
      setTotalCount(totalCount);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      setActimms([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await actImmService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const handleAddOrUpdate = async (savedData) => {
    await fetchData();
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الأصل؟')) {
      try {
        await actImmService.delete(id);
        await fetchData();
      } catch (error) {
        console.error('Failed to delete asset:', error);
        alert('فشل في حذف الأصل');
      }
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // ADD THIS: Refresh categories when category manager updates
  const handleCategoryUpdate = async () => {
    await fetchCategories();
    await fetchData(); // Refresh assets too in case categories affected display
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="actimm-container">
      {/* Updated header with category management button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">الأصول الثابتة</h1>
        <Button 
          variant="outline-secondary"
          onClick={() => setShowCategoryManager(true)}
          className="d-flex align-items-center"
        >
          <FaCog className="me-1" />
          إدارة الفئات
        </Button>
      </div>
      
      <ActImmTable 
        actimms={actimms}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        filters={filters}
        onFilterChange={handleFilterChange}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        categories={categories}
      />
      
      <AddButton handleAdd={() => {
        setEditingId(null);
        setShowForm(true);
      }} />
      
      <ActImmForm
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        onSubmit={handleAddOrUpdate}
        initialData={editingId ? actimms.find(a => a.id === editingId) : null}
        categories={categories}
      />

      {/* ADD Category Manager Modal */}
      <CategoryManager
        show={showCategoryManager}
        onHide={() => setShowCategoryManager(false)}
        onCategoryUpdate={handleCategoryUpdate}
      />
    </div>
  );
}

export default ActImm;