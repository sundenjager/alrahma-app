import React, { useState, useEffect } from 'react';
import { Tab, Tabs, Card } from 'react-bootstrap';
import AidForm from './AidForm';
import AidTable from './AidTable';
import { 
  getAid, 
  updateAid, 
  deleteAid,
  createAidBasic,
  addAidItems,
  getSubCategoriesWithStock
} from '../../../services/aidService';
import {
  getSuppliesCategories,
  getSuppliesSubCategories,
} from '../../../services/suppliesCategoryService';
import LoadingSpinner from '../../shared/LoadingSpinner';
import ErrorAlert from '../../shared/ErrorAlert';
import './Aid.css';
import AddButton from '../../AddButton';

const Aid = () => {
  const [activeTab, setActiveTab] = useState('aid');
  const [aid, setAid] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [selectedAid, setSelectedAid] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0
  });

  // Fetch all data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch initial data in sequence to avoid race conditions
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAid(),
        fetchCategories(),
        fetchSubCategories()
      ]);
      // After categories and subcategories are loaded, fetch available stock
      await fetchAvailableSubCategories();
    } catch (err) {
      setError('حدث خطأ أثناء تحميل البيانات');
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAid = async (page = 1, filters = {}) => {
    try {
      const apiFilters = {
        page,
        pageSize: pagination.pageSize,
        searchTerm: filters.search,
        aidType: filters.type,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        includeItems: true,
      };
      
      Object.keys(apiFilters).forEach(key => apiFilters[key] === undefined && delete apiFilters[key]);
      
      const response = await getAid(apiFilters);
      
      const totalCount = response.headers?.['x-total-count'] || response.data?.length || 0;
      
      setAid(response.data || []);
      setPagination({
        page,
        pageSize: pagination.pageSize,
        totalCount: parseInt(totalCount, 10),
      });
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'حدث خطأ أثناء جلب بيانات المساعدات');
      setAid([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getSuppliesCategories();
      setCategories(response);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'حدث خطأ أثناء جلب بيانات الفئات');
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await getSuppliesSubCategories();
      setSubCategories(response);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      setError(err.message || 'حدث خطأ أثناء جلب بيانات الفئات الفرعية');
    }
  };

  // Fetch subcategories with available stock
  const fetchAvailableSubCategories = async () => {
    try {
      const response = await getSubCategoriesWithStock();
      
      if (response && response.length > 0) {
        setAvailableSubCategories(response);
      } else {
        // If no stock data available, use regular subcategories as fallback
        console.warn('No stock data available, using regular subcategories as fallback');
        setAvailableSubCategories(subCategories);
      }
    } catch (err) {
      console.error('Error fetching subcategories with stock:', err);
      // Use regular subcategories as fallback
      setAvailableSubCategories(subCategories);
    }
  };

  // Update available subcategories when regular subcategories change
  useEffect(() => {
    if (subCategories.length > 0 && availableSubCategories.length === 0) {
      setAvailableSubCategories(subCategories);
    }
  }, [subCategories]);

    const handleCreateAid = async (formData) => {
      setIsLoading(true);
      setError(null);
      try {
          // Step 1: Create basic Aid (without items)
          const formDataToSend = new FormData();
          formDataToSend.append('Reference', formData.reference);
          formDataToSend.append('Usage', formData.usage);
          formDataToSend.append('DateOfAid', formData.dateOfAid.toISOString());
          formDataToSend.append('Description', formData.description);
          formDataToSend.append('AidType', formData.aidType);
          
          // Only send cash amount for cash aids
          if (formData.aidType === 'نقدي') {
              formDataToSend.append('MonetaryValue', formData.cashAmount.toString());
          } else {
              formDataToSend.append('MonetaryValue', '0'); // Let backend calculate later
          }
          
          if (formData.legalFile) {
              formDataToSend.append('LegalFile', formData.legalFile);
          }

          const basicResponse = await createAidBasic(formDataToSend);
          const aidId = basicResponse.aidId;

          // Step 2: Add items (only for in-kind Aids)
          // The backend AddAidItems method should handle stock update ONCE
          if (['عيني', 'نقدي وعيني'].includes(formData.aidType) && formData.items.length > 0) {
              const itemsToSend = formData.items.map(item => ({
                  SuppliesSubCategoryId: parseInt(item.suppliesSubCategoryId),
                  Quantity: parseInt(item.quantity)
              }));
              
              await addAidItems(aidId, itemsToSend);
          }

          // Refresh data
          await Promise.all([
              fetchAid(),
              fetchAvailableSubCategories()
          ]);
          
          setSelectedAid(null);
          setShowFormModal(false);
          
          alert('تم إنشاء المساعدة بنجاح!');
      } catch (err) {
          console.error('Error creating aid:', err);
          const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
          setError(errorMessage || 'حدث خطأ أثناء إنشاء المساعدة');
      } finally {
          setIsLoading(false);
      }
  };

  const handleUpdateAid = async (id, formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('Id', id);
      formDataToSend.append('Reference', formData.reference);
      formDataToSend.append('Usage', formData.usage);
      formDataToSend.append('DateOfAid', formData.dateOfAid.toISOString());
      formDataToSend.append('Description', formData.description);
      formDataToSend.append('AidType', formData.aidType);
      
      // Calculate monetary value based on aid type
      let monetaryValue = 0;
      if (formData.aidType === 'عيني') {
        monetaryValue = calculateTotal(formData.items);
      } else if (formData.aidType === 'نقدي') {
        monetaryValue = formData.cashAmount;
      } else if (formData.aidType === 'نقدي وعيني') {
        monetaryValue = calculateTotal(formData.items) + formData.cashAmount;
      }
      
      formDataToSend.append('MonetaryValue', monetaryValue.toString());
      
      if (formData.legalFile) {
        formDataToSend.append('LegalFile', formData.legalFile);
      }

      // Add items to form data for update
      formData.items.forEach((item, index) => {
        formDataToSend.append(`Items[${index}].Id`, item.id || 0);
        formDataToSend.append(`Items[${index}].SuppliesSubCategoryId`, item.suppliesSubCategoryId);
        formDataToSend.append(`Items[${index}].Quantity`, item.quantity);
      });

      await updateAid(id, formDataToSend);
      
      // Refresh data after successful update
      await Promise.all([
        fetchAid(),
        fetchAvailableSubCategories() // Refresh stock availability
      ]);
      
      setSelectedAid(null);
      setShowFormModal(false);
      
      alert('تم تحديث المساعدة بنجاح!');
    } catch (err) {
      console.error('Error updating aid:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(errorMessage || 'حدث خطأ أثناء تحديث المساعدة');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  };

  const handleDeleteAid = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المساعدة؟ سيتم استعادة الكميات إلى المخزون.')) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await deleteAid(id);
      // Refresh data after successful deletion
      await Promise.all([
        fetchAid(),
        fetchAvailableSubCategories() // Refresh stock availability
      ]);
      alert('تم حذف المساعدة بنجاح!');
    } catch (err) {
      console.error('Error deleting aid:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(errorMessage || 'حدث خطأ أثناء حذف المساعدة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAid = (id) => {
    const aidToEdit = aid.find(a => a.id === id);
    setSelectedAid(aidToEdit);
    setShowFormModal(true);
  };

  const handleViewAid = (id) => {
    const aidToView = aid.find(a => a.id === id);
    setSelectedAid(aidToView);
    alert(`عرض تفاصيل المساعدة: ${aidToView.reference}`);
  };

  const handlePageChange = (page) => {
    fetchAid(page);
  };

  const handleSearch = (searchTerm) => {
    fetchAid(1, { search: searchTerm });
  };

  const handleFilter = (filters) => {
    fetchAid(1, filters);
  };

  const handleFormSubmit = (formData) => {
    if (selectedAid) {
      handleUpdateAid(selectedAid.id, formData);
    } else {
      handleCreateAid(formData);
    }
  };

  const handleRefresh = () => {
    fetchInitialData();
  };

  return (
    <div className="aid-management-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="aid-header mb-0">نظام إدارة المساعدات</h2>
        <div>
          <button 
            className="btn btn-outline-secondary me-2"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <i className="fas fa-sync-alt"></i> تحديث
          </button>
          <AddButton 
            handleAdd={() => {
              setSelectedAid(null);
              setShowFormModal(true);
            }} 
          />
        </div>
      </div>
    
      {error && (
        <ErrorAlert 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}
      
      {isLoading && <LoadingSpinner />}

      <div className="aid-tabs-container">
        <AidTable
          aid={aid}
          onEdit={handleEditAid}
          onDelete={handleDeleteAid}
          onView={handleViewAid}
          isLoading={isLoading}
          error={error}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onFilter={handleFilter}
        />
      </div>

      <AidForm
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          setSelectedAid(null);
          setError(null);
        }}
        aid={selectedAid}
        onSubmit={handleFormSubmit}
        categories={categories}
        subCategories={availableSubCategories}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default Aid;