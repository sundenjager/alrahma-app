import React, { useState, useEffect, useMemo } from 'react';
import { Button, Pagination, Alert } from 'react-bootstrap';
import SuggestionFormModal from './SuggestionFormModal';
import SuggestionTable from './SuggestionTable';
import SuggestionFilters from './SuggestionFilters';
import AddButton from '../../AddButton';
import committeePVService from '../../../services/committeePVService';
import { useAuth } from '../../../contexts/AuthContext';
import './styles.css';

const CommitteePV = () => {
  const { user } = useAuth();
  const isAdmin = user?.Role === 'Admin' || user?.Role === 'SuperAdmin';
  const isReadOnly = !isAdmin;

  const [suggestions, setSuggestions] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [committeeNames, setCommitteeNames] = useState([
    "لجنة الشباب",
    "لجنة التخطيط و الدراسات",
    "لجنة الصحة",
    "لجنة الأسرة",
    "لجنة التنمية",
    "لجنة الكفالة",
    "لجنة الاعلام"
  ]);
  const [formData, setFormData] = useState({
    number: '',
    attendees: '',  
    dateTime: '',
    document: null,
    committee: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Enhanced Filter States
  const [filters, setFilters] = useState({
    searchTerm: '',
    committee: '',
    date: '',
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  // Enhanced Filtering with useMemo
  const filteredSuggestions = useMemo(() => {
    let results = [...suggestions];
    
    // Text search across multiple fields
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      results = results.filter(suggestion => {
        const searchableFields = [
          suggestion.number || '',
          suggestion.committee || '',
          ...(suggestion.attendees || [])
        ].join(' ').toLowerCase();
        
        return searchableFields.includes(term);
      });
    }
    
    // Committee filter
    if (filters.committee) {
      results = results.filter(suggestion => 
        suggestion.committee === filters.committee
      );
    }
    
    // Date filter
    if (filters.date) {
      results = results.filter(suggestion => {
        const suggestionDate = new Date(suggestion.dateTime).toISOString().split('T')[0];
        return suggestionDate === filters.date;
      });
    }
    
    return results;
  }, [suggestions, filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== '');
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await committeePVService.getAll({
        PageNumber: 1,
        PageSize: 100
      });
      
      const formattedData = response.map(item => ({
        ...item,
        id: item.id || item.Id,
        number: item.number || item.Number,
        committee: item.committee || item.Committee,
        attendees: Array.isArray(item.attendees) ? 
          item.attendees : 
          (item.attendees ? [item.attendees] : []),
        dateTime: item.dateTime || item.DateTime
      }));
      
      setSuggestions(formattedData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'فشل تحميل البيانات');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter handlers
  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
    setCurrentPage(1);
  };

  const handleCommitteeFilterChange = (e) => {
    setFilters(prev => ({ ...prev, committee: e.target.value }));
    setCurrentPage(1);
  };

  const handleDateFilterChange = (e) => {
    setFilters(prev => ({ ...prev, date: e.target.value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      committee: '',
      date: '',
    });
    setCurrentPage(1);
  };

  const handleShowFormModal = () => {
    setFormData({
      number: '',
      attendees: '',
      dateTime: '',
      document: null,
      committee: '',
    });
    setShowFormModal(true);
  };

  const handleDelete = async (index) => {
    if (isReadOnly) {
      setError('غير مسموح بالحذف في وضع القراءة فقط. يرجى التواصل مع المسؤول.');
      return;
    }
    
    const suggestionToDelete = filteredSuggestions[index];
    
    if (window.confirm(`هل أنت متأكد من حذف المحضر رقم ${suggestionToDelete.number}؟`)) {
      try {
        await committeePVService.delete(suggestionToDelete.id);
        await fetchData();
      } catch (err) {
        setError('فشل حذف المحضر. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const formattedData = {
        ...formData,
        attendees: formData.attendees.split(',').map(item => item.trim()).filter(item => item)
      };

      await committeePVService.create(formattedData);
      
      setShowFormModal(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (id) => {
    try {
      await committeePVService.downloadDocument(id);
    } catch (err) {
      setError('فشل تنزيل المستند. يرجى المحاولة مرة أخرى.');
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSuggestions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSuggestions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="CommiteeSuggestions-component">
      {isReadOnly && (
        <Alert variant="info" className="mb-3">
          <strong>وضع القراءة فقط:</strong> يمكنك فقط عرض البيانات دون إمكانية التعديل أو الحذف
        </Alert>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Enhanced Filters */}
      <SuggestionFilters
        searchTerm={filters.searchTerm}
        onSearchChange={handleSearchChange}
        suggestionsCount={filteredSuggestions.length}
        committeeFilter={filters.committee}
        onCommitteeFilterChange={handleCommitteeFilterChange}
        committeeNames={committeeNames}
        dateFilter={filters.date}
        onDateFilterChange={handleDateFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {!isReadOnly && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <AddButton handleAdd={handleShowFormModal} />
          
          {/* Results Summary */}
          <div className="text-muted small">
            عرض {Math.min(itemsPerPage, currentItems.length)} من أصل {filteredSuggestions.length} محضر
            {hasActiveFilters && ' (مصفى)'}
          </div>
        </div>
      )}

      <SuggestionTable 
        suggestions={currentItems} 
        onDelete={isReadOnly ? null : handleDelete}
        onDownloadDocument={handleDownloadDocument}
        isReadOnly={isReadOnly}
      />

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container mt-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              الصفحة {currentPage} من {totalPages}
            </div>
            
            <Pagination className="mb-0">
              <Pagination.First 
                onClick={() => paginate(1)} 
                disabled={currentPage === 1} 
              />
              <Pagination.Prev 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1} 
              />
              
              {/* Show limited page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <Pagination.Item 
                    key={pageNumber}
                    active={pageNumber === currentPage}
                    onClick={() => paginate(pageNumber)}
                  >
                    {pageNumber}
                  </Pagination.Item>
                );
              })}
              
              <Pagination.Next 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages} 
              />
              <Pagination.Last 
                onClick={() => paginate(totalPages)} 
                disabled={currentPage === totalPages} 
              />
            </Pagination>
          </div>
        </div>
      )}

      <SuggestionFormModal
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        committeeNames={committeeNames}
      />
    </div>
  );
};

export default CommitteePV;