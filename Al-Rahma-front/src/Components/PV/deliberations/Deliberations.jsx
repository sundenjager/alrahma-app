import React, { useState, useEffect, useMemo } from 'react';
import { Button, Pagination, Alert, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import DeliberationFilters from './DeliberationFilters';
import DeliberationTable from './DeliberationTable';
import AddButton from '../../AddButton';
import deliberationService from '../../../services/deliberationService';
import './styles.css';
import { FaSyncAlt } from 'react-icons/fa';

const Deliberations = () => {
  const navigate = useNavigate();
  
  // State management
  const [deliberations, setDeliberations] = useState([]);
  const [loading, setLoading] = useState({
    page: false,
    document: false
  });
  const [error, setError] = useState(null);
  const [committeeOptions, setCommitteeOptions] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deliberationToDelete, setDeliberationToDelete] = useState(null);
  
  // Enhanced Filter states
  const [filters, setFilters] = useState({
    searchTerm: '',
    date: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch data on mount
  useEffect(() => {
    fetchDeliberations();
    fetchCommittees();
  }, []);

  // Enhanced Filtering with useMemo
  const filteredResults = useMemo(() => {
    let results = [...deliberations];
    
    // Enhanced text search across multiple fields
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      results = results.filter(deliberation => {
        const searchableFields = [
          deliberation.number || '',
          ...(deliberation.attendees || [])
        ].join(' ').toLowerCase();
        
        return searchableFields.includes(term);
      });
    }
    
    // Date filter
    if (filters.date) {
      results = results.filter(deliberation => {
        const deliberationDate = new Date(deliberation.dateTime).toISOString().split('T')[0];
        return deliberationDate === filters.date;
      });
    }
    
    return results;
  }, [deliberations, filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== '');
  }, [filters]);

  // Pagination calculations
  const { currentItems, totalPages } = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return {
      currentItems: filteredResults.slice(indexOfFirstItem, indexOfLastItem),
      totalPages: Math.ceil(filteredResults.length / itemsPerPage)
    };
  }, [currentPage, filteredResults]);

  // API calls
  const fetchDeliberations = async () => {
    setLoading(prev => ({...prev, page: true}));
    setError(null);
    try {
      const data = await deliberationService.getAll();
      setDeliberations(data);
    } catch (error) {
      setError(error.message || 'Failed to fetch deliberations');
    } finally {
      setLoading(prev => ({...prev, page: false}));
    }
  };

  const fetchCommittees = async () => {
    try {
      const committees = await deliberationService.getCommittees();
      setCommitteeOptions(committees);
    } catch (error) {
      console.error('Failed to fetch committees:', error);
      setCommitteeOptions([
        "لجنة الشباب", "لجنة التخطيط و الدراسات", "لجنة الصحة", 
        "لجنة الأسرة", "لجنة التنمية", "لجنة الكفالة",
        "الهيئة المديرة", "لجنة وقتية"
      ]);
    }
  };

  // Enhanced Filter handlers
  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
    setCurrentPage(1);
  };

  const handleDateFilterChange = (e) => {
    setFilters(prev => ({ ...prev, date: e.target.value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      date: '',
    });
    setCurrentPage(1);
  };

  // Handlers
  const handleAddDeliberation = () => {
    navigate('/deliberations/new');
  };

  const handleDeleteClick = (index) => {
    setDeliberationToDelete(filteredResults[index]);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deliberationToDelete) return;
    
    try {
      await deliberationService.delete(deliberationToDelete.id);
      setDeliberations(prev => prev.filter(d => d.id !== deliberationToDelete.id));
    } catch (error) {
      setError(error.message);
    } finally {
      setShowDeleteConfirm(false);
      setDeliberationToDelete(null);
    }
  };

  const handleDownloadDocument = async (id) => {
    setLoading(prev => ({...prev, document: true}));
    try {
      await deliberationService.downloadDocument(id);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download document: ' + error.message);
    } finally {
      setLoading(prev => ({...prev, document: false}));
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="deliberations-component">
      {/* Loading overlay */}
      {(loading.page || loading.document) && (
        <div className="loading-overlay">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {/* Error alert */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Enhanced Filters section */}
      <DeliberationFilters
        searchTerm={filters.searchTerm}
        onSearchChange={handleSearchChange}
        deliberationsCount={filteredResults.length}
        dateFilter={filters.date}
        onDateFilterChange={handleDateFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Action buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <AddButton handleAdd={handleAddDeliberation} />
        
        {/* Results Summary */}
        <div className="text-muted small deliberation-results-summary">
          عرض {Math.min(itemsPerPage, currentItems.length)} من أصل {filteredResults.length} مداولة
          {hasActiveFilters && ' (مصفى)'}
        </div>
        
        <Button 
          variant="outline-secondary" 
          onClick={fetchDeliberations}
          disabled={loading.page}
          aria-label="Refresh data"
          className="deliberation-refresh-btn"
        >
          <FaSyncAlt className={`me-2 ${loading.page ? 'spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* Main table */}
      {filteredResults.length === 0 ? (
        <div className="text-center py-5 deliberation-empty-state">
          {deliberations.length === 0 ? (
            <div>
              <h5 className="text-muted mb-3">لا توجد مداولات</h5>
              <p className="text-muted">لم يتم إضافة أي مداولات بعد.</p>
              <Button 
                variant="primary" 
                onClick={handleAddDeliberation}
                className="mt-2"
              >
                إضافة أول مداولة
              </Button>
            </div>
          ) : (
            <div>
              <h5 className="text-muted mb-3">لا توجد نتائج</h5>
              <p className="text-muted">لا توجد مداولات تطابق الفلاتر الخاصة بك.</p>
              {hasActiveFilters && (
                <Button 
                  variant="outline-primary" 
                  onClick={handleClearFilters}
                  className="mt-2"
                >
                  مسح جميع الفلاتر
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <DeliberationTable 
            deliberations={currentItems} 
            onDelete={handleDeleteClick}
            onDownloadDocument={handleDownloadDocument}
            isDownloading={loading.document}
          />

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="deliberation-pagination-container mt-4">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted small deliberation-pagination-info">
                  الصفحة {currentPage} من {totalPages}
                </div>
                
                <Pagination className="mb-0 deliberation-pagination">
                  <Pagination.First 
                    onClick={() => paginate(1)} 
                    disabled={currentPage === 1} 
                  />
                  <Pagination.Prev 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1} 
                  />
                  
                  {/* Smart page numbers display */}
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
        </>
      )}

      {/* Delete confirmation */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="text-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            تأكيد الحذف
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <p className="lead">
              هل أنت متأكد من رغبتك في حذف المداولة رقم 
              <strong className="text-primary"> {deliberationToDelete?.number}</strong>؟
            </p>
            <p className="text-muted">
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteConfirm(false)}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            <i className="fas fa-trash me-2"></i>
            حذف المداولة
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Deliberations;