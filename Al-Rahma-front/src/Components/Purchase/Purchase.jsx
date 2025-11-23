import React, { useState, useEffect } from 'react';
import { Tab, Tabs, Card } from 'react-bootstrap';
import PurchaseForm from './PurchaseForm';
import PurchaseTable from './PurchaseTable';
import CategoryManager from './CategoryManager';
import SubCategoryManager from './SubCategoryManager';
import { 
  getSupplies as getPurchases,
  updateSupplies as updatePurchase,
  deleteSupplies as deletePurchase,
  createSuppliesBasic as createPurchaseBasic,
  addSuppliesItems as addPurchaseItems
} from '../../services/suppliesService';
import { 
  getSuppliesCategories as getPurchaseCategories,
  createSuppliesCategory as createPurchaseCategory,
  updateSuppliesCategory as updatePurchaseCategory,
  deleteSuppliesCategory as deletePurchaseCategory,
  getSuppliesSubCategories as getPurchaseSubCategories,
  createSuppliesSubCategory as createPurchaseSubCategory,
  updateSuppliesSubCategory as updatePurchaseSubCategory,
  deleteSuppliesSubCategory as deletePurchaseSubCategory
} from '../../services/suppliesCategoryService';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorAlert from '../shared/ErrorAlert';
import './Purchase.css';
import AddButton from '../AddButton';

const Purchases = () => {
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
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
    fetchPurchases();
    fetchCategories();
    fetchSubCategories();
  }, []);

  const fetchPurchases = async (page = 1, filters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const apiFilters = {
        page,
        pageSize: pagination.pageSize,
        searchTerm: filters.search,
        status: filters.status,
        suppliesType: filters.type,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        includeItems: true,
        suppliesNature: 'Purchase' // Attempt to filter on server-side
      };
      
      // Remove undefined values
      Object.keys(apiFilters).forEach(key => apiFilters[key] === undefined && delete apiFilters[key]);
      
      const response = await getPurchases(apiFilters);
      
      // Filter response client-side to ensure only Purchase nature supplies
      const purchaseOnlyData = (response.data || []).filter(
        item => item.suppliesNature === 'Purchase'
      );
      
      const totalCount = response.headers?.['x-total-count'] 
        ? parseInt(response.headers['x-total-count'], 10)
        : purchaseOnlyData.length;
      
      setPurchases(purchaseOnlyData);
      setPagination({
        page,
        pageSize: pagination.pageSize,
        totalCount: totalCount,
      });
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'حدث خطأ أثناء جلب بيانات الشرائات');
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPurchaseCategories();
      setCategories(response);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء جلب بيانات الفئات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPurchaseSubCategories();
      setSubCategories(response);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء جلب بيانات الفئات الفرعية');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePurchase = async (formData) => {
    setIsLoading(true);
    setError(null);
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
      formDataToSend.append('SuppliesType', formData.purchaseType);
      formDataToSend.append('SuppliesScope', formData.purchaseScope);
      formDataToSend.append('SuppliesNature', 'Purchase');
      formDataToSend.append('MonetaryValue', formData.purchaseType === 'عيني' ? calculateTotal(formData.items) : formData.monetaryValue);
      if (formData.legalFile) {
        formDataToSend.append('LegalFile', formData.legalFile);
      }

      const basicResponse = await createPurchaseBasic(formDataToSend);
      const purchaseId = basicResponse.suppliesId;

      if (['عيني', 'نقدي وعيني'].includes(formData.purchaseType) && formData.items.length > 0) {
        const itemsToSend = formData.items.map(item => ({
          suppliesSubCategoryId: item.purchaseSubCategoryId,
          quantity: item.quantity
        }));
        await addPurchaseItems(purchaseId, itemsToSend);
      }

      fetchPurchases();
      setSelectedPurchase(null);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الشراء');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePurchase = async (id, formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('Id', id);
      formDataToSend.append('Reference', formData.reference);
      formDataToSend.append('Source', formData.source);
      formDataToSend.append('Usage', formData.usage);
      formDataToSend.append('DateOfEntry', formData.dateOfEntry.toISOString());
      if (formData.dateOfExit) {
        formDataToSend.append('DateOfExit', formData.dateOfExit.toISOString());
      }
      formDataToSend.append('Status', formData.status);
      formDataToSend.append('Description', formData.description);
      formDataToSend.append('SuppliesType', formData.purchaseType);
      formDataToSend.append('SuppliesScope', formData.purchaseScope);
      formDataToSend.append('SuppliesNature', 'Purchase');
      formDataToSend.append('MonetaryValue', formData.purchaseType === 'عيني' ? calculateTotal(formData.items) : formData.monetaryValue);
      if (formData.legalFile) {
        formDataToSend.append('LegalFile', formData.legalFile);
      }
      formData.items.forEach((item, index) => {
        formDataToSend.append(`Items[${index}].Id`, item.id || 0);
        formDataToSend.append(`Items[${index}].SuppliesSubCategoryId`, item.purchaseSubCategoryId);
        formDataToSend.append(`Items[${index}].Quantity`, item.quantity);
      });

      await updatePurchase(id, formDataToSend);
      fetchPurchases();
      setSelectedPurchase(null);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحديث الشراء');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.totalValue, 0);
  };

  const handleDeletePurchase = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الشراء؟')) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await deletePurchase(id);
      fetchPurchases();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حذف الشراء');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPurchase = (id) => {
    const purchase = purchases.find(p => p.id === id);
    setSelectedPurchase(purchase);
    setActiveTab('purchaseForm');
  };

  const handleViewPurchase = (id) => {
    const purchase = purchases.find(p => p.id === id);
    setSelectedPurchase(purchase);
    setActiveTab('purchaseView');
  };

  const handleCreateCategory = async (categoryData) => {
    setIsLoading(true);
    setError(null);
    try {
      await createPurchaseCategory(categoryData);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إنشاء التصنيف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (id, categoryData) => {
    setIsLoading(true);
    setError(null);
    try {
      await updatePurchaseCategory(id, categoryData);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحديث التصنيف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التصنيف؟ سيتم حذف جميع الفئات الفرعية المرتبطة به.')) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await deletePurchaseCategory(id);
      fetchCategories();
      fetchSubCategories();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حذف التصنيف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubCategory = async (subCategoryData) => {
    setIsLoading(true);
    setError(null);
    try {
      await createPurchaseSubCategory(subCategoryData);
      fetchSubCategories();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الفئة الفرعية');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubCategory = async (id, subCategoryData) => {
    setIsLoading(true);
    setError(null);
    try {
      await updatePurchaseSubCategory(id, subCategoryData);
      fetchSubCategories();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحديث الفئة الفرعية');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubCategory = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة الفرعية؟')) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await deletePurchaseSubCategory(id);
      fetchSubCategories();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حذف الفئة الفرعية');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchPurchases(page);
  };

  const handleSearch = (searchTerm) => {
    fetchPurchases(1, { search: searchTerm });
  };

  const handleFilter = (filters) => {
    fetchPurchases(1, filters);
  };

  return (
    <div className="purchase-management-container">
      <h2 className="purchase-header">نظام إدارة الشرائات</h2>
      
      <AddButton handleAdd={() => setShowFormModal(true)} />
    
      <div className="purchase-tabs-container">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="purchase-tabs custom-nav-tabs"
        >
          <Tab eventKey="purchases" title="قائمة الشرائات">
            <div className="tab-content">
              <PurchaseTable
                purchases={purchases}
                onEdit={handleEditPurchase}
                onDelete={handleDeletePurchase}
                onView={handleViewPurchase}
                isLoading={isLoading}
                error={error}
                pagination={pagination}
                onPageChange={handlePageChange}
                onSearch={handleSearch}
                onFilter={handleFilter}
              />
            </div>
          </Tab>
          
          <Tab eventKey="categories" title="إدارة الفئات">
            <div className="tab-content">
              <CategoryManager
                categories={categories}
                onCreate={handleCreateCategory}
                onUpdate={handleUpdateCategory}
                onDelete={handleDeleteCategory}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </Tab>
          
          <Tab eventKey="subCategories" title="إدارة الفئات الفرعية">
            <div className="tab-content">
              <SubCategoryManager
                subCategories={subCategories}
                categories={categories}
                onCreate={handleCreateSubCategory}
                onUpdate={handleUpdateSubCategory}
                onDelete={handleDeleteSubCategory}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </Tab>
        </Tabs>
      </div>

    <PurchaseForm
      show={showFormModal}
      onHide={() => {
        setShowFormModal(false);
        setSelectedPurchase(null);
      }}
      purchase={selectedPurchase}
      onSubmit={() => {
        // Just refresh the list after successful creation/update
        fetchPurchases();
        setShowFormModal(false);
        setSelectedPurchase(null);
      }}
      categories={categories}
      subCategories={subCategories}
      isLoading={isLoading}
      error={error}
    />
    </div>
  );
};

export default Purchases;