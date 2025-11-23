// Updated SuggestedPrograms.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Spinner, Alert, Button } from 'react-bootstrap';
import AddButton from '../AddButton';
import ProgramsTable from './ProgramsTable';
import ProgramsFilter from './ProgramsFilter';
import ProgramsStats from './ProgramsStats';
import {
  getPrograms,
  deleteProgram,
  getCommittees,
  getYears
} from '../../services/SuggestedProgramsService';
import { formatArabicTNDate, formatTND } from '../../utils/Formatters';
import { useAuth } from '../../contexts/AuthContext';
import './SuggestedPrograms.css';

const SuggestedPrograms = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    committee: '',
    year: '',
    implementationStatus: '',
    fundingStatus: '',
    search: '',
    minBudget: '',
    maxBudget: '',
    startDate: '',
    endDate: '',
    minBeneficiaries: '',
    maxBeneficiaries: ''
  });
  const [programs, setPrograms] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin = user?.Role === 'Admin' || user?.Role === 'SuperAdmin';

  useEffect(() => {
    if (isAdmin) {
      const fetchInitialData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const [programsData, committeesData, yearsData] = await Promise.all([
            getPrograms(),
            getCommittees(),
            getYears()
          ]);
          
          setPrograms(programsData);
          setCommittees(committeesData);
          setYears(yearsData.sort((a, b) => b - a));
        } catch (err) {
          console.error('Fetch error:', err);
          setError('فشل تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.');
        } finally {
          setLoading(false);
        }
      };

      fetchInitialData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleDeleteProgram = async (id) => {
    try {
      setDeletingId(id);
      await deleteProgram(id);
      setPrograms(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      setError('فشل حذف البرنامج. يرجى المحاولة مرة أخرى.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      committee: '',
      year: '',
      implementationStatus: '',
      fundingStatus: '',
      search: '',
      minBudget: '',
      maxBudget: '',
      startDate: '',
      endDate: '',
      minBeneficiaries: '',
      maxBeneficiaries: ''
    });
  };

  // Filter programs based on all active filters
  const filteredPrograms = programs.filter(program => {
    // Committee filter
    if (filters.committee && program.committee !== filters.committee) {
      return false;
    }

    // Year filter
    if (filters.year && program.year !== filters.year) {
      return false;
    }

    // Implementation status filter
    if (filters.implementationStatus && program.implementationStatus !== filters.implementationStatus) {
      return false;
    }

    // Funding status filter
    if (filters.fundingStatus && program.fundingStatus !== filters.fundingStatus) {
      return false;
    }

    // Search filter
    if (filters.search && !program.project?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Budget range filter
    if (filters.minBudget && (program.budget || 0) < parseFloat(filters.minBudget)) {
      return false;
    }
    if (filters.maxBudget && (program.budget || 0) > parseFloat(filters.maxBudget)) {
      return false;
    }

    // Date range filter
    if (filters.startDate && program.startDate < filters.startDate) {
      return false;
    }
    if (filters.endDate && program.startDate > filters.endDate) {
      return false;
    }

    // Beneficiaries count filter
    if (filters.minBeneficiaries && (program.beneficiariesCount || 0) < parseInt(filters.minBeneficiaries)) {
      return false;
    }
    if (filters.maxBeneficiaries && (program.beneficiariesCount || 0) > parseInt(filters.maxBeneficiaries)) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger" className="text-center">
          {error}
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="ms-3"
            onClick={() => window.location.reload()}
          >
            حاول مرة أخرى
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 suggqested-programs-container">
      <div className="page-header mb-4">
        <h1 className="border-bottom pb-2">البرامج المقترحة</h1>
        <p className="text-muted mb-0">إدارة ومتابعة البرامج والمشاريع المقترحة</p>
      </div>

      {isAdmin ? (
        <>
          {/* Statistics Section */}
          <ProgramsStats 
            programs={programs} 
            loading={loading}
          />

          {/* Filter Section */}
          <ProgramsFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            committees={committees}
            years={years}
            loading={loading}
          />

          {/* Action Bar */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="mb-0">
                عرض {filteredPrograms.length} من أصل {programs.length} برنامج
              </h6>
              {Object.values(filters).some(filter => filter !== '') && (
                <small className="text-muted">
                  التصفيات مفعلة -{' '}
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0" 
                    onClick={handleResetFilters}
                  >
                    إظهار الكل
                  </Button>
                </small>
              )}
            </div>
            
            <AddButton 
              handleAdd={() => navigate('/suggested-programs/new')}
              disabled={loading}
              text="إضافة برنامج جديد"
            />
          </div>

          {/* Programs Table */}
          <div className="mt-3">
            {filteredPrograms.length > 0 ? (
              <ProgramsTable 
                programs={filteredPrograms}
                onEdit={(program) => navigate(`/suggested-programs/edit/${program.id}`)}
                onDelete={handleDeleteProgram}
                formatDate={formatArabicTNDate}
                formatCurrency={formatTND}
                formatNumber={(num) => new Intl.NumberFormat('en-US').format(num)}
              />
            ) : (
              <Alert variant="info" className="text-center">
                {programs.length === 0 ? 'لا توجد برامج متاحة للعرض' : 'لا توجد نتائج تطابق معايير البحث'}
              </Alert>
            )}
          </div>
        </>
      ) : (
        <div className="text-center">
          <Alert variant="info" className="mb-4">
            يمكنك إضافة برامج مقترحة جديدة فقط
          </Alert>
          <AddButton 
            handleAdd={() => navigate('/suggested-programs/new')}
            text="إضافة برنامج جديد"
            size="lg"
          />
        </div>
      )}
    </div>
  );
};

export default SuggestedPrograms;