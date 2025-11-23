import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Badge, Alert, Spinner,
  Container, Row, Col, Stack,
  Accordion, Card
} from 'react-bootstrap';
import { 
  FaEye, FaCheckCircle, FaTasks, FaShoppingCart, FaHandHoldingHeart,
  FaFilter, FaSync, FaExclamationTriangle, FaMoneyBillWave, FaPlus,
  FaLayerGroup, FaHandshake, FaCalendarAlt, FaPhone, FaEnvelope
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import ongoingProjectsService from '../../services/ongoingProjectsService';
import ProjectDetailsModal from './ProjectDetailsModal';
import CompleteProjectModal from './CompleteProjectModal';
import ProjectFilters from './ProjectFilters';
import AidProjectForm from './AidProjectForm';
import PurchaseProjectForm from './PurchaseProjectForm';
import DonationProjectForm from './DonationProjectForm';
import './OngoingProjects.css';

const OngoingProjects = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    committee: '',
    year: '',
    search: '',
    implementationStatus: '',
    fundingStatus: '',
    minBudget: '',
    maxBudget: '',
    startDate: '',
    endDate: '',
    minBeneficiaries: '',
    maxBeneficiaries: ''
  });

  const [modalState, setModalState] = useState({
    showDetails: false,
    showComplete: false,
    showAidForm: false,
    showPurchaseForm: false,
    showDonationForm: false,
    selectedProject: null
  });

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

  // Fetch all projects
  const { 
    data: allProjects = [], 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery(
    'ongoingProjects',
    () => ongoingProjectsService.getOngoingProjects(),
    {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      onError: (err) => {
        console.error('Failed to fetch projects:', err);
        toast.error('فشل في تحميل المشاريع');
      }
    }
  );

  // Apply filters locally for better performance
  const filteredProjects = allProjects.filter(project => {
    // Committee filter
    if (filters.committee && project.committee !== filters.committee) {
      return false;
    }

    // Year filter
    if (filters.year && project.year != filters.year) {
      return false;
    }

    // Implementation status filter
    if (filters.implementationStatus && project.implementationStatus !== filters.implementationStatus) {
      return false;
    }

    // Funding status filter
    if (filters.fundingStatus && project.fundingStatus !== filters.fundingStatus) {
      return false;
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

    // Date range filter
    if (filters.startDate && project.startDate) {
      const projectStartDate = new Date(project.startDate);
      const filterStartDate = new Date(filters.startDate);
      if (projectStartDate < filterStartDate) return false;
    }
    if (filters.endDate && project.startDate) {
      const projectStartDate = new Date(project.startDate);
      const filterEndDate = new Date(filters.endDate);
      if (projectStartDate > filterEndDate) return false;
    }

    // Beneficiaries count filter
    const beneficiariesCount = parseInt(project.beneficiariesCount) || 0;
    if (filters.minBeneficiaries && beneficiariesCount < parseInt(filters.minBeneficiaries)) {
      return false;
    }
    if (filters.maxBeneficiaries && beneficiariesCount > parseInt(filters.maxBeneficiaries)) {
      return false;
    }

    return true;
  });

  // Mutations for various actions
  const completeProjectMutation = useMutation(
    ongoingProjectsService.completeProject,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ongoingProjects');
        toast.success('تم تحديث حالة المشروع إلى "تم الانجاز" بنجاح');
      },
      onError: (error) => {
        toast.error('فشل في تحديث حالة المشروع');
        console.error('Error completing project:', error);
      }
    }
  );

  // Modal handlers
  const openAidForm = (project) => {
    setModalState(prev => ({
      ...prev,
      showAidForm: true,
      selectedProject: project
    }));
  };

  const openPurchaseForm = (project) => {
    setModalState(prev => ({
      ...prev,
      showPurchaseForm: true,
      selectedProject: project
    }));
  };

  const openDonationForm = (project) => {
    setModalState(prev => ({
      ...prev,
      showDonationForm: true,
      selectedProject: project
    }));
  };

  const openModal = (modalName, project) => {
    setModalState(prev => ({
      ...prev,
      [`show${modalName}`]: true,
      selectedProject: project
    }));
  };

  const closeModal = (modalName) => {
    setModalState(prev => ({
      ...prev,
      [`show${modalName}`]: false,
      selectedProject: null
    }));
  };

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
      implementationStatus: '',
      fundingStatus: '',
      minBudget: '',
      maxBudget: '',
      startDate: '',
      endDate: '',
      minBeneficiaries: '',
      maxBeneficiaries: ''
    });
  };

  // Format currency in Tunisian Dinars (DT)
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return 'غير محدد';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'غير محدد';
    return new Intl.NumberFormat('ar-TN').format(numValue) + ' د.ت';
  };

  // Format dates in Arabic
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'غير محدد';
      
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('ar-TN', options);
    } catch (error) {
      return 'غير محدد';
    }
  };

  // Handle project completion
  const handleCompleteProject = (projectId) => {
    completeProjectMutation.mutate(projectId);
  };

  // Helper function to render phases
  const renderPhases = (phases) => {
    if (!phases || phases.length === 0) {
      return (
        <div className="text-center py-3 text-muted">
          <FaLayerGroup size={24} className="mb-2" />
          <p>لا توجد مراحل مضافة</p>
        </div>
      );
    }

    return (
      <Accordion>
        {phases.map((phase, index) => (
          <Accordion.Item eventKey={index.toString()} key={index}>
            <Accordion.Header>
              <div className="d-flex justify-content-between w-100 pe-3">
                <span>
                  <FaLayerGroup className="me-2 text-primary" />
                  {phase.title || `المرحلة ${index + 1}`}
                </span>
                <Badge bg="info" className="ms-2">
                  {formatCurrency(phase.budget)}
                </Badge>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              <div className="mb-3">
                <div className="d-flex align-items-center text-muted mb-1">
                  <FaCalendarAlt className="me-2" />
                  <small>الفترة الزمنية</small>
                </div>
                <div>
                  {formatDate(phase.startDate)} إلى {formatDate(phase.endDate)}
                </div>
              </div>
              
              {phase.description && (
                <div className="mb-3">
                  <div className="d-flex align-items-center text-muted mb-1">
                    <FaCalendarAlt className="me-2" />
                    <small>الوصف</small>
                  </div>
                  <p className="mb-0">{phase.description}</p>
                </div>
              )}
              
              {renderTasks(phase.tasks)}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  };

  // Helper function to render tasks
  const renderTasks = (tasks) => {
    if (!tasks || tasks.length === 0) {
      return (
        <div className="text-center py-2 text-muted">
          <FaTasks className="me-2" />
          لا توجد مهام مضافة
        </div>
      );
    }

    return (
      <div className="mt-3">
        <h6 className="d-flex align-items-center mb-3">
          <FaTasks className="me-2 text-secondary" />
          المهام ({tasks.length})
        </h6>
        <div className="row g-2">
          {tasks.map((task, index) => (
            <div className="col-12" key={index}>
              <Card className="border-0 bg-light">
                <Card.Body className="py-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="fw-semibold">
                        {index + 1}. {task.title || 'مهمة بدون عنوان'}
                      </div>
                      {task.description && (
                        <div className="text-muted small mt-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                    <div className="ms-2">
                      <Badge bg={task.status === 'completed' ? 'success' : 'secondary'} pill>
                        {task.status === 'completed' ? 'مكتمل' : 'قيد العمل'}
                      </Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to render partners
  const renderPartners = (partners) => {
    if (!partners || partners.length === 0) {
      return (
        <div className="text-center py-3 text-muted">
          <FaHandshake size={24} className="mb-2" />
          <p>لا توجد شركاء مضافة</p>
        </div>
      );
    }

    return (
      <div className="row g-3">
        {partners.map((partner, index) => (
          <div className="col-md-6" key={index}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="fw-semibold">{partner.name}</div>
                  {partner.type && (
                    <Badge bg="secondary" className="ms-2">
                      {partner.type === 'Financial' ? 'مالي' :
                       partner.type === 'Technical' ? 'فني' :
                       partner.type === 'Media' ? 'إعلامي' : 'أخرى'}
                    </Badge>
                  )}
                </div>
                
                {partner.contactPerson && (
                  <div className="mb-2">
                    <small className="text-muted">المسؤول:</small>
                    <div>{partner.contactPerson}</div>
                  </div>
                )}
                
                {(partner.contactPhone || partner.contactEmail) && (
                  <div className="mb-2">
                    <small className="text-muted">بيانات التواصل:</small>
                    <div className="small">
                      {partner.contactPhone && (
                        <div className="d-flex align-items-center">
                          <FaPhone className="me-1" size={12} />
                          {partner.contactPhone}
                        </div>
                      )}
                      {partner.contactEmail && (
                        <div className="d-flex align-items-center">
                          <FaEnvelope className="me-1" size={12} />
                          {partner.contactEmail}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {(partner.contributionType || partner.contributionAmount) && (
                  <div>
                    <small className="text-muted">المساهمة:</small>
                    <div className="small">
                      {partner.contributionType && (
                        <div>
                          نوع المساهمة: {
                            partner.contributionType === 'Cash' ? 'نقدي' :
                            partner.contributionType === 'In-kind' ? 'عيني' : 'خدمات'
                          }
                        </div>
                      )}
                      {partner.contributionAmount > 0 && (
                        <div className="fw-semibold">
                          {formatCurrency(partner.contributionAmount)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">جاري تحميل المشاريع...</span>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        <Alert variant="danger" className="mt-4">
          <FaExclamationTriangle className="me-2" />
          {error?.message || 'حدث خطأ أثناء جلب بيانات المشاريع'}
          <Button variant="link" onClick={refetch} className="p-0 ms-2">
            <FaSync /> حاول مرة أخرى
          </Button>
        </Alert>
      </Container>
    );
  }

  const hasActiveFilters = Object.values(filters).some(filter => 
    filter !== '' && filter !== null && filter !== undefined
  );

  return (
    <Container fluid className="ongoing-projects-container py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-2 d-flex align-items-center">
            <FaTasks className="me-2 text-primary" />
            المشاريع الجارية
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
            <ProjectFilters 
              filters={filters}
              onApply={applyFilters}
              onReset={resetFilters}
              committees={committees}
              years={years}
              loading={isLoading}
            />
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

      {filteredProjects.length === 0 ? (
        <Alert variant="info" className="text-center">
          {allProjects.length === 0 
            ? 'لا توجد مشاريع جارية' 
            : 'لا توجد مشاريع تطابق معايير البحث الخاصة بك'
          }
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover className="align-middle">
            <thead className="table-dark">
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '20%' }}>اسم المشروع</th>
                <th style={{ width: '12%' }}>اللجنة</th>
                <th style={{ width: '12%' }}>المدير</th>
                <th style={{ width: '15%' }}>الفترة</th>
                <th style={{ width: '15%' }}>الميزانية</th>
                <th style={{ width: '8%' }}>الحالة</th>
                <th style={{ width: '13%' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => {
                const isCompleted = project.implementationStatus === 'completed';
                
                return (
                  <React.Fragment key={project.id}>
                    <tr>
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
                            <FaPhone className="me-1" size={10} />
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
                            {project.fundingStatus && (
                              <Badge 
                                bg={
                                  project.fundingStatus === 'fully_funded' ? 'success' :
                                  project.fundingStatus === 'partially_funded' ? 'warning' :
                                  project.fundingStatus === 'not_funded' ? 'danger' : 'secondary'
                                }
                                className="fs-12 mt-1"
                              >
                                {project.fundingStatus === 'fully_funded' ? 'ممول بالكامل' :
                                 project.fundingStatus === 'partially_funded' ? 'تمويل جزئي' :
                                 project.fundingStatus === 'not_funded' ? 'غير ممول' : 'في انتظار التمويل'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge 
                          bg={
                            isCompleted ? 'success' : 
                            project.implementationStatus === 'in_progress' ? 'primary' : 
                            project.implementationStatus === 'on_hold' ? 'warning' : 'secondary'
                          }
                          pill
                          className="fs-12"
                        >
                          {isCompleted ? 'تم الانجاز' : 
                           project.implementationStatus === 'in_progress' ? 'قيد التنفيذ' :
                           project.implementationStatus === 'on_hold' ? 'متوقف' : 'غير محدد'}
                        </Badge>
                      </td>
                      <td>
                        <Stack gap={1}>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => openModal('Details', project)}
                            className="d-flex align-items-center justify-content-center"
                          >
                            <FaEye className="me-1" /> التفاصيل
                          </Button>
                          
                          {!isCompleted && (
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => openModal('Complete', project)}
                              className="d-flex align-items-center justify-content-center"
                              disabled={completeProjectMutation.isLoading}
                            >
                              <FaCheckCircle className="me-1" /> تم الانجاز
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => openAidForm(project)}
                            className="d-flex align-items-center justify-content-center"
                          >
                            <FaPlus className="me-1" /> إضافة مساعدة
                          </Button>
                          
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => openPurchaseForm(project)}
                            className="d-flex align-items-center justify-content-center"
                          >
                            <FaShoppingCart className="me-1" /> إضافة شراء
                          </Button>
                          
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => openDonationForm(project)}
                            className="d-flex align-items-center justify-content-center"
                          >
                            <FaHandHoldingHeart className="me-1" /> إضافة تبرع
                          </Button>
                        </Stack>
                      </td>
                    </tr>
                    
                    {/* Expandable row for phases and partners */}
                    {(project.phases?.length > 0 || project.partners?.length > 0) && (
                      <tr>
                        <td colSpan="8" className="p-0 border-top-0">
                          <Accordion>
                            <Accordion.Item eventKey="0">
                              <Accordion.Header className="bg-light">
                                <div className="d-flex align-items-center">
                                  {project.phases?.length > 0 && (
                                    <span className="me-3">
                                      <FaLayerGroup className="me-1" />
                                      المراحل: {project.phases.length}
                                    </span>
                                  )}
                                  {project.partners?.length > 0 && (
                                    <span>
                                      <FaHandshake className="me-1" />
                                      الشركاء: {project.partners.length}
                                    </span>
                                  )}
                                </div>
                              </Accordion.Header>
                              <Accordion.Body>
                                <Row>
                                  {project.phases?.length > 0 && (
                                    <Col md={6}>
                                      <h6 className="mb-3">
                                        <FaLayerGroup className="me-2 text-primary" />
                                        مراحل المشروع
                                      </h6>
                                      {renderPhases(project.phases)}
                                    </Col>
                                  )}
                                  
                                  {project.partners?.length > 0 && (
                                    <Col md={6}>
                                      <h6 className="mb-3">
                                        <FaHandshake className="me-2 text-primary" />
                                        الشركاء
                                      </h6>
                                      {renderPartners(project.partners)}
                                    </Col>
                                  )}
                                </Row>
                              </Accordion.Body>
                            </Accordion.Item>
                          </Accordion>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modals */}
      <ProjectDetailsModal
        show={modalState.showDetails}
        onHide={() => closeModal('Details')}
        project={modalState.selectedProject}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      <CompleteProjectModal
        show={modalState.showComplete}
        onHide={() => closeModal('Complete')}
        project={modalState.selectedProject}
        onConfirm={handleCompleteProject}
        isLoading={completeProjectMutation.isLoading}
      />

      <AidProjectForm
        show={modalState.showAidForm}
        onHide={() => setModalState(prev => ({ ...prev, showAidForm: false }))}
        project={modalState.selectedProject}
        onSubmit={() => {
          queryClient.invalidateQueries('ongoingProjects');
          toast.success('تمت إضافة المساعدة بنجاح');
        }}
      />

      <PurchaseProjectForm
        show={modalState.showPurchaseForm}
        onHide={() => setModalState(prev => ({ ...prev, showPurchaseForm: false }))}
        project={modalState.selectedProject}
        onSubmit={() => {
          queryClient.invalidateQueries('ongoingProjects');
          toast.success('تمت إضافة الشراء بنجاح');
        }}
      />

      <DonationProjectForm
        show={modalState.showDonationForm}
        onHide={() => setModalState(prev => ({ ...prev, showDonationForm: false }))}
        project={modalState.selectedProject}
        onSubmit={() => {
          queryClient.invalidateQueries('ongoingProjects');
          toast.success('تمت إضافة التبرع بنجاح');
        }}
      />
    </Container>
  );
};

export default OngoingProjects;