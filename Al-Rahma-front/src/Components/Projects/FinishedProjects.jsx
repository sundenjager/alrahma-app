import React, { useState } from 'react';
import { 
  Table, Button, Badge, Modal, Alert, 
  Container, Row, Col, Spinner, Stack
} from 'react-bootstrap';
import { FaEye, FaPrint, FaMoneyBillWave, FaFileExcel, FaFilePdf, FaBox, FaCalendarAlt, FaShoppingCart, FaHandHoldingHeart, FaFilter, FaSync } from 'react-icons/fa';
import { useQuery } from 'react-query';
import ongoingProjectsService from '../../services/ongoingProjectsService';
import { getAidsByProject } from '../../services/aidService';
import { getSuppliesByProject } from '../../services/suppliesService';
import ProjectDetailsModal from '../OngoingProjects/ProjectDetailsModal';
import PdfExportButton from './PdfExportButton';
import ExportToExcel from '../ExportToExcel';
import FinishedProjectsFilter from './FinishedProjectsFilter';
import './FinishedProjects.css';

const FinishedProjects = () => {
  const [modalState, setModalState] = useState({
    showDetails: false,
    selectedProject: null
  });

  const [filters, setFilters] = useState({
    committee: '',
    year: '',
    search: '',
    minBudget: '',
    maxBudget: '',
    startDate: '',
    endDate: '',
    minBeneficiaries: '',
    maxBeneficiaries: '',
    minAidValue: '',
    maxAidValue: '',
    minPurchaseValue: '',
    maxPurchaseValue: '',
    minDonationValue: '',
    maxDonationValue: ''
  });

  const [projectAids, setProjectAids] = useState({});
  const [projectSupplies, setProjectSupplies] = useState({});

  // Format currency in Tunisian Dinars (DT)
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'غير محدد';
    return new Intl.NumberFormat('ar-TN').format(value) + ' د.ت';
  };

  // Format dates in Arabic
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'غير محدد';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ar-TN', options);
  };

  // Calculate total aid value for a project
  const calculateTotalAidValue = (projectId) => {
    const aids = projectAids[projectId] || [];
    return aids.reduce((total, aid) => total + (aid.monetaryValue || 0), 0);
  };

  // Count total aid items for a project
  const countTotalAidItems = (projectId) => {
    const aids = projectAids[projectId] || [];
    return aids.reduce((total, aid) => total + (aid.items?.length || 0), 0);
  };

  // Calculate total purchase value for a project
  const calculateTotalPurchaseValue = (projectId) => {
    const supplies = projectSupplies[projectId] || [];
    const purchases = supplies.filter(supply => supply.suppliesNature === 'Purchase');
    return purchases.reduce((total, purchase) => total + (purchase.monetaryValue || 0), 0);
  };

  // Calculate total donation value for a project
  const calculateTotalDonationValue = (projectId) => {
    const supplies = projectSupplies[projectId] || [];
    const donations = supplies.filter(supply => supply.suppliesNature === 'Donation');
    return donations.reduce((total, donation) => total + (donation.monetaryValue || 0), 0);
  };

  // Count total purchase items for a project
  const countTotalPurchaseItems = (projectId) => {
    const supplies = projectSupplies[projectId] || [];
    const purchases = supplies.filter(supply => supply.suppliesNature === 'Purchase');
    return purchases.reduce((total, purchase) => total + (purchase.items?.length || 0), 0);
  };

  // Count total donation items for a project
  const countTotalDonationItems = (projectId) => {
    const supplies = projectSupplies[projectId] || [];
    const donations = supplies.filter(supply => supply.suppliesNature === 'Donation');
    return donations.reduce((total, donation) => total + (donation.items?.length || 0), 0);
  };

  const handlePrint = () => {
    const currentYear = new Date().getFullYear();
    const printContent = document.getElementById('finished-projects-print').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div class="print-container" style="padding: 20px;">
        <h2 class="text-center">المشاريع المنجزة</h2>
        <p class="text-center">سنة التقرير: ${currentYear}</p>
        <p class="text-center">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-TN')}</p>
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
  };

  // Fetch committees and years for filters
  const { data: committees = [] } = useQuery(
    'committees',
    () => ongoingProjectsService.getCommittees(),
    { 
      staleTime: 1000 * 60 * 30,
      onError: (error) => {
        console.error('Failed to fetch committees:', error);
      }
    }
  );

  const { data: years = [] } = useQuery(
    'years',
    () => ongoingProjectsService.getYears(),
    { 
      staleTime: 1000 * 60 * 30,
      onError: (error) => {
        console.error('Failed to fetch years:', error);
      }
    }
  );

  // Fetch only completed projects
  const { 
    data: allProjects = [], 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery(
    'completedProjects',
    () => ongoingProjectsService.getCompletedProjects(),
    {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      onError: (err) => {
        console.error('Failed to fetch completed projects:', err);
      },
      onSuccess: (data) => {
        fetchAidsForProjects(data);
        fetchSuppliesForProjects(data);
      }
    }
  );

  // Function to fetch aids for all projects
  const fetchAidsForProjects = async (projectsData) => {
    const aidsMap = {};
    
    for (const project of projectsData) {
      try {
        const aids = await getAidsByProject(project.id);
        aidsMap[project.id] = aids;
      } catch (error) {
        console.error(`Error fetching aids for project ${project.id}:`, error);
        aidsMap[project.id] = [];
      }
    }
    
    setProjectAids(aidsMap);
  };

  // Function to fetch supplies for all projects
  const fetchSuppliesForProjects = async (projectsData) => {
    const suppliesMap = {};
    
    for (const project of projectsData) {
      try {
        const supplies = await getSuppliesByProject(project.id);
        suppliesMap[project.id] = supplies;
      } catch (error) {
        console.error(`Error fetching supplies for project ${project.id}:`, error);
        suppliesMap[project.id] = [];
      }
    }
    
    setProjectSupplies(suppliesMap);
  };

  // Apply filters locally
  const filteredProjects = allProjects.filter(project => {
    // Committee filter
    if (filters.committee && project.committee !== filters.committee) {
      return false;
    }

    // Year filter (based on completion date)
    if (filters.year) {
      const projectYear = new Date(project.completionDate).getFullYear().toString();
      if (projectYear !== filters.year) {
        return false;
      }
    }

    // Search filter
    if (filters.search && !project.project?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Budget range filter
    const projectBudget = parseFloat(project.budget) || 0;
    if (filters.minBudget && projectBudget < parseFloat(filters.minBudget)) {
      return false;
    }
    if (filters.maxBudget && projectBudget > parseFloat(filters.maxBudget)) {
      return false;
    }

    // Date range filter (completion date)
    if (filters.startDate && project.completionDate) {
      const projectDate = new Date(project.completionDate);
      const filterStartDate = new Date(filters.startDate);
      if (projectDate < filterStartDate) return false;
    }
    if (filters.endDate && project.completionDate) {
      const projectDate = new Date(project.completionDate);
      const filterEndDate = new Date(filters.endDate);
      if (projectDate > filterEndDate) return false;
    }

    // Beneficiaries count filter
    const beneficiariesCount = parseInt(project.beneficiariesCount) || 0;
    if (filters.minBeneficiaries && beneficiariesCount < parseInt(filters.minBeneficiaries)) {
      return false;
    }
    if (filters.maxBeneficiaries && beneficiariesCount > parseInt(filters.maxBeneficiaries)) {
      return false;
    }

    // Aid value filter
    const totalAidValue = calculateTotalAidValue(project.id);
    if (filters.minAidValue && totalAidValue < parseFloat(filters.minAidValue)) {
      return false;
    }
    if (filters.maxAidValue && totalAidValue > parseFloat(filters.maxAidValue)) {
      return false;
    }

    // Purchase value filter
    const totalPurchaseValue = calculateTotalPurchaseValue(project.id);
    if (filters.minPurchaseValue && totalPurchaseValue < parseFloat(filters.minPurchaseValue)) {
      return false;
    }
    if (filters.maxPurchaseValue && totalPurchaseValue > parseFloat(filters.maxPurchaseValue)) {
      return false;
    }

    // Donation value filter
    const totalDonationValue = calculateTotalDonationValue(project.id);
    if (filters.minDonationValue && totalDonationValue < parseFloat(filters.minDonationValue)) {
      return false;
    }
    if (filters.maxDonationValue && totalDonationValue > parseFloat(filters.maxDonationValue)) {
      return false;
    }

    return true;
  });

  // Apply filters
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      committee: '',
      year: '',
      search: '',
      minBudget: '',
      maxBudget: '',
      startDate: '',
      endDate: '',
      minBeneficiaries: '',
      maxBeneficiaries: '',
      minAidValue: '',
      maxAidValue: '',
      minPurchaseValue: '',
      maxPurchaseValue: '',
      minDonationValue: '',
      maxDonationValue: ''
    });
  };

  // Prepare data for export (filtered data)
  const getExportData = () => {
    return filteredProjects.map(project => ({
      'اسم المشروع': project.project || '',
      'كود المشروع': project.projectCode || '',
      'اللجنة': project.committee || '',
      'مدير المشروع': project.projectManager || '',
      'هاتف المدير': project.contactPhone || '',
      'تاريخ البدء': project.startDate ? formatDate(project.startDate) : '',
      'تاريخ الانتهاء': project.completionDate ? formatDate(project.completionDate) : '',
      'الميزانية': project.budget || 0,
      'إجمالي المساعدات': calculateTotalAidValue(project.id),
      'إجمالي المشتريات': calculateTotalPurchaseValue(project.id),
      'إجمالي التبرعات': calculateTotalDonationValue(project.id),
      'عدد المساعدات': (projectAids[project.id] || []).length,
      'عدد المشتريات': (projectSupplies[project.id] || []).filter(s => s.suppliesNature === 'Purchase').length,
      'عدد التبرعات': (projectSupplies[project.id] || []).filter(s => s.suppliesNature === 'Donation').length,
      'عدد المواد المساعدة': countTotalAidItems(project.id),
      'عدد مواد المشتريات': countTotalPurchaseItems(project.id),
      'عدد مواد التبرعات': countTotalDonationItems(project.id),
      'الحالة': 'تم الانجاز',
      'الموقع': project.place || '',
      'الفئة المستفيدة': project.beneficiaries || '',
      'عدد المستفيدين': project.beneficiariesCount || 0,
      'المدة': project.period || '',
      'مصدر التمويل': project.budgetSource || '',
      'عدد المراحل': project.phases?.length || 0
    }));
  };



  // Open modal helper
  const openModal = (modalName, project) => {
    setModalState(prev => ({
      ...prev,
      [`show${modalName}`]: true,
      selectedProject: project
    }));
  };

  // Close modal helper
  const closeModal = (modalName) => {
    setModalState(prev => ({
      ...prev,
      [`show${modalName}`]: false,
      selectedProject: null
    }));
  };

  const hasActiveFilters = Object.values(filters).some(filter => 
    filter !== '' && filter !== null && filter !== undefined
  );

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">جاري تحميل المشاريع المنجزة...</span>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        <Alert variant="danger" className="mt-4">
          {error.message || 'حدث خطأ أثناء جلب بيانات المشاريع المنجزة'}
          <Button variant="link" onClick={refetch} className="p-0 ms-2">
            حاول مرة أخرى
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="finished-projects-container py-4">
      {/* Header and buttons */}
      <Row className="mb-4">
        <Col>
          <h2 className="mb-2 d-flex align-items-center">
            <FaMoneyBillWave className="me-2 text-success" />
            المشاريع المنجزة
            <Badge bg="secondary" className="ms-2 fs-6">
              {filteredProjects.length}
              {hasActiveFilters && allProjects.length !== filteredProjects.length && (
                <span className="ms-1">/ {allProjects.length}</span>
              )}
            </Badge>
          </h2>
          {hasActiveFilters && (
            <p className="text-muted mb-0">
              عرض {filteredProjects.length} من أصل {allProjects.length} مشروع
            </p>
          )}
        </Col>
        <Col xs="auto">
          <Stack direction="horizontal" gap={2}>
            <Button 
              variant="outline-secondary" 
              onClick={refetch}
              disabled={isLoading}
              className="d-flex align-items-center"
            >
              <FaSync className={`me-1 ${isLoading ? 'fa-spin' : ''}`} />
              تحديث
            </Button>
            <FinishedProjectsFilter 
              filters={filters}
              onApply={applyFilters}
              onReset={resetFilters}
              committees={committees}
              years={years}
              loading={isLoading}
            />
            <ExportToExcel 
              data={getExportData()} 
              filename="المشاريع المنجزة"
              buttonText="Excel"
              buttonProps={{ 
                size: "sm", 
                variant: "outline-success",
                className: "d-flex align-items-center"
              }}
            />

            <Button 
              variant="outline-primary" 
              onClick={handlePrint}
              className="d-flex align-items-center"
            >
              <FaPrint className="me-1" /> طباعة
            </Button>
          </Stack>
        </Col>
      </Row>

      {/* Active Filters Alert */}
      {hasActiveFilters && (
        <Alert variant="info" className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <FaFilter className="me-2" />
            <span>التصفيات مفعلة - عرض {filteredProjects.length} نتيجة</span>
          </div>
          <Button variant="outline-info" size="sm" onClick={resetFilters}>
            إلغاء جميع التصفيات
          </Button>
        </Alert>
      )}

      {/* Main interactive table (visible on screen) */}
      {filteredProjects.length === 0 ? (
        <Alert variant="info" className="text-center">
          {allProjects.length === 0 
            ? 'لا توجد مشاريع منجزة مسجلة' 
            : 'لا توجد مشاريع تطابق معايير البحث الخاصة بك'
          }
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover className="align-middle">
            <thead className="table-dark">
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '18%' }}>اسم المشروع</th>
                <th style={{ width: '12%' }}>اللجنة</th>
                <th style={{ width: '12%' }}>المدير</th>
                <th style={{ width: '15%' }}>الفترة</th>
                <th style={{ width: '20%' }}>الميزانية والموارد</th>
                <th style={{ width: '8%' }}>الحالة</th>
                <th style={{ width: '10%' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => {
                const totalAidValue = calculateTotalAidValue(project.id);
                const totalPurchaseValue = calculateTotalPurchaseValue(project.id);
                const totalDonationValue = calculateTotalDonationValue(project.id);
                const totalResourcesValue = totalAidValue + totalPurchaseValue + totalDonationValue;
                
                const aidCount = (projectAids[project.id] || []).length;
                const purchaseCount = (projectSupplies[project.id] || []).filter(s => s.suppliesNature === 'Purchase').length;
                const donationCount = (projectSupplies[project.id] || []).filter(s => s.suppliesNature === 'Donation').length;
                
                const aidItemCount = countTotalAidItems(project.id);
                const purchaseItemCount = countTotalPurchaseItems(project.id);
                const donationItemCount = countTotalDonationItems(project.id);
                
                return (
                  <tr key={project.id}>
                    <td className="text-center fw-bold">{index + 1}</td>
                    <td>
                      <strong className="text-primary">{project.project}</strong>
                      {project.projectCode && (
                        <div className="text-muted small mt-1">
                          <Badge bg="outline-secondary" className="fs-12">
                            الكود: {project.projectCode}
                          </Badge>
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="fs-12">
                        {project.committee || 'غير محدد'}
                      </Badge>
                    </td>
                    <td>
                      <div>{project.projectManager || 'غير محدد'}</div>
                      {project.contactPhone && (
                        <div className="text-muted small">
                          {project.contactPhone}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="small">
                        <div className="d-flex align-items-center mb-1">
                          <FaCalendarAlt className="me-1 text-success" size={12} />
                          من {formatDate(project.startDate)}
                        </div>
                        <div className="d-flex align-items-center">
                          <FaCalendarAlt className="me-1 text-danger" size={12} />
                          إلى {formatDate(project.completionDate)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaMoneyBillWave className="me-2 text-success" />
                        <div>
                          <div className="fw-bold">{formatCurrency(project.budget)}</div>
                          
                          {/* Aid Summary */}
                          {aidCount > 0 && (
                            <div className="mt-1">
                              <FaBox className="me-1 text-primary" size={12} />
                              <span className="text-primary small">
                                المساعدات: {formatCurrency(totalAidValue)} 
                                <Badge bg="primary" className="ms-1" pill>
                                  {aidCount} مساعدة
                                </Badge>
                                {aidItemCount > 0 && (
                                  <Badge bg="secondary" className="ms-1" pill>
                                    {aidItemCount} مادة
                                  </Badge>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Purchase Summary */}
                          {purchaseCount > 0 && (
                            <div className="mt-1">
                              <FaShoppingCart className="me-1 text-warning" size={12} />
                              <span className="text-warning small">
                                المشتريات: {formatCurrency(totalPurchaseValue)} 
                                <Badge bg="warning" className="ms-1" pill>
                                  {purchaseCount} شراء
                                </Badge>
                                {purchaseItemCount > 0 && (
                                  <Badge bg="secondary" className="ms-1" pill>
                                    {purchaseItemCount} مادة
                                  </Badge>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Donation Summary */}
                          {donationCount > 0 && (
                            <div className="mt-1">
                              <FaHandHoldingHeart className="me-1 text-success" size={12} />
                              <span className="text-success small">
                                التبرعات: {formatCurrency(totalDonationValue)} 
                                <Badge bg="success" className="ms-1" pill>
                                  {donationCount} تبرع
                                </Badge>
                                {donationItemCount > 0 && (
                                  <Badge bg="secondary" className="ms-1" pill>
                                    {donationItemCount} مادة
                                  </Badge>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Total Resources Summary */}
                          {(aidCount > 0 || purchaseCount > 0 || donationCount > 0) && (
                            <div className="mt-1">
                              <strong className="small">
                                إجمالي الموارد: {formatCurrency(totalResourcesValue)}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="success" pill className="fs-12">تم الانجاز</Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => openModal('Details', project)}
                        className="d-flex align-items-center justify-content-center w-100"
                      >
                        <FaEye className="me-1" /> التفاصيل
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      {/* Printable Version (hidden on screen) */}
      <div id="finished-projects-print" style={{ display: 'none' }}>
        <Table bordered>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم المشروع</th>
              <th>اللجنة</th>
              <th>المدير</th>
              <th>الفترة</th>
              <th>الميزانية والموارد</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project, index) => {
              const totalAidValue = calculateTotalAidValue(project.id);
              const totalPurchaseValue = calculateTotalPurchaseValue(project.id);
              const totalDonationValue = calculateTotalDonationValue(project.id);
              const totalResourcesValue = totalAidValue + totalPurchaseValue + totalDonationValue;
              
              const aidCount = (projectAids[project.id] || []).length;
              const purchaseCount = (projectSupplies[project.id] || []).filter(s => s.suppliesNature === 'Purchase').length;
              const donationCount = (projectSupplies[project.id] || []).filter(s => s.suppliesNature === 'Donation').length;
              
              return (
                <tr key={project.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{project.project}</strong>
                    {project.projectCode && <div className="text-muted small">الكود: {project.projectCode}</div>}
                  </td>
                  <td>{project.committee}</td>
                  <td>
                    {project.projectManager}
                    {project.contactPhone && <div className="text-muted small">{project.contactPhone}</div>}
                  </td>
                  <td>
                    <div>من {formatDate(project.startDate)}</div>
                    <div>إلى {formatDate(project.completionDate)}</div>
                  </td>
                  <td>
                    <div>
                      <div>الميزانية: {formatCurrency(project.budget)}</div>
                      {aidCount > 0 && (
                        <div className="text-primary">
                          المساعدات: {formatCurrency(totalAidValue)} ({aidCount} مساعدة)
                        </div>
                      )}
                      {purchaseCount > 0 && (
                        <div className="text-warning">
                          المشتريات: {formatCurrency(totalPurchaseValue)} ({purchaseCount} شراء)
                        </div>
                      )}
                      {donationCount > 0 && (
                        <div className="text-success">
                          التبرعات: {formatCurrency(totalDonationValue)} ({donationCount} تبرع)
                        </div>
                      )}
                      {(aidCount > 0 || purchaseCount > 0 || donationCount > 0) && (
                        <div>
                          <strong>إجمالي الموارد: {formatCurrency(totalResourcesValue)}</strong>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge bg="success" pill>تم الانجاز</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      <ProjectDetailsModal
        show={modalState.showDetails}
        onHide={() => closeModal('Details')}
        project={modalState.selectedProject}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    </Container>
  );
};

export default FinishedProjects;