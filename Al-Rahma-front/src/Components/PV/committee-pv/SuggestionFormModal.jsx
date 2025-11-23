// SuggestionFormModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button, Spinner, Alert, Accordion } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { getMembersByCommitteeAndYear } from '../../../services/memberService'; 
import './styles.css';

const SuggestionFormModal = ({
  show,
  onHide,
  formData,
  setFormData,
  onSubmit,
  committeeNames,
  editingIndex,
}) => {
  // State for member selection
  const [committeeMembersState, setCommitteeMembersState] = useState({
    members: [],
    loading: false,
    error: null,
    selectedMembers: new Set(),
  });

  const [manualAttendees, setManualAttendees] = useState('');

  // Fetch members when committee changes
  useEffect(() => {
    if (formData.committee && show) {
      fetchCommitteeMembers(formData.committee);
    }
  }, [formData.committee, show]);

  // Initialize selected members and manual attendees from existing formData
  useEffect(() => {
    if (formData.attendees && show) {
      // Parse existing attendees to separate auto-selected from manual
      const attendeesArray = formData.attendees.split(',').map(name => name.trim());
      
      // Reset selected members
      const newSelectedMembers = new Set();
      const manualNames = [];

      attendeesArray.forEach(attendee => {
        const foundMember = committeeMembersState.members.find(member => 
          member.name === attendee
        );
        
        if (foundMember) {
          newSelectedMembers.add(foundMember.id);
        } else if (attendee) {
          manualNames.push(attendee);
        }
      });

      setCommitteeMembersState(prev => ({
        ...prev,
        selectedMembers: newSelectedMembers
      }));
      
      setManualAttendees(manualNames.join(', '));
    }
  }, [formData.attendees, committeeMembersState.members, show]);

  const fetchCommitteeMembers = async (committee) => {
    setCommitteeMembersState(prev => ({
      ...prev,
      loading: true,
      error: null,
      members: [],
      selectedMembers: new Set()
    }));

    try {
      const currentYear = new Date().getFullYear();
      const members = await getMembersByCommitteeAndYear(committee, currentYear);
      
      setCommitteeMembersState(prev => ({
        ...prev,
        members: members,
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching committee members:', error);
      setCommitteeMembersState(prev => ({
        ...prev,
        loading: false,
        error: 'فشل في جلب أعضاء اللجنة. يرجى المحاولة مرة أخرى.'
      }));
    }
  };

  const handleMemberSelection = (memberId, isSelected) => {
    const newSelectedMembers = new Set(committeeMembersState.selectedMembers);
    
    if (isSelected) {
      newSelectedMembers.add(memberId);
    } else {
      newSelectedMembers.delete(memberId);
    }

    setCommitteeMembersState(prev => ({
      ...prev,
      selectedMembers: newSelectedMembers
    }));

    // Update attendees in formData
    updateAttendeesFormData(newSelectedMembers, manualAttendees);
  };

  const handleManualAttendeesChange = (value) => {
    setManualAttendees(value);
    updateAttendeesFormData(committeeMembersState.selectedMembers, value);
  };

  const updateAttendeesFormData = (selectedMembers, manualNames) => {
    const selectedMemberNames = committeeMembersState.members
      .filter(member => selectedMembers.has(member.id))
      .map(member => member.name);

    const manualNamesArray = manualNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    const allAttendees = [...selectedMemberNames, ...manualNamesArray];
    
    setFormData({
      ...formData,
      attendees: allAttendees.join(', ')
    });
  };

  const handleCommitteeChange = (selectedCommittee) => {
    setFormData({ ...formData, committee: selectedCommittee });
    // Reset attendees when committee changes
    setManualAttendees('');
    setCommitteeMembersState(prev => ({
      ...prev,
      selectedMembers: new Set()
    }));
  };

  

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      document: e.target.files[0],
    });
  };

  const renderMemberSelection = () => {
    if (!formData.committee) {
      return (
        <Alert variant="info">
          يرجى اختيار اللجنة أولاً لعرض أعضائها
        </Alert>
      );
    }

    if (committeeMembersState.loading) {
      return (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" className="me-2" />
          جاري تحميل أعضاء اللجنة...
        </div>
      );
    }

    if (committeeMembersState.error) {
      return (
        <Alert variant="danger">
          {committeeMembersState.error}
          <Button 
            variant="link" 
            size="sm"
            onClick={() => fetchCommitteeMembers(formData.committee)}
            className="p-0 ms-2"
          >
            إعادة المحاولة
          </Button>
        </Alert>
      );
    }

    if (committeeMembersState.members.length === 0) {
      return (
        <Alert variant="warning">
          لا توجد أعضاء في هذه اللجنة للعام الحالي
        </Alert>
      );
    }

    return (
      <div className="member-selection-container">
        <h6 className="mb-3">اختر الأعضاء الحاضرين ({committeeMembersState.members.length} عضو):</h6>
        <div className="members-checkbox-grid" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {committeeMembersState.members.map((member) => (
            <Form.Check
              key={member.id}
              type="checkbox"
              id={`member-${member.id}`}
              label={member.name}
              checked={committeeMembersState.selectedMembers.has(member.id)}
              onChange={(e) => handleMemberSelection(member.id, e.target.checked)}
              className="mb-2"
            />
          ))}
        </div>
        <small className="text-muted">
          تم اختيار {committeeMembersState.selectedMembers.size} من {committeeMembersState.members.length} أعضاء
        </small>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} dialogClassName="add-modal" size="lg">
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{editingIndex !== null ? 'تعديل' : 'إضافة'} PV لجنة</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Form.Group as={Col} md={6} controlId="number">
              <Form.Label>محضر الجلسة عدد</Form.Label>
              <Form.Control
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group as={Col} md={6} controlId="dateTime">
              <Form.Label>التاريخ والساعة</Form.Label>
              <Form.Control
                type="datetime-local"
                value={formData.dateTime}
                onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group as={Col} md={12} controlId="committee">
              <Form.Label>اللجنة</Form.Label>
              <Form.Control
                as="select"
                value={formData.committee}
                onChange={(e) => handleCommitteeChange(e.target.value)}
                required
              >
                <option value="">اختر اللجنة</option>
                {committeeNames.map((committee, index) => (
                  <option key={index} value={committee}>{committee}</option>
                ))}
              </Form.Control>
            </Form.Group>
          </Row>

          {/* Keep member selection section */}
          <Row>
            <Form.Group as={Col} md={12}>
              <Form.Label>الحضور</Form.Label>
              <Accordion defaultActiveKey="0" className="mb-3">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>اختيار الأعضاء من اللجنة</Accordion.Header>
                  <Accordion.Body>
                    {renderMemberSelection()}
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>إضافة أعضاء إضافيين يدوياً</Accordion.Header>
                  <Accordion.Body>
                    <Form.Control
                      type="text"
                      placeholder="أدخل أسماء الحضور الإضافيين مفصولة بفواصل"
                      value={manualAttendees}
                      onChange={(e) => handleManualAttendeesChange(e.target.value)}
                    />
                    <small className="text-muted">
                      يمكنك إضافة أعضاء إضافيين هنا (غير أعضاء اللجنة)
                    </small>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
              
              {/* Display final attendees list */}
              {formData.attendees && (
                <div className="mt-2 p-2 bg-light rounded">
                  <strong>قائمة الحضور النهائية:</strong>
                  <div className="mt-1">{formData.attendees}</div>
                </div>
              )}
            </Form.Group>
          </Row>

          {/* Remove the entire points section */}
          {/* <Row><Form.Group>... points ...</Form.Group></Row> */}

          <Row>
            <Form.Group as={Col} md={12} controlId="document">
              <Form.Label>مستند (PDF)</Form.Label>
              <Form.Control 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange} 
              />
              {formData.documentPath && !formData.document && (
                <div className="mt-2">
                  <a 
                    href={`/${formData.documentPath}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    عرض المستند الحالي
                  </a>
                </div>
              )}
            </Form.Group>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            إلغاء
          </Button>
          <Button type="submit" className="custom-btn primary">
            {editingIndex !== null ? 'حفظ التعديلات' : 'إضافة'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Remove points from propTypes
SuggestionFormModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  committeeNames: PropTypes.array.isRequired,
  editingIndex: PropTypes.number,
};

export default SuggestionFormModal;