import React, { useState, useEffect } from 'react';
import { Tab, Tabs, Card } from 'react-bootstrap';
import DonationForm from './DonationForm';
import DonationTable from './DonationTable';
import CategoryManager from './CategoryManager';
import SubCategoryManager from './SubCategoryManager';
import { 
  getSupplies as getDonations,
  updateSupplies as updateDonation,
  deleteSupplies as deleteDonation,
  createSuppliesBasic as createDonationBasic,
  addSuppliesItems as addDonationItems
} from '../../../services/suppliesService';
import { 
  getSuppliesCategories as getDonationCategories,
  createSuppliesCategory as createDonationCategory,
  updateSuppliesCategory as updateDonationCategory,
  deleteSuppliesCategory as deleteDonationCategory,
  getSuppliesSubCategories as getDonationSubCategories,
  createSuppliesSubCategory as createDonationSubCategory,
  updateSuppliesSubCategory as updateDonationSubCategory,
  deleteSuppliesSubCategory as deleteDonationSubCategory
} from '../../../services/suppliesCategoryService';
import LoadingSpinner from '../../shared/LoadingSpinner';
import ErrorAlert from '../../shared/ErrorAlert';
import './Donations.css';
import AddButton from '../../AddButton';

const Donations = () => {
  const [activeTab, setActiveTab] = useState('donations');
  const [donations, setDonations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
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
    fetchDonations();
    fetchCategories();
    fetchSubCategories();
  }, []);

  const fetchDonations = async (page = 1, filters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      // Add filter to only get donations (not purchases)
      const apiFilters = {
        page,
        pageSize: pagination.pageSize,
        searchTerm: filters.search,
        status: filters.status,
        suppliesType: filters.type,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        includeItems: true,
        suppliesNature: 'Donation' // Attempt to filter on server-side
      };
      
      // Remove undefined values
      Object.keys(apiFilters).forEach(key => apiFilters[key] === undefined && delete apiFilters[key]);
      
      const response = await getDonations(apiFilters);
      
      // Filter response client-side to ensure only Donation nature supplies
      const donationOnlyData = (response.data || []).filter(
        item => item.suppliesNature === 'Donation'
      );
      
      const totalCount = response.headers?.['x-total-count'] 
        ? parseInt(response.headers['x-total-count'], 10)
        : donationOnlyData.length;
      
      setDonations(donationOnlyData);
      setPagination({
        page,
        pageSize: pagination.pageSize,
        totalCount: totalCount,
      });
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'حدث خطأ أثناء جلب بيانات التبرعات');
      setDonations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDonationCategories();
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
      const response = await getDonationSubCategories();
      setSubCategories(response);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء جلب بيانات الفئات الفرعية');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDonation = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Prepare form data for submission - set SuppliesNature to 'Donation'
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
      formDataToSend.append('SuppliesNature', 'Donation'); // Always set to Donation
      formDataToSend.append('MonetaryValue', formData.donationType === 'عيني' ? calculateTotal(formData.items) : formData.monetaryValue);
      if (formData.legalFile) {
        formDataToSend.append('LegalFile', formData.legalFile);
      }

      const basicResponse = await createDonationBasic(formDataToSend);
      const donationId = basicResponse.suppliesId;

      if (['عيني', 'نقدي وعيني'].includes(formData.donationType) && formData.items.length > 0) {
        const itemsToSend = formData.items.map(item => ({
          suppliesSubCategoryId: item.donationSubCategoryId,
          quantity: item.quantity
        }));
        await addDonationItems(donationId, itemsToSend);
      }

      fetchDonations();
      setSelectedDonation(null);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إنشاء التبرع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDonation = async (id, formData) => {
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
      formDataToSend.append('SuppliesType', formData.donationType);
      formDataToSend.append('SuppliesScope', formData.donationScope);
      formDataToSend.append('SuppliesNature', 'Donation'); // Always set to Donation
      formDataToSend.append('MonetaryValue', formData.donationType === 'عيني' ? calculateTotal(formData.items) : formData.monetaryValue);
      if (formData.legalFile) {
        formDataToSend.append('LegalFile', formData.legalFile);
      }
      formData.items.forEach((item, index) => {
        formDataToSend.append(`Items[${index}].Id`, item.id || 0);
        formDataToSend.append(`Items[${index}].SuppliesSubCategoryId`, item.donationSubCategoryId);
        formDataToSend.append(`Items[${index}].Quantity`, item.quantity);
      });

      await updateDonation(id, formDataToSend);
      fetchDonations();
      setSelectedDonation(null);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحديث التبرع');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.totalValue, 0);
  };

  const handleDeleteDonation = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التبرع؟')) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await deleteDonation(id);
      fetchDonations();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حذف التبرع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDonation = (id) => {
    const donation = donations.find(d => d.id === id);
    setSelectedDonation(donation);
    setActiveTab('donationForm');
  };

  const handleViewDonation = (id) => {
    const donation = donations.find(d => d.id === id);
    setSelectedDonation(donation);
    setActiveTab('donationView');
  };

  const handleCreateCategory = async (categoryData) => {
    setIsLoading(true);
    setError(null);
    try {
      await createDonationCategory(categoryData);
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
      await updateDonationCategory(id, categoryData);
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
      await deleteDonationCategory(id);
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
      await createDonationSubCategory(subCategoryData);
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
      await updateDonationSubCategory(id, subCategoryData);
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
      await deleteDonationSubCategory(id);
      fetchSubCategories();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حذف الفئة الفرعية');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchDonations(page);
  };

  const handleSubmit = (formData) => {
    // Handle form submission
    console.log('Form submitted:', formData);
    setShowFormModal(false);
  };

  const handleSearch = (searchTerm) => {
    fetchDonations(1, { search: searchTerm });
  };

  const handleFilter = (filters) => {
    fetchDonations(1, filters);
  };

  return (
    <div className="donation-management-container">
      <h2 className="donation-header">نظام إدارة التبرعات</h2>
      
      <AddButton handleAdd={() => setShowFormModal(true)} />
    
      <div className="donation-tabs-container">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="donation-tabs custom-nav-tabs"
        >
          <Tab eventKey="donations" title="قائمة التبرعات">
            <div className="tab-content">
              <DonationTable
                donations={donations}
                onEdit={handleEditDonation}
                onDelete={handleDeleteDonation}
                onView={handleViewDonation}
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

      <DonationForm
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          setSelectedDonation(null);
        }}
        donation={selectedDonation}
        onSubmit={() => {
          // Just refresh the list after successful creation/update
          fetchDonations();
          setShowFormModal(false);
          setSelectedDonation(null);
        }}
        categories={categories}
        subCategories={subCategories}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default Donations;