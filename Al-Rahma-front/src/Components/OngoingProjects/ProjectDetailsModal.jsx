import React, { useState, useEffect } from 'react';
import { 
  Modal, ListGroup, Row, Col, Badge, Accordion, Tabs, Tab,
  Card, Alert, Spinner
} from 'react-bootstrap';
import { 
  FaInfoCircle, FaUsers, FaMoneyBillWave, FaCalendarAlt, FaBox, 
  FaShoppingCart, FaHandHoldingHeart, FaLayerGroup, FaTasks,
  FaHandshake, FaPhone, FaExclamationTriangle
} from 'react-icons/fa';
import { getAidsByProject } from '../../services/aidService';
import { getSuppliesByProject } from '../../services/suppliesService';
import './ProjectDetailsModal.css';

const ProjectDetailsModal = ({ show, onHide, project, formatCurrency, formatDate }) => {
  // Add safety check at the beginning
  if (!project) {
    return (
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>خطأ في البيانات</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          <FaExclamationTriangle size={48} className="text-danger mb-3" />
          <p>لا توجد بيانات للمشروع</p>
        </Modal.Body>
      </Modal>
    );
  }
  
  const [projectAids, setProjectAids] = useState([]);
  const [allSupplies, setAllSupplies] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Safe value getter function
  const getProjectValue = (property, defaultValue = 'غير محدد') => {
    if (project[property] === null || project[property] === undefined || project[property] === '') {
      return defaultValue;
    }
    return project[property];
  };

  useEffect(() => {
    if (project?.id) {
      const fetchProjectData = async () => {
        try {
          setLoading(true);
          setError(null);
          const [aids, supplies] = await Promise.all([
            getAidsByProject(project.id),
            getSuppliesByProject(project.id)
          ]);
          setProjectAids(aids || []);
          setAllSupplies(supplies || []);
        } catch (error) {
          console.error('Error fetching project data:', error);
          setError('فشل في تحميل البيانات المساعدة');
        } finally {
          setLoading(false);
        }
      };
      fetchProjectData();
    }
  }, [project]);

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
                  {formatCurrency(phase.budget || 0)}
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

  // Filter supplies on the frontend
  const projectPurchases = allSupplies.filter(supply => supply.suppliesNature === 'Purchase');
  const projectDonations = allSupplies.filter(supply => supply.suppliesNature === 'Donation');

  // Calculate totals safely
  const totalAidValue = projectAids.reduce((total, aid) => total + (aid.monetaryValue || 0), 0);
  const totalPurchaseValue = projectPurchases.reduce((total, purchase) => total + (purchase.monetaryValue || 0), 0);
  const totalDonationValue = projectDonations.reduce((total, donation) => total + (donation.monetaryValue || 0), 0);
  const totalSuppliesValue = totalPurchaseValue + totalDonationValue;
  const grandTotal = totalAidValue + totalSuppliesValue;

  if (loading) {
    return (
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>تحميل البيانات...</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">جاري تحميل بيانات المشروع</p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable className="project-details-modal">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <FaInfoCircle className="me-2 text-primary" />
          تفاصيل المشروع: {getProjectValue('project')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="warning" className="mb-3">
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}
        
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
          <Tab eventKey="details" title={
            <span><FaInfoCircle className="me-1" /> المعلومات الأساسية</span>
          }>
            <Row>
              <Col md={6}>
                <h5 className="mb-3 d-flex align-items-center">
                  <FaInfoCircle className="me-2 text-secondary" />
                  المعلومات الأساسية
                </h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>كود المشروع:</strong> {getProjectValue('projectCode')}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>اللجنة:</strong> {getProjectValue('committee')}
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center">
                    <FaCalendarAlt className="me-2 text-secondary" />
                    <div>
                      <strong>الفترة:</strong> من {formatDate(getProjectValue('startDate'))} إلى {formatDate(getProjectValue('completionDate'))}
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>السنة:</strong> {getProjectValue('year')}
                  </ListGroup.Item>
                </ListGroup>

                <h5 className="mb-3 mt-4 d-flex align-items-center">
                  <FaUsers className="me-2 text-secondary" />
                  الفريق
                </h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>مدير المشروع:</strong> {getProjectValue('projectManager')}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>هاتف الاتصال:</strong> {getProjectValue('contactPhone')}
                  </ListGroup.Item>
                </ListGroup>
              </Col>

              <Col md={6}>
                <h5 className="mb-3 d-flex align-items-center">
                  <FaMoneyBillWave className="me-2 text-secondary" />
                  المعلومات المالية
                </h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>الميزانية:</strong> {formatCurrency(getProjectValue('budget', 0))}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>إجمالي المساعدات:</strong> {formatCurrency(totalAidValue)}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>إجمالي المشتريات:</strong> {formatCurrency(totalPurchaseValue)}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>إجمالي التبرعات:</strong> {formatCurrency(totalDonationValue)}
                  </ListGroup.Item>

                  <ListGroup.Item>
                    <strong>مصدر التمويل:</strong> {getProjectValue('budgetSource')}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>حالة التمويل:</strong> {getProjectValue('fundingStatus')}
                  </ListGroup.Item>
                </ListGroup>

                <h5 className="mb-3 mt-4">المستفيدون</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>الفئة المستهدفة:</strong> {getProjectValue('targetGroup')}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>المستفيدون:</strong> {getProjectValue('beneficiaries')}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>عدد المستفيدين:</strong> {getProjectValue('beneficiariesCount')}
                  </ListGroup.Item>
                </ListGroup>

                <h5 className="mb-3 mt-4">حالة المشروع</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>الحالة:</strong>{' '}
                    <Badge 
                      bg={getProjectValue('implementationStatus') === 'completed' ? 'success' : 'primary'}
                      pill
                    >
                      {getProjectValue('implementationStatus') === 'completed' ? 'تم الانجاز' : 'قيد التنفيذ'}
                    </Badge>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>التفاصيل:</strong> {getProjectValue('details')}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>ملاحظات:</strong> {getProjectValue('notes', 'لا توجد ملاحظات')}
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="phases" title={
            <span><FaLayerGroup className="me-1" /> المراحل ({project.phases?.length || 0})</span>
          }>
            {project.phases?.length > 0 ? renderPhases(project.phases) : (
              <div className="text-center text-muted mt-5 py-4">
                <FaLayerGroup size={48} className="mb-3" />
                <h6>لا توجد مراحل مرتبطة بهذا المشروع</h6>
              </div>
            )}
          </Tab>

          <Tab eventKey="partners" title={
            <span><FaHandshake className="me-1" /> الشركاء ({project.partners?.length || 0})</span>
          }>
            {project.partners?.length > 0 ? renderPartners(project.partners) : (
              <div className="text-center text-muted mt-5 py-4">
                <FaHandshake size={48} className="mb-3" />
                <h6>لا توجد شركاء مرتبطين بهذا المشروع</h6>
              </div>
            )}
          </Tab>

          <Tab eventKey="aids" title={
            <span><FaBox className="me-1" /> المساعدات ({projectAids.length})</span>
          }>
            {projectAids.length > 0 ? (
              <div className="mt-4">
                <h6 className="d-flex align-items-center">
                  <FaBox className="me-2 text-primary" /> المساعدات
                  <Badge bg="secondary" className="ms-2">
                    {projectAids.length}
                  </Badge>
                </h6>
                <div className="table-responsive mt-3">
                  <table className="table table-striped table-bordered table-sm">
                    <thead>
                      <tr>
                        <th>المرجع</th>
                        <th>النوع</th>
                        <th>القيمة</th>
                        <th>التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectAids.map(aid => (
                        <tr key={aid.id}>
                          <td>{aid.reference || 'بدون مرجع'}</td>
                          <td>{aid.aidType || 'غير محدد'}</td>
                          <td>{formatCurrency(aid.monetaryValue || 0)}</td>
                          <td>{aid.dateOfAid ? new Date(aid.dateOfAid).toLocaleDateString('ar-TN') : 'غير محدد'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-info">
                        <td colSpan="2" className="text-end fw-bold">الإجمالي:</td>
                        <td className="fw-bold">{formatCurrency(totalAidValue)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted mt-5 py-4">
                <FaBox size={48} className="mb-3" />
                <h6>لا توجد مساعدات مرتبطة بهذا المشروع</h6>
              </div>
            )}
          </Tab>

          <Tab eventKey="purchases" title={
            <span><FaShoppingCart className="me-1" /> المشتريات ({projectPurchases.length})</span>
          }>
            {projectPurchases.length > 0 ? (
              <div className="mt-4">
                <h6 className="d-flex align-items-center">
                  <FaShoppingCart className="me-2 text-warning" /> المشتريات
                  <Badge bg="secondary" className="ms-2">
                    {projectPurchases.length}
                  </Badge>
                </h6>
                <div className="table-responsive mt-3">
                  <table className="table table-striped table-bordered table-sm">
                    <thead>
                      <tr>
                        <th>المرجع</th>
                        <th>النوع</th>
                        <th>القيمة</th>
                        <th>التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectPurchases.map(purchase => (
                        <tr key={purchase.id}>
                          <td>{purchase.reference || 'بدون مرجع'}</td>
                          <td>{purchase.suppliesType || 'غير محدد'}</td>
                          <td>{formatCurrency(purchase.monetaryValue || 0)}</td>
                          <td>{purchase.dateOfEntry ? new Date(purchase.dateOfEntry).toLocaleDateString('ar-TN') : 'غير محدد'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-info">
                        <td colSpan="2" className="text-end fw-bold">الإجمالي:</td>
                        <td className="fw-bold">{formatCurrency(totalPurchaseValue)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted mt-5 py-4">
                <FaShoppingCart size={48} className="mb-3" />
                <h6>لا توجد مشتريات مرتبطة بهذا المشروع</h6>
              </div>
            )}
          </Tab>

          <Tab eventKey="donations" title={
            <span><FaHandHoldingHeart className="me-1" /> التبرعات ({projectDonations.length})</span>
          }>
            {projectDonations.length > 0 ? (
              <div className="mt-4">
                <h6 className="d-flex align-items-center">
                  <FaHandHoldingHeart className="me-2 text-success" /> التبرعات
                  <Badge bg="secondary" className="ms-2">
                    {projectDonations.length}
                  </Badge>
                </h6>
                <div className="table-responsive mt-3">
                  <table className="table table-striped table-bordered table-sm">
                    <thead>
                      <tr>
                        <th>المرجع</th>
                        <th>النوع</th>
                        <th>القيمة</th>
                        <th>التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectDonations.map(donation => (
                        <tr key={donation.id}>
                          <td>{donation.reference || 'بدون مرجع'}</td>
                          <td>{donation.suppliesType || 'غير محدد'}</td>
                          <td>{formatCurrency(donation.monetaryValue || 0)}</td>
                          <td>{donation.dateOfEntry ? new Date(donation.dateOfEntry).toLocaleDateString('ar-TN') : 'غير محدد'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-info">
                        <td colSpan="2" className="text-end fw-bold">الإجمالي:</td>
                        <td className="fw-bold">{formatCurrency(totalDonationValue)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted mt-5 py-4">
                <FaHandHoldingHeart size={48} className="mb-3" />
                <h6>لا توجد تبرعات مرتبطة بهذا المشروع</h6>
              </div>
            )}
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          إغلاق
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProjectDetailsModal;