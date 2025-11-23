import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Spinner, 
  Modal, 
  Row, 
  Col, 
  Badge, 
  Accordion,
  Container,
  Alert
} from 'react-bootstrap';
import { getCompletedSessions, downloadDocument } from '../../services/sessionService';
import { FaFileAlt, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaChevronDown } from 'react-icons/fa';
import { BsArrowLeft } from 'react-icons/bs';
import './GeneralSessionsHistory.css'; // Custom CSS file
import SessionDocumentsTable from './SessionDocumentsTable'; 

const GeneralSessionsHistory = ({ onBack }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeYear, setActiveYear] = useState(null);

  useEffect(() => {
    const fetchCompletedSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const completedSessions = await getCompletedSessions();
        
        if (!Array.isArray(completedSessions)) {
          throw new Error("Invalid response format from server");
        }
        
        setSessions(completedSessions);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching completed sessions:", err);
        setError(err.response?.data?.message || err.message || "Failed to load completed sessions");
        setLoading(false);
        setSessions([]);
      }
    };
    
    fetchCompletedSessions();
  }, []);

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getSessionType = (type) => {
    const types = {
      Ordinary: 'عادية',
      Electoral: 'انتخابية',
      Extraordinary: 'طارئة'
    };
    return types[type] || type;
  };

  const getSessionYear = (dateString) => {
    return new Date(dateString).getFullYear();
  };

  const getSessionBadgeVariant = (type) => {
    const variants = {
      Ordinary: 'primary',
      Electoral: 'success',
      Extraordinary: 'warning'
    };
    return variants[type] || 'secondary';
  };

  // Handlers
  const handleShowDetails = (session) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedSession(null);
  };

  const toggleYear = (year) => {
    setActiveYear(activeYear === year ? null : year);
  };

  // Group sessions by year and then by type
  const groupSessions = () => {
    const grouped = {};
    
    sessions.forEach(session => {
      const year = getSessionYear(session.sessionDate);
      const type = session.sessionType;
      
      if (!grouped[year]) {
        grouped[year] = {};
      }
      
      if (!grouped[year][type]) {
        grouped[year][type] = [];
      }
      
      grouped[year][type].push(session);
    });
    
    return grouped;
  };

  // UI Components
  const DocumentLink = ({ title, documentType, sessionId }) => {
    const handleDownload = async () => {
      try {
        const response = await downloadDocument(sessionId, documentType);

        const blob = new Blob([response], { type: response.type });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${documentType}.pdf`; // or .docx depending on content type
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Download failed:", err);
      }
    };

    return (
      <div className="document-link mb-3">
        <Button 
          variant="outline-primary" 
          className="text-start d-flex align-items-center"
          onClick={handleDownload}
        >
          <FaFileAlt className="me-2" />
          {title}
        </Button>
      </div>
    );
  };


  const SessionDetailsCard = ({ session }) => {
    if (!session) return null;
    
    return (
      <Card className="mb-4 session-details-card">
        <Card.Body>
          <Row className="mb-4">
            <Col md={4}>
              <div className="detail-item">
                <h6 className="detail-label">
                  <FaCalendarAlt className="me-2" />
                  نوع الجلسة:
                </h6>
                <Badge bg={getSessionBadgeVariant(session.sessionType)}>
                  {getSessionType(session.sessionType)}
                </Badge>
              </div>
            </Col>
            <Col md={4}>
              <div className="detail-item">
                <h6 className="detail-label">
                  <FaCalendarAlt className="me-2" />
                  التاريخ:
                </h6>
                <p>{formatDate(session.sessionDate)}</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="detail-item">
                <h6 className="detail-label">
                  <FaMapMarkerAlt className="me-2" />
                  الموقع:
                </h6>
                <p>{session.location}</p>
              </div>
            </Col>
          </Row>

          <h5 className="section-title mb-3">
            <FaFileAlt className="me-2" />
            وثائق الجلسة
          </h5>
          
          <Row>
            <Col md={6}>
            <DocumentLink title="البرامج المقترحة" documentType="Programs" sessionId={session.id} />
            <DocumentLink title="الميزانية المقترحة" documentType="Budget" sessionId={session.id} />
            <DocumentLink title="التقرير المالي" documentType="FinancialReport" sessionId={session.id} />
            <DocumentLink title="التقرير الأدبي" documentType="LiteraryReport" sessionId={session.id} />
            <DocumentLink title="تقرير مراقب الحسابات" documentType="AuditorReport" sessionId={session.id} />
          </Col>
          <Col md={6}>
            <DocumentLink title="إعلان الجريدة" documentType="NewspaperAnnouncement" sessionId={session.id} />
            <DocumentLink title="محضر الجلسة" documentType="GeneralSessionPV" sessionId={session.id} />
            <DocumentLink title="تقرير الجريدة" documentType="NewspaperReport" sessionId={session.id} />
            <DocumentLink title="قائمة الحضور" documentType="AttendeeList" sessionId={session.id} />
            <DocumentLink title="قائمة الأعضاء الحاضرين" documentType="MembersAttendee" sessionId={session.id} />
            </Col>
          </Row>

          {session.additionalDocuments?.length > 0 && (
            <div className="mt-4">
              <h5 className="section-title">
                <FaFileAlt className="me-2" />
                وثائق إضافية
              </h5>
              <Row>
                {session.additionalDocuments.map((doc, index) => (
                  <Col md={6} key={index}>
                    <DocumentLink title={doc.documentType} filePath={doc.filePath} />
                  </Col>
                ))}
              </Row>
            </div>
          )}

          <div className="mt-5">
            <h5 className="section-title">
              <FaFileAlt className="me-2" />
              متابعة إرسال الوثائق الرسمية
            </h5>
            <SessionDocumentsTable sessionId={session.id} />
          </div>
        </Card.Body>
      </Card>
    );
  };

  const YearlySessionSection = ({ year, sessions }) => {
    return (
      <Card className="mb-4 year-section">
        <Card.Header 
          className="year-header d-flex justify-content-between align-items-center"
          onClick={() => toggleYear(year)}
        >
          <h4 className="mb-0">جلسات عام {year}</h4>
          <FaChevronDown className={`toggle-icon ${activeYear === year ? 'open' : ''}`} />
        </Card.Header>
        
        <Accordion.Collapse eventKey={year} in={activeYear === year}>
          <Card.Body>
            {Object.entries(sessions).map(([type, typeSessions]) => (
              <div key={type} className="session-type-section mb-4">
                <div className="d-flex align-items-center mb-3">
                  <Badge bg={getSessionBadgeVariant(type)} className="me-2">
                    {getSessionType(type)}
                  </Badge>
                  <h5 className="mb-0">{getSessionType(type)}</h5>
                </div>
                
                <Table striped bordered hover responsive className="sessions-table">
                  <thead className="table-header">
                    <tr>
                      <th className="text-center">#</th>
                      <th>التاريخ</th>
                      <th>الموقع</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeSessions.map((session, index) => (
                      <tr key={session.id}>
                        <td className="text-center">{index + 1}</td>
                        <td>
                          <FaCalendarAlt className="me-2" />
                          {formatDate(session.sessionDate)}
                        </td>
                        <td>
                          <FaMapMarkerAlt className="me-2" />
                          {session.location}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleShowDetails(session)}
                          >
                            عرض الوثائق
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ))}
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  };

  const LoadingState = () => (
    <div className="text-center py-5">
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">جاري التحميل...</span>
      </Spinner>
      <p className="mt-3">جاري تحميل بيانات الجلسات...</p>
    </div>
  );

  const EmptyState = () => (
    <Alert variant="info" className="text-center py-4">
      <h4>لا توجد جلسات مكتملة مسجلة</h4>
      <p className="mb-0">لم يتم تسجيل أي جلسات مكتملة حتى الآن</p>
    </Alert>
  );

  const ErrorState = () => (
    <Alert variant="danger" className="text-center py-4">
      <h4>حدث خطأ أثناء تحميل البيانات</h4>
      <p className="mb-0">{error}</p>
    </Alert>
  );

  return (
    <Container fluid="lg" className="py-4 sessions-history-container">
      <Button 
        onClick={onBack} 
        variant="outline-secondary" 
        className="mb-4 back-button"
      >
        <BsArrowLeft className="me-2" />
        العودة
      </Button>
      
      <h2 className="text-center mb-4 page-title">
        سجل الجلسات العامة المكتملة
      </h2>
      
      {error ? (
        <ErrorState />
      ) : loading ? (
        <LoadingState />
      ) : sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <Accordion activeKey={activeYear}>
          {Object.entries(groupSessions()).map(([year, yearSessions]) => (
            <YearlySessionSection 
              key={year} 
              year={year} 
              sessions={yearSessions} 
            />
          ))}
        </Accordion>
      )}

      {/* Session Details Modal */}
      <Modal 
        show={showDetailsModal} 
        onHide={handleCloseDetails} 
        size="lg"
        centered
        className="session-details-modal"
      >
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>
            <FaFileAlt className="me-2" />
            وثائق الجلسة
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          <SessionDetailsCard session={selectedSession} />
        </Modal.Body>
        <Modal.Footer className="modal-footer">
          <Button variant="secondary" onClick={handleCloseDetails}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default GeneralSessionsHistory;