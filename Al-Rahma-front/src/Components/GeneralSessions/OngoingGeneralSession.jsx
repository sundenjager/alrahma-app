import React, { useState, useEffect } from "react";
import { 
  Card, 
  Button, 
  Modal, 
  Form, 
  Table, 
  Spinner, 
  Row, 
  Col, 
  Alert, 
  Badge,
  Container,
  ProgressBar
} from "react-bootstrap";
import { FaPhone, FaCheck, FaTimes, FaFilePdf, FaPrint, FaArrowLeft } from "react-icons/fa";
import PrintList from "./PrintList";
import PrintText from "./PrintText";
import { fetchActivePreviousYearMembers } from "../../services/memberService";
import { getPendingSession, completeSession } from "../../services/sessionService";
import "./OngoingGeneralSessionStyles.css"; 
import GuestList from "./GuestList";
import DocumentPrintView from "./DocumentPrintView";


const OngoingGeneralSession = ({ onBack }) => {
  // State for modals and files
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [GeneralSessionPV, setGeneralSessionPV] = useState(null);
  const [NewspaperReport, setNewspaperReport] = useState(null);
  const [AttendeeList, setAttendeeList] = useState(null);
  const [MembersAttendee, setMembersAttendee] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for dynamic data
  const [informedMembers, setInformedMembers] = useState([]);
  const [attendingMembers, setAttendingMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingSession, setPendingSession] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch pending session
        const session = await getPendingSession();
        
        // Explicitly check for null
        if (session === null) {
          setError("No pending session exists");
          setLoading(false);
          return;
        }
        
        setPendingSession(session);
        
        // Fetch members
        const members = await fetchActivePreviousYearMembers();
        setAllMembers(members);
        
        setLoading(false);
      } catch (err) {
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };
    
    fetchData();
}, []);

const getArabicSessionType = (sessionType) => {
  const types = {
    'Ordinary': 'جلسة عامة عادية',
    'Electoral': 'جلسة عامة انتخابية',
    'Extraordinary': 'جلسة عامة خارقة للعادة',
  };
  
  return types[sessionType] || sessionType;
};

  // If no pending session, show error
  if (!pendingSession && !loading) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="text-center">
          لا توجد جلسة معلقة حالياً
        </Alert>
        <div className="text-center mt-3">
          <Button variant="primary" onClick={onBack}>
            العودة
          </Button>
        </div>
      </Container>
    );
  }

  // Prepare guest list from session data
  const guestList = pendingSession?.guests?.map(guest => ({
    name: guest.name,
    position: guest.position,
    organization: guest.organization || "N/A",
    phone: guest.phone
  })) || [];

  // Prepare candidate list if electoral session
  const candidateList = pendingSession?.isElectoral ? 
    pendingSession.candidates?.map(candidate => ({
      firstName: candidate.name,
      lastName: "",
      position: candidate.position,
      filePath: candidate.candidateFilePath
    })) : [];

  // Modal  rs
  const handleCloseMembersModal = () => setShowMembersModal(false);
  const handleShowMembersModal = () => setShowMembersModal(true);

  // File handlers
  const handleFileChange = (setFile) => (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setFile(file);
    } else {
      alert("يرجى تحميل ملف PDF صالح.");
      e.target.value = "";
    }
  };




  // Toggle member status functions
  const toggleInformedStatus = (memberId) => {
    setInformedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  const toggleAttendanceStatus = (memberId) => {
    setAttendingMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };



  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    if (!GeneralSessionPV || !NewspaperReport || !AttendeeList || !MembersAttendee) {
      alert("يرجى تحميل جميع الملفات المطلوبة قبل الإنهاء.");
      setIsSubmitting(false);
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('GeneralSessionPV', GeneralSessionPV);
      formData.append('NewspaperReport', NewspaperReport);
      formData.append('AttendeeList', AttendeeList);
      formData.append('MembersAttendee', MembersAttendee);
  

  
      const response = await completeSession(pendingSession.id, formData);
      
      alert("تم إنهاء الجلسة وحفظ جميع البيانات بنجاح");
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      alert(`حدث خطأ أثناء حفظ البيانات: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };
  
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  if (error) return (
    <Container className="mt-5">
        <Alert variant="danger" className="text-center">
            <h4>Error Loading Session</h4>
            <p>{error}</p>
            {error.response && (
                <div className="mt-3">
                    <h5>Details:</h5>
                    <pre>{JSON.stringify(error.response.data, null, 2)}</pre>
                </div>
            )}
        </Alert>
        <div className="text-center mt-3">
            <Button variant="primary" onClick={onBack}>
                العودة
            </Button>
        </div>
    </Container>
);

  return (
    <Container className="my-5 session-container">
      <Button 
        variant="outline-primary" 
        onClick={onBack} 
        className="mb-4 back-button"
      >
        <FaArrowLeft className="me-2" />
        العودة
      </Button>

      <Card className="shadow-lg session-card">
        <Card.Header className="session-header">
          <h3 className="text-center mb-0">الجلسة العامة الجارية</h3>
        </Card.Header>
        
        <Card.Body>
          <div className="session-info mb-4">
            <Badge bg="info" className="me-2 fs-6">{getArabicSessionType(pendingSession.sessionType)}</Badge>
            <Badge bg="secondary" className="me-2 fs-6">
              {new Date(pendingSession.sessionDate).toLocaleDateString()}
            </Badge>
            <Badge bg="dark" className="fs-6">{pendingSession.location}</Badge>
          </div>

          {/* Members Section */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">قائمة الأعضاء</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <span className="fw-bold">الأعضاء المتصل بهم: </span>
                  <Badge bg="success" className="ms-2">
                    {informedMembers.length} / {allMembers.length}
                  </Badge>
                </div>
                <Button 
                  variant="primary" 
                  onClick={handleShowMembersModal}
                  size="sm"
                >
                  قائمة الأعضاء
                </Button>
              </div>

              <Row>
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">قائمة الأعضاء المبلغين</h6>
                    </Card.Header>
                    <Card.Body className="member-list-container">
                      <PrintList 
                        list={informedMembers.map(id => {
                          const member = allMembers.find(m => m.id === id);
                          return member ? {
                            firstName: member.name,
                            lastName: member.lastname,
                            phone: member.tel,
                            work: member.work,
                            birthDate: member.birthDate
                          } : null;
                        }).filter(Boolean)} 
                        title="قائمة الأعضاء المتصل بهم" 
                      />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">قائمة الحضور</h6>
                    </Card.Header>
                    <Card.Body className="member-list-container">
                      <PrintList 
                        list={attendingMembers.map(id => {
                          const member = allMembers.find(m => m.id === id);
                          return member ? {
                            firstName: member.name,
                            lastName: member.lastname,
                            phone: member.tel,
                            work: member.work,
                            birthDate: member.birthDate
                          } : null;
                        }).filter(Boolean)} 
                        title="قائمة الحضور" 
                      />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>

        {/* Guests Section */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">قائمة الضيوف</h5>
          </Card.Header>
          <Card.Body>
            <GuestList guests={guestList} />
          </Card.Body>
        </Card>

          {/* Candidates Section (only for electoral sessions) */}
          {pendingSession.isElectoral && (
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">قائمة المترشحين</h5>
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>المنصب</th>
                      <th>الملف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSession.candidates?.map((candidate, index) => (
                      <tr key={index}>
                        <td>{candidate.name}</td>
                        <td>{candidate.position}</td>
                        <td>
                          {candidate.candidateFilePath && (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              href={candidate.candidateFilePath}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FaFilePdf /> عرض الملف
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                {/* Keep the PrintList if you still want it */}
                <div className="mt-3">
                  <PrintList 
                    list={candidateList} 
                    title="قائمة المترشحين"
                    additionalFields={['position']}
                  />
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Session Documents Section */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">وثائق الجلسة</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-3">
                  <DocumentPrintView 
                    title="البرامج المقترحة" 
                    sessionId={pendingSession.id}
                    documentType="programs"
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <DocumentPrintView 
                    title="الميزانية المقترحة" 
                    sessionId={pendingSession.id}
                    documentType="budget"
                  />
                </Col>
              </Row>

              <Row>
                <Col md={6} className="mb-3">
                  <DocumentPrintView 
                    title="التقرير المالي" 
                    sessionId={pendingSession.id}
                    documentType="financialReport"
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <DocumentPrintView 
                    title="التقرير الأدبي" 
                    sessionId={pendingSession.id}
                    documentType="literaryReport"
                  />
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <DocumentPrintView 
                    title="تقرير مراقب الحسابات" 
                    sessionId={pendingSession.id}
                    documentType="auditorReport"
                  />
                </Col>
                <Col md={6}>
                  <DocumentPrintView 
                    title="إعلان الجريدة" 
                    sessionId={pendingSession.id}
                    documentType="newspaperAnnouncement"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card> 

          {/* Finish Session Section */}
          <Card className="border-primary finish-session-card">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">إنهاء الجلسة</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="GeneralSessionPV">
                      <Form.Label className="fw-bold">
                        <FaFilePdf className="me-2" />
                        محضر الجلسة (PDF)
                      </Form.Label>
                      <Form.Control
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange(setGeneralSessionPV)}
                        required
                      />
                      {GeneralSessionPV && (
                        <div className="mt-2 text-success">
                          <FaCheck className="me-2" />
                          {GeneralSessionPV.name}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="NewspaperReport">
                      <Form.Label className="fw-bold">
                        <FaFilePdf className="me-2" />
                        الإعلان في الجريدة (PDF)
                      </Form.Label>
                      <Form.Control
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange(setNewspaperReport)}
                        required
                      />
                      {NewspaperReport && (
                        <div className="mt-2 text-success">
                          <FaCheck className="me-2" />
                          {NewspaperReport.name}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="AttendeeList">
                      <Form.Label className="fw-bold">
                        <FaFilePdf className="me-2" />
                        قائمة الحضور (PDF)
                      </Form.Label>
                      <Form.Control
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange(setAttendeeList)}
                        required
                      />
                      {AttendeeList && (
                        <div className="mt-2 text-success">
                          <FaCheck className="me-2" />
                          {AttendeeList.name}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="MembersAttendee">
                      <Form.Label className="fw-bold">
                        <FaFilePdf className="me-2" />
                        قائمة الأعضاء الحاضرين (PDF)
                      </Form.Label>
                      <Form.Control
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange(setMembersAttendee)}
                        required
                      />
                      {MembersAttendee && (
                        <div className="mt-2 text-success">
                          <FaCheck className="me-2" />
                          {MembersAttendee.name}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

               


                {uploadProgress > 0 && (
                  <ProgressBar 
                    now={uploadProgress} 
                    label={`${uploadProgress}%`} 
                    className="mb-3"
                    variant="success"
                    animated
                  />
                )}

                <div className="text-center">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        جاري الحفظ...
                      </>
                    ) : (
                      "حفظ وإنهاء الجلسة"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>

      {/* Members Modal */}
      <Modal show={showMembersModal} onHide={handleCloseMembersModal} size="xl" centered>
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>إدارة الأعضاء</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Table striped bordered hover responsive className="mb-0">
            <thead className="table-header">
              <tr>
                <th width="15%">الحالة</th>
                <th width="15%">الحضور</th>
                <th width="20%">الاسم</th>
                <th width="20%">اللقب</th>
                <th width="20%">رقم الهاتف</th>
                <th width="10%">اتصال</th>
              </tr>
            </thead>
            <tbody>
              {allMembers.map(member => (
                <tr key={member.id}>
                  <td className="text-center">
                    <Button
                      variant={informedMembers.includes(member.id) ? "success" : "outline-secondary"}
                      onClick={() => toggleInformedStatus(member.id)}
                      size="sm"
                      className="w-100"
                    >
                      {informedMembers.includes(member.id) ? (
                        <>
                          <FaCheck className="me-1" />
                          تم الإعلام
                        </>
                      ) : (
                        "إعلام"
                      )}
                    </Button>
                  </td>
                  <td className="text-center">
                    <Button
                      variant={attendingMembers.includes(member.id) ? "primary" : "outline-secondary"}
                      onClick={() => toggleAttendanceStatus(member.id)}
                      size="sm"
                      className="w-100"
                    >
                      {attendingMembers.includes(member.id) ? (
                        <>
                          <FaCheck className="me-1" />
                          حاضر
                        </>
                      ) : (
                        "تسجيل"
                      )}
                    </Button>
                  </td>
                  <td>{member.name}</td>
                  <td>{member.lastname}</td>
                  <td>{member.tel}</td>
                  <td className="text-center">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      href={`tel:${member.tel}`}
                      className="call-button"
                    >
                      <FaPhone />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <div>
              <Badge bg="success" className="me-2">
                المبلغون: {informedMembers.length}
              </Badge>
              <Badge bg="primary">
                الحاضرون: {attendingMembers.length}
              </Badge>
            </div>
            <Button variant="secondary" onClick={handleCloseMembersModal}>
              إغلاق
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OngoingGeneralSession;