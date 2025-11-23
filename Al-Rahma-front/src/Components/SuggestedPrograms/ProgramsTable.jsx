import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Spinner, Alert, Accordion, Form, Card, Row, Col } from 'react-bootstrap';
import { 
  FaEdit, FaTrash, FaEye, FaCalendarAlt, FaUsers, 
  FaMoneyBillWave, FaPhone, FaInfoCircle, FaExclamationTriangle,
  FaLayerGroup, FaTasks, FaUserFriends, FaUserTie,
  FaMapMarkerAlt, FaClock, FaCode, FaPencilAlt, FaCommentDollar,
  FaTimes, FaCheck, FaBan, FaFileExcel, FaFilePdf
} from 'react-icons/fa';
import { deleteProgram, getProgramById, refuseProgram, approveProgram } from '../../services/SuggestedProgramsService';
import { toast } from 'react-toastify';
import DetailsModal from './DetailsModal';
import { useAuth } from '../../contexts/AuthContext';
import ExportToExcel from '../ExportToExcel';

const ProgramsTable = ({ programs, onEdit, onDelete }) => {
  const { user } = useAuth();
  const isAdmin = user?.Role === 'Admin' || user?.Role === 'SuperAdmin';
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [programDetails, setProgramDetails] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupAction, setFollowupAction] = useState(null); // 'approve' or 'refuse'
  const [budgetForm, setBudgetForm] = useState({
    newBudget: '',
    commentary: '',
    error: null
  });
  const [refuseForm, setRefuseForm] = useState({
    commentary: '',
    error: null
  });
  const [localPrograms, setLocalPrograms] = useState(programs);

  // Update local programs when props change
  useEffect(() => {
    setLocalPrograms(programs);
  }, [programs]);

  // Format dates in Arabic (Tunisia) locale
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    };
    return new Date(dateString).toLocaleDateString('ar-TN', options);
  };

  // Format numbers with standard formatting (1,234.56)
  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'غير محدد';
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Format currency in Tunisian Dinars (DT)
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'غير محدد';
    return `${formatNumber(value)} د.ت`;
  };

  // Prepare data for export
  const getExportData = () => {
    return localPrograms.map(program => ({
      'اسم المشروع': program.project || '',
      'كود المشروع': program.projectCode || '',
      'اللجنة': program.committee || '',
      'مدير المشروع': program.projectManager || '',
      'هاتف المدير': program.contactPhone || '',
      'المكان': program.place || '',
      'تاريخ البدء': program.startDate ? formatDate(program.startDate) : '',
      'تاريخ الانتهاء': program.completionDate ? formatDate(program.completionDate) : '',
      'المدة': program.period || '',
      'الفئة المستفيدة': program.beneficiaries || '',
      'الفئة المستهدفة': program.targetGroup || '',
      'عدد المستفيدين': program.beneficiariesCount || 0,
      'الميزانية': program.budget || 0,
      'التكلفة الإجمالية': program.totalCost || 0,
      'مصدر التمويل': program.budgetSource || '',
      'حالة التنفيذ': program.implementationStatus || '',
      'حالة التمويل': program.fundingStatus || '',
      'حالة البرنامج': program.status || '',
      'ملاحظات الميزانية': program.budgetCommentary || '',
      'ملاحظات الرفض': program.refusalCommentary || '',
      'تفاصيل المشروع': program.details || '',
      'ملاحظات إضافية': program.notes || '',
      'عدد المراحل': program.phases?.length || 0,
      'عدد الشركاء': program.partners?.length || 0
    }));
  };



  // Fetch program details when modal opens
  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (!selectedProgramId) return;
      
      try {
        setLoadingDetails(true);
        setErrorDetails(null);
        const details = await getProgramById(selectedProgramId);
        setProgramDetails(details);
      } catch (error) {
        console.error('Error fetching program details:', error);
        setErrorDetails('فشل تحميل تفاصيل البرنامج');
        toast.error('فشل تحميل تفاصيل البرنامج');
      } finally {
        setLoadingDetails(false);
      }
    };

    if (showDetailsModal) {
      fetchProgramDetails();
    }
  }, [showDetailsModal, selectedProgramId]);

  const handleViewDetails = (programId) => {
    setSelectedProgramId(programId);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedProgramId(null);
    setProgramDetails(null);
  };

  const handleDeleteClick = (program) => {
    setProgramToDelete(program);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!programToDelete) return;
    
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteProgram(programToDelete.id);
      toast.success('تم حذف البرنامج بنجاح');
      onDelete(programToDelete.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting program:', error);
      setDeleteError('فشل حذف البرنامج. يرجى المحاولة مرة أخرى.');
      toast.error('فشل حذف البرنامج');
    } finally {
      setDeleting(false);
    }
  };

  // Followup modal handlers
  const handleShowFollowupModal = (program, action) => {
    setProgramToDelete(program);
    setFollowupAction(action);
    
    if (action === 'approve') {
      setBudgetForm({
        newBudget: program.budget,
        commentary: '',
        error: null
      });
    } else {
      setRefuseForm({
        commentary: '',
        error: null
      });
    }
    
    setShowFollowupModal(true);
  };

  const handleBudgetChange = (e) => {
    const { name, value } = e.target;
    setBudgetForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRefuseChange = (e) => {
    const { name, value } = e.target;
    setRefuseForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    
    if (!programToDelete) return;
    if (!budgetForm.newBudget || isNaN(budgetForm.newBudget)) {
      setBudgetForm(prev => ({ ...prev, error: 'يرجى إدخال قيمة ميزانية صالحة' }));
      return;
    }

    try {
      setDeleting(true);
      
      // Call the approve API
      await approveProgram(
        programToDelete.id,
        parseFloat(budgetForm.newBudget),
        budgetForm.commentary
      );

      // Update local state
      const updatedPrograms = localPrograms.map(program => {
        if (program.id === programToDelete.id) {
          return {
            ...program,
            budget: parseFloat(budgetForm.newBudget),
            budgetCommentary: budgetForm.commentary,
            implementationStatus: 'approved'  // Updated to use implementationStatus
          };
        }
        return program;
      });

      setLocalPrograms(updatedPrograms);
      toast.success('تمت المصادقة على البرنامج بنجاح وتم نقله إلى المشاريع الجارية');
      setShowFollowupModal(false);
    } catch (error) {
      console.error('Error approving program:', error);
      setBudgetForm(prev => ({ ...prev, error: error.message }));
      toast.error('فشل في مصادقة البرنامج');
    } finally {
      setDeleting(false);
    }
  };

  const handleRefuseSubmit = async (e) => {
      e.preventDefault();
      
      if (!programToDelete) return;
      if (!refuseForm.commentary) {
        setRefuseForm(prev => ({ ...prev, error: 'يرجى إدخال سبب الرفض' }));
        return;
      }

      try {
        setDeleting(true);
        await refuseProgram(programToDelete.id, refuseForm.commentary);
        
        // Update local state
        const updatedPrograms = localPrograms.map(program => {
          if (program.id === programToDelete.id) {
            return {
              ...program,
              status: 'refused',
              refusalCommentary: refuseForm.commentary,
              implementationStatus: 'refused'
            };
          }
          return program;
        });

        setLocalPrograms(updatedPrograms);
        toast.success('تم رفض البرنامج بنجاح');
        setShowFollowupModal(false);
      } catch (error) {
        console.error('Error refusing program:', error);
        setRefuseForm(prev => ({ ...prev, error: error.message }));
        toast.error('فشل في رفض البرنامج');
      } finally {
        setDeleting(false);
      }
    };

  const renderStatusBadge = (status) => {
    const variants = {
      'pending': { bg: 'secondary', icon: <FaClock className="me-1" /> },
      'planned': { bg: 'secondary', icon: <FaCalendarAlt className="me-1" /> },
      'in_progress': { bg: 'primary', icon: <FaTasks className="me-1" /> },
      'completed': { bg: 'success', icon: <FaCheck className="me-1" /> },
      'on_hold': { bg: 'warning', icon: <FaBan className="me-1" /> },
      'cancelled': { bg: 'danger', icon: <FaTimes className="me-1" /> },
      'fully_funded': { bg: 'success', icon: <FaMoneyBillWave className="me-1" /> },
      'partially_funded': { bg: 'warning', icon: <FaMoneyBillWave className="me-1" /> },
      'pending_funding': { bg: 'info', icon: <FaClock className="me-1" /> },
      'not_funded': { bg: 'danger', icon: <FaMoneyBillWave className="me-1" /> },
      'approved': { bg: 'success', icon: <FaCheck className="me-1" /> },
      'rejected': { bg: 'danger', icon: <FaTimes className="me-1" /> }
    };
    
    const arabicStatus = {
      'pending': 'قيد الانتظار',
      'planned': 'قيد التخطيط',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'on_hold': 'متوقف',
      'cancelled': 'ملغى',
      'fully_funded': 'تم التمويل بالكامل',
      'partially_funded': 'تمويل جزئي',
      'pending_funding': 'في انتظار التمويل',
      'not_funded': 'غير ممول',
      'approved': 'مصادق عليه',
      'rejected': 'مرفوض'  // This is "rejected" in Arabic
    }
    
    const statusConfig = variants[status] || { bg: 'secondary', icon: null };
    const displayStatus = arabicStatus[status] || status;
    
    return (
      <Badge bg={statusConfig.bg} className="d-flex align-items-center">
        {statusConfig.icon}
        {displayStatus}
      </Badge>
    );
  };

  // Enhanced phase rendering with cards
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
      <div className="row g-3">
        {phases.map((phase, index) => (
          <div className="col-md-6" key={index}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                <div className="d-flex align-items-center">
                  <FaLayerGroup className="me-2 text-primary" />
                  <strong>{phase.title || `المرحلة ${index + 1}`}</strong>
                </div>
                <Badge bg="info" className="fs-6">
                  {formatCurrency(phase.budget)}
                </Badge>
              </Card.Header>
              <Card.Body>
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
                      <FaPencilAlt className="me-2" />
                      <small>الوصف</small>
                    </div>
                    <p className="mb-0">{phase.description}</p>
                  </div>
                )}
                
                {renderTasks(phase.tasks)}
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    );
  };

  // Enhanced task rendering (simplified - no member assignment)
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
                      {renderStatusBadge(task.status)}
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

  return (
    <div className="programs-table-container">
      {/* Export buttons row */}
      <Row className="mb-3">
        <Col className="d-flex justify-content-end gap-2">
          <ExportToExcel 
            data={getExportData()} 
            filename="البرامج المقترحة"
            buttonText="Excel تصدير"
            buttonProps={{ 
              size: "sm", 
              variant: "outline-success",
              className: "d-flex align-items-center"
            }}
          />
        </Col>
      </Row>
      
      <div className="table-responsive rounded shadow-sm">
        <Table striped bordered hover className="mb-0">
          <thead className="table-light">
            <tr>
              <th width="5%">#</th>
              <th width="20%">اسم المشروع</th>
              <th width="15%"><FaCalendarAlt className="me-2" /> التواريخ</th>
              <th width="15%"><FaUsers className="me-2" /> المستفيدون</th>
              <th width="15%"><FaMoneyBillWave className="me-2" /> المالية</th>
              <th width="15%">الحالة</th>
              <th width="15%">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {localPrograms.map((program, index) => (
              <React.Fragment key={program.id}>
                <tr>
                  <td className="text-center">{index + 1}</td>
                  <td>
                    <div className="fw-semibold">{program.project}</div>
                    {program.projectCode && (
                      <div className="text-muted small">
                        <FaCode className="me-1" size={12} />
                        {program.projectCode}
                      </div>
                    )}
                    {program.committee && (
                      <div className="text-muted small">
                        <FaUserFriends className="me-1" size={12} />
                        {program.committee}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="d-flex flex-column small">
                      <span>
                        <FaCalendarAlt className="me-1" size={12} />
                        البدء: {formatDate(program.startDate)}
                      </span>
                      <span>
                        <FaCalendarAlt className="me-1" size={12} />
                        الانتهاء: {formatDate(program.completionDate)}
                      </span>
                      {program.period && (
                        <span>
                          <FaClock className="me-1" size={12} />
                          المدة: {program.period}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column small">
                      <span>
                        <FaUsers className="me-1" size={12} />
                        الفئة: {program.beneficiaries || 'غير محدد'}
                      </span>
                      <span>
                        <FaUsers className="me-1" size={12} />
                        العدد: {formatNumber(program.beneficiariesCount)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column small">
                      <span>
                        <FaMoneyBillWave className="me-1" size={12} />
                        الميزانية: {formatCurrency(program.budget)}
                      </span>
                      {program.budgetCommentary && (
                        <span className="text-muted">
                          ملاحظة: {program.budgetCommentary}
                        </span>
                      )}
                      <span>
                        <FaMoneyBillWave className="me-1" size={12} />
                        المصدر: {program.budgetSource || 'غير محدد'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-2">
                      {program.implementationStatus && (
                        <div className="d-flex align-items-center">
                          {renderStatusBadge(program.implementationStatus)}
                        </div>
                      )}
                      {program.fundingStatus && (
                        <div className="d-flex align-items-center">
                          {renderStatusBadge(program.fundingStatus)}
                        </div>
                      )}
                      {program.status && (
                        <div className="d-flex align-items-center">
                          {renderStatusBadge(program.status)}
                        </div>
                      )}
                    </div>
                  </td>
                    <td>
                      <div className="d-flex flex-column gap-2">
                        <Button 
                          variant="outline-info" 
                          size="sm" 
                          onClick={() => handleViewDetails(program.id)}
                          className="d-flex align-items-center justify-content-center"
                        >
                          <FaEye className="me-1" /> التفاصيل
                        </Button>
                        
                        {isAdmin && (
                          <>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => onEdit(program)}
                              className="d-flex align-items-center justify-content-center"
                            >
                              <FaEdit className="me-1" /> تعديل
                            </Button>
                            <div className="d-flex gap-2">
                              <Button 
                                variant="outline-success" 
                                size="sm" 
                                onClick={() => handleShowFollowupModal(program, 'approve')}
                                className="d-flex align-items-center justify-content-center flex-grow-1"
                              >
                                <FaCheck className="me-1" /> متابعة
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => handleShowFollowupModal(program, 'refuse')}
                                className="d-flex align-items-center justify-content-center flex-grow-1"
                              >
                                <FaTimes className="me-1" /> رفض
                              </Button>
                            </div>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDeleteClick(program)}
                              disabled={deleting}
                              className="d-flex align-items-center justify-content-center"
                            >
                              {deleting && programToDelete?.id === program.id ? (
                                <>
                                  <Spinner as="span" size="sm" animation="border" className="me-1" />
                                  جاري الحذف...
                                </>
                              ) : (
                                <>
                                  <FaTrash className="me-1" /> حذف
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                </tr>
                {program.phases?.length > 0 && (
                  <tr>
                    <td colSpan="7" className="p-3 bg-light">
                      <div className="px-2">
                        <h6 className="d-flex align-items-center mb-3">
                          <FaLayerGroup className="me-2 text-primary" />
                          مراحل المشروع ({program.phases.length})
                        </h6>
                        {renderPhases(program.phases)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Program Details Modal */}
        <DetailsModal
          show={showDetailsModal}
          onHide={handleCloseDetails}
          programDetails={programDetails}
          loadingDetails={loadingDetails}
          errorDetails={errorDetails}
          renderStatusBadge={renderStatusBadge}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
          renderPhases={renderPhases}
        />
        
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>تأكيد الحذف</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {deleteError ? (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaExclamationTriangle className="me-2 flex-shrink-0" />
              {deleteError}
            </Alert>
          ) : (
            <div className="text-center">
              <FaExclamationTriangle size={48} className="text-danger mb-3" />
              <h5>هل أنت متأكد من حذف البرنامج؟</h5>
              <p className="mb-0">"{programToDelete?.project}"</p>
              <p className="text-muted mt-2">هذا الإجراء لا يمكن التراجع عنه.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowDeleteConfirm(false)}>
            إلغاء
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete} 
            disabled={deleting}
            className="d-flex align-items-center justify-content-center"
          >
            {deleting ? (
              <>
                <Spinner as="span" size="sm" animation="border" className="me-2" />
                جاري الحذف...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                حذف
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Followup Modal */}
      <Modal show={showFollowupModal} onHide={() => setShowFollowupModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="d-flex align-items-center">
            {followupAction === 'approve' ? (
              <>
                <FaCheck className="me-2 text-success" />
                <span>مصادقة على البرنامج</span>
              </>
            ) : (
              <>
                <FaTimes className="me-2 text-danger" />
                <span>رفض البرنامج</span>
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={followupAction === 'approve' ? handleBudgetSubmit : handleRefuseSubmit}>
          <Modal.Body className="py-3">
            {followupAction === 'approve' ? (
              <>
                {budgetForm.error && (
                  <Alert variant="danger" className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-2 flex-shrink-0" />
                    {budgetForm.error}
                  </Alert>
                )}
                
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center text-muted">
                    <FaMoneyBillWave className="me-2" />
                    الميزانية الحالية
                  </Form.Label>
                  <Form.Control 
                    type="text" 
                    value={formatCurrency(programToDelete?.budget || 0)} 
                    readOnly 
                    className="fw-bold"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <FaMoneyBillWave className="me-2 text-primary" />
                    الميزانية الجديدة *
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="newBudget"
                    value={budgetForm.newBudget}
                    onChange={handleBudgetChange}
                    min="0"
                    step="0.01"
                    required
                    className="border-primary"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center text-muted">
                    <FaPencilAlt className="me-2" />
                    التعليق (اختياري)
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="commentary"
                    value={budgetForm.commentary}
                    onChange={handleBudgetChange}
                    placeholder="أدخل سبب التعديل..."
                  />
                </Form.Group>
              </>
            ) : (
              <>
                  {refuseForm.error && (
                    <Alert variant="danger" className="d-flex align-items-center">
                      <FaExclamationTriangle className="me-2 flex-shrink-0" />
                      {refuseForm.error}
                    </Alert>
                  )}
                  
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center text-danger">
                      <FaTimes className="me-2" />
                      سبب الرفض *
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="commentary"
                      value={refuseForm.commentary}
                      onChange={handleRefuseChange}
                      placeholder="أدخل سبب رفض البرنامج..."
                      required
                      className="border-danger"
                    />
                  </Form.Group>
                  
                  {programToDelete?.status === 'refused' && (
                    <Alert variant="warning" className="mt-3">
                      <FaExclamationTriangle className="me-2" />
                      هذا البرنامج مرفوض مسبقاً
                    </Alert>
                  )}
                </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="outline-secondary" onClick={() => setShowFollowupModal(false)}>
              إلغاء
            </Button>
            <Button 
              variant={followupAction === 'approve' ? 'success' : 'danger'} 
              type="submit"
              className="d-flex align-items-center"
            >
              {followupAction === 'approve' ? (
                <>
                  <FaCheck className="me-2" />
                  مصادقة
                </>
              ) : (
                <>
                  <FaTimes className="me-2" />
                  رفض
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ProgramsTable;