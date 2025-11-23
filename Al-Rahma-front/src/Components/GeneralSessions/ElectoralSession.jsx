import React, { useState } from 'react';
import { Button, Card, Form, Row, Col, Alert, Container, Badge, ListGroup, Table } from 'react-bootstrap';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { createSession } from '../../services/sessionService';
import { toast } from 'react-hot-toast';

const monthNames = [
  "جانفي", "فيفري", "مارس", "آفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const requiredDocuments = [
  { id: 'programs', label: 'البرامج المقترحة' },
  { id: 'budget', label: 'الميزانية المقترحة' },
  { id: 'financialReport', label: 'التقرير المالي' },
  { id: 'literaryReport', label: 'التقرير الأدبي' },
  { id: 'auditorReport', label: 'تقرير مراقب الحسابات' },
  { id: 'newspaperAnnouncement', label: 'الإعلان في الجريدة' }
];

const positionsList = [
  "رئيس الجمعية",
  "نائب رئيس الجمعية",
  "أمين المال",
  "الكاتب العام",
  "نائب الكاتب العام",
];

const ElectoralSessions = ({ onBack, onSessionCreated }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isExpandedSession, setIsExpandedSession] = useState(false);
  const [expandedSessionDate, setExpandedSessionDate] = useState(new Date());
  const [formData, setFormData] = useState({
    location: "",
    notes: "",
    guests: [],
    candidates: [],
    programs: null,
    budget: null,
    financialReport: null,
    literaryReport: null,
    auditorReport: null,
    newspaperAnnouncement: null,
    generalSessionPV: null,
    newspaperReport: null,
    attendeeList: null,
    membersAttendee: null
  });

  const [newGuest, setNewGuest] = useState({
    name: '',
    position: '',
    organization: '',
    phone: ''
  });

  const [newCandidate, setNewCandidate] = useState({
    position: '',
    name: '',
    file: null
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (fieldName, e) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: e.target.files[0]
    }));
  };

  const handleGuestInputChange = (e) => {
    const { name, value } = e.target;
    setNewGuest(prev => ({ ...prev, [name]: value }));
  };

  const handleCandidateInputChange = (e) => {
    const { name, value } = e.target;
    setNewCandidate(prev => ({ ...prev, [name]: value }));
  };

  const handleCandidateFileUpload = (e) => {
    setNewCandidate(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const addGuest = () => {
    if (!newGuest.name || !newGuest.position || !newGuest.phone) {
      setError("يرجى إدخال اسم الضيف ومنصبه ورقم الهاتف");
      return;
    }

    setFormData(prev => ({
      ...prev,
      guests: [...prev.guests, newGuest]
    }));
    
    setNewGuest({ name: '', position: '', organization: '', phone: '' });
    setError(null);
  };

  const removeGuest = (index) => {
    setFormData(prev => ({
      ...prev,
      guests: prev.guests.filter((_, i) => i !== index)
    }));
  };

  const addCandidate = () => {
    if (!newCandidate.position || !newCandidate.name || !newCandidate.file) {
      setError("يرجى إدخال جميع بيانات المترشح");
      return;
    }

    setFormData(prev => ({
      ...prev,
      candidates: [...prev.candidates, newCandidate]
    }));
    
    setNewCandidate({ position: '', name: '', file: null });
    setError(null);
  };

  const removeCandidate = (index) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.location) {
        setError("يرجى تحديد موقع الجلسة");
        return;
      }
  
      // Validate all documents are required
      const missingDocuments = requiredDocuments
        .filter(doc => !formData[doc.id])
        .map(doc => doc.label);
  
      if (missingDocuments.length > 0) {
        setError(`جميع الملفات مطلوبة: ${missingDocuments.join('، ')}`);
        return;
      }
  
      // Validate candidates - ONLY CHECK IF AT LEAST ONE CANDIDATE EXISTS
      if (formData.candidates.length === 0) {
        setError("يرجى إضافة مترشح واحد على الأقل للجلسة الانتخابية");
        return;
      }
  
      // Removed the validation that requires every position to have a candidate
      // const positionsWithCandidates = new Set(formData.candidates.map(c => c.position));
      // if (positionsWithCandidates.size < positionsList.length) {
      //   setError("يرجى إضافة مترشح واحد على الأقل لكل منصب");
      //   return;
      // }
  
      // Prepare session data with properly formatted candidates
      const sessionData = {
        sessionType: "Electoral",
        sessionDate: selectedDate,
        location: formData.location,
        notes: formData.notes,
        guests: formData.guests,
        isElectoral: true,
        // Map candidates to match backend expectations
        candidates: formData.candidates.map(candidate => ({
          name: candidate.name,
          position: candidate.position,
          candidateFile: candidate.file
        })),
        // Document fields
        programs: formData.programs,
        budget: formData.budget,
        financialReport: formData.financialReport,
        literaryReport: formData.literaryReport,
        auditorReport: formData.auditorReport,
        newspaperAnnouncement: formData.newspaperAnnouncement,
        // These will be null initially
        generalSessionPV: null,
        newspaperReport: null,
        attendeeList: null,
        membersAttendee: null
      };
  
      const response = await createSession(sessionData);
      toast.success('تم إنشاء الجلسة الانتخابية بنجاح');
      onSessionCreated(response);
    } catch (error) {
      console.error('Error creating session:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'حدث خطأ أثناء إنشاء الجلسة';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      <Button variant="secondary" onClick={onBack} className="mb-4">
        <i className="bi bi-arrow-right me-2"></i> العودة
      </Button>

      <Card className="shadow">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">إنشاء جلسة انتخابية</h4>
        </Card.Header>
        
        <Card.Body>
          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold d-block">تاريخ الجلسة:</Form.Label>
                  <div className="d-flex align-items-center mb-2">
                    <Badge bg="light" text="dark" className="fs-6">
                      {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                    </Badge>
                  </div>
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    locale="ar"
                    formatMonthYear={(locale, date) => `${monthNames[date.getMonth()]} ${date.getFullYear()}`}
                    // REMOVED: tileDisabled prop to allow selecting older dates
                    className="w-100 border-0"
                  />
                </Form.Group>

                {/* Add the expanded session checkbox here */}
                <Form.Group className="mb-4">
                  <Form.Check 
                    type="checkbox"
                    label="الجلسة الموسعة"
                    checked={isExpandedSession}
                    onChange={(e) => setIsExpandedSession(e.target.checked)}
                    className="fw-bold"
                  />
                  
                  {isExpandedSession && (
                    <div className="mt-3">
                      <Form.Label className="fw-bold d-block">تاريخ الجلسة الموسعة:</Form.Label>
                      <div className="d-flex align-items-center mb-2">
                        <Badge bg="light" text="dark" className="fs-6">
                          {expandedSessionDate.getDate()} {monthNames[expandedSessionDate.getMonth()]} {expandedSessionDate.getFullYear()}
                        </Badge>
                      </div>
                      <Calendar
                        onChange={setExpandedSessionDate}
                        value={expandedSessionDate}
                        locale="ar"
                        formatMonthYear={(locale, date) => `${monthNames[date.getMonth()]} ${date.getFullYear()}`}
                        // REMOVED: tileDisabled prop to allow selecting older dates
                        className="w-100 border-0"
                      />
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">موقع الجلسة:</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                {/* Guest Management Section */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">إدارة الضيوف:</Form.Label>
                  <div className="border rounded p-3 mb-3">
                    <Row className="g-2 mb-3">
                      <Col md={6}>
                        <Form.Control
                          type="text"
                          placeholder="اسم الضيف"
                          name="name"
                          value={newGuest.name}
                          onChange={handleGuestInputChange}
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          type="text"
                          placeholder="رقم الهاتف"
                          name="phone"
                          value={newGuest.phone}
                          onChange={handleGuestInputChange}
                        />
                      </Col>
                    </Row>
                    <Row className="g-2 mb-3">
                      <Col md={6}>
                        <Form.Control
                          type="text"
                          placeholder="المنصب"
                          name="position"
                          value={newGuest.position}
                          onChange={handleGuestInputChange}
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          type="text"
                          placeholder="المؤسسة (اختياري)"
                          name="organization"
                          value={newGuest.organization}
                          onChange={handleGuestInputChange}
                        />
                      </Col>
                    </Row>
                    <Button 
                      variant="outline-primary" 
                      className="w-100"
                      onClick={addGuest}
                      disabled={!newGuest.name || !newGuest.position || !newGuest.phone}
                    >
                      إضافة ضيف
                    </Button>
                  </div>

                  {formData.guests.length > 0 && (
                    <div className="border rounded p-3">
                      <h6 className="fw-bold mb-3">قائمة الضيوف المضافين</h6>
                      <ListGroup>
                        {formData.guests.map((guest, index) => (
                          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                            <div>
                              <div><strong>{guest.name}</strong> - {guest.position}</div>
                              <div className="text-muted small">
                                {guest.phone} {guest.organization && ` | ${guest.organization}`}
                              </div>
                            </div>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => removeGuest(index)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}
                </Form.Group>

                <Form.Group>
                  <Form.Label className="fw-bold">ملاحظات:</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <h5 className="fw-bold mb-3">السندات المطلوبة</h5>
                <div className="border rounded p-3 mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <h6 className="fw-bold mb-3 text-danger">الملفات المطلوبة</h6>
                  {requiredDocuments.map((doc) => (
                    <Form.Group key={doc.id} className="mb-3">
                      <Form.Label className="d-block mb-1">{doc.label}:</Form.Label>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <Form.Control
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(doc.id, e)}
                            className="d-none"
                            id={`file-${doc.id}`}
                          />
                          <label 
                            htmlFor={`file-${doc.id}`} 
                            className="btn btn-outline-secondary w-100 text-start"
                          >
                            {formData[doc.id] ? (
                              <span className="text-success">
                                <i className="bi bi-check-circle-fill me-2"></i>
                                {formData[doc.id].name}
                              </span>
                            ) : (
                              <span className="text-muted">اختر ملف...</span>
                            )}
                          </label>
                        </div>
                      </div>
                    </Form.Group>
                  ))}
                </div>

                {/* Candidates Section */}
                <h5 className="fw-bold mb-3">بيانات المترشحين</h5>
                <div className="border rounded p-3">
                  <Form.Group className="mb-3">
                    <Form.Label>المنصب:</Form.Label>
                    <Form.Select
                      name="position"
                      value={newCandidate.position}
                      onChange={handleCandidateInputChange}
                    >
                      <option value="">اختر المنصب</option>
                      {positionsList.map((pos, index) => (
                        <option key={index} value={pos}>{pos}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>اسم المترشح:</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={newCandidate.name}
                      onChange={handleCandidateInputChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>رفع بطاقة المترشح (PDF فقط):</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".pdf"
                      onChange={handleCandidateFileUpload}
                      className="d-none"
                      id="candidate-file"
                    />
                    <label htmlFor="candidate-file" className="btn btn-outline-secondary w-100 text-start">
                      {newCandidate.file ? (
                        <span className="text-success">
                          <i className="bi bi-check-circle-fill me-2"></i>
                          {newCandidate.file.name}
                        </span>
                      ) : (
                        <span className="text-muted">اختر ملف...</span>
                      )}
                    </label>
                  </Form.Group>

                  <Button 
                    variant="outline-primary" 
                    className="w-100 mb-3"
                    onClick={addCandidate}
                    disabled={!newCandidate.position || !newCandidate.name || !newCandidate.file}
                  >
                    إضافة مترشح
                  </Button>

                  {formData.candidates.length > 0 && (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <Table bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>المنصب</th>
                            <th>الاسم</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.candidates.map((candidate, index) => (
                            <tr key={index}>
                              <td>{candidate.position}</td>
                              <td>{candidate.name}</td>
                              <td>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => removeCandidate(index)}
                                >
                                  <i className="bi bi-trash"></i> حذف
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={onBack}>
                إلغاء
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={isSubmitting}
                className="px-4"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    إنشاء الجلسة الانتخابية
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ElectoralSessions;