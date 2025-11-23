import React from 'react';
import { Modal, Card, Alert, Badge, Spinner, Button, Accordion } from 'react-bootstrap';
import { 
  FaInfoCircle, FaExclamationTriangle, FaUserTie, FaPhone, 
  FaMapMarkerAlt, FaCalendarAlt, FaClock, FaUsers, 
  FaMoneyBillWave, FaLayerGroup, FaCode, FaUserFriends,
  FaTasks, FaHandshake
} from 'react-icons/fa';

const DetailsModal = ({ 
  show, 
  onHide, 
  programDetails, 
  loadingDetails, 
  errorDetails,
  renderStatusBadge,
  formatDate,
  formatCurrency,
  formatNumber,
}) => {
  // Helper function to render phases with their tasks
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
      <Accordion defaultActiveKey="0" alwaysOpen>
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
                    <FaInfoCircle className="me-2" />
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

  // Helper function to render tasks (simplified - no member assignment)
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
                          <span className="me-1">@</span>
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

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="d-flex align-items-center">
          <FaInfoCircle className="me-2 text-primary" />
          <h5 className="mb-0">
            {programDetails ? `تفاصيل البرنامج: ${programDetails.project}` : 'تفاصيل البرنامج'}
          </h5>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {loadingDetails ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">جاري تحميل التفاصيل...</p>
          </div>
        ) : errorDetails ? (
          <Alert variant="danger" className="d-flex align-items-center">
            <FaExclamationTriangle className="me-2 flex-shrink-0" />
            {errorDetails}
          </Alert>
        ) : programDetails ? (
          <div className="row g-4">
            {/* Basic Information */}
            <div className="col-md-6">
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 d-flex align-items-center">
                    <FaUserTie className="me-2 text-primary" />
                    المعلومات الأساسية
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaCode className="me-2" />
                      <small>اللجنة</small>
                    </div>
                    <p>{programDetails.committee || 'غير محدد'}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaUserTie className="me-2" />
                      <small>المسؤول</small>
                    </div>
                    <p>{programDetails.projectManager || 'غير محدد'}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaPhone className="me-2" />
                      <small>هاتف التواصل</small>
                    </div>
                    <p>{programDetails.contactPhone || 'غير محدد'}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaMapMarkerAlt className="me-2" />
                      <small>المكان</small>
                    </div>
                    <p>{programDetails.place || 'غير محدد'}</p>
                  </div>
                </Card.Body>
              </Card>
            </div>
            
            {/* Timeline */}
            <div className="col-md-6">
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 d-flex align-items-center">
                    <FaCalendarAlt className="me-2 text-primary" />
                    الجدول الزمني
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaCalendarAlt className="me-2" />
                      <small>تاريخ البدء</small>
                    </div>
                    <p>{formatDate(programDetails.startDate)}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaCalendarAlt className="me-2" />
                      <small>تاريخ الانتهاء</small>
                    </div>
                    <p>{formatDate(programDetails.completionDate)}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaClock className="me-2" />
                      <small>المدة</small>
                    </div>
                    <p>{programDetails.period || 'غير محدد'}</p>
                  </div>
                </Card.Body>
              </Card>
            </div>
            
            {/* Beneficiaries */}
            <div className="col-md-6">
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 d-flex align-items-center">
                    <FaUsers className="me-2 text-primary" />
                    المستفيدون
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaUsers className="me-2" />
                      <small>الفئة المستفيدة</small>
                    </div>
                    <p>{programDetails.beneficiaries || 'غير محدد'}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaUsers className="me-2" />
                      <small>الفئة المستهدفة</small>
                    </div>
                    <p>{programDetails.targetGroup || 'غير محدد'}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaUsers className="me-2" />
                      <small>عدد المستفيدين</small>
                    </div>
                    <p>{formatNumber(programDetails.beneficiariesCount)}</p>
                  </div>
                </Card.Body>
              </Card>
            </div>
            
            {/* Financial Information */}
            <div className="col-md-6">
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 d-flex align-items-center">
                    <FaMoneyBillWave className="me-2 text-primary" />
                    المعلومات المالية
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaMoneyBillWave className="me-2" />
                      <small>الميزانية</small>
                    </div>
                    <p>{formatCurrency(programDetails.budget)}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaMoneyBillWave className="me-2" />
                      <small>التكلفة الإجمالية</small>
                    </div>
                    <p>{formatCurrency(programDetails.totalCost)}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaMoneyBillWave className="me-2" />
                      <small>مصدر التمويل</small>
                    </div>
                    <p>{programDetails.budgetSource || 'غير محدد'}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FaMoneyBillWave className="me-2" />
                      <small>حالة التمويل</small>
                    </div>
                    <div>{renderStatusBadge(programDetails.fundingStatus)}</div>
                  </div>
                </Card.Body>
              </Card>
            </div>
            
            {/* Project Details */}
            {programDetails.details && (
              <div className="col-12">
                <Card className="shadow-sm">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">تفاصيل المشروع</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="p-3 bg-light rounded">
                      {programDetails.details}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            )}
            
            {/* Notes */}
            {programDetails.notes && (
              <div className="col-12">
                <Card className="shadow-sm">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">ملاحظات إضافية</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="p-3 bg-light rounded">
                      {programDetails.notes}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            )}
            
            {/* Phases */}
            <div className="col-12">
              <Card className="shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 d-flex align-items-center">
                    <FaLayerGroup className="me-2 text-primary" />
                    مراحل المشروع ({programDetails.phases?.length || 0})
                  </h6>
                </Card.Header>
                <Card.Body>
                  {renderPhases(programDetails.phases)}
                </Card.Body>
              </Card>
            </div>
            
            {/* Partners */}
            {programDetails.partners?.length > 0 && (
              <div className="col-12">
                <Card className="shadow-sm">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0 d-flex align-items-center">
                      <FaHandshake className="me-2 text-primary" />
                      الشركاء ({programDetails.partners?.length || 0})
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    {renderPartners(programDetails.partners)}
                  </Card.Body>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <Alert variant="warning" className="d-flex align-items-center">
            <FaExclamationTriangle className="me-2 flex-shrink-0" />
            لا توجد بيانات للعرض
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          إغلاق
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DetailsModal;