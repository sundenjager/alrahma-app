import React, { useState } from 'react';
import { Form, Row, Col, Badge, Button } from 'react-bootstrap';
import { FaTimes, FaPlus } from 'react-icons/fa';

const BasicInfoSection = ({
  formData,
  setFormData,
  errors
}) => {
  const [newAttendee, setNewAttendee] = useState('');

  const handleAddAttendee = () => {
    if (newAttendee.trim() && !formData.attendees.includes(newAttendee.trim())) {
      const updatedAttendees = [...formData.attendees, newAttendee.trim()];
      setFormData({ 
        ...formData, 
        attendees: updatedAttendees 
      });
      setNewAttendee('');
    }
  };

  const handleRemoveAttendee = (indexToRemove) => {
    const updatedAttendees = formData.attendees.filter((_, index) => index !== indexToRemove);
    setFormData({ 
      ...formData, 
      attendees: updatedAttendees 
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAttendee();
    }
  };

  return (
    <div className="form-section mb-4">
      <h5 className="section-title mb-3">معلومات أساسية</h5>
      <Row>
        <Col md={6} className="mb-3">
          <Form.Group controlId="number">
            <Form.Label>رقم المداولة</Form.Label>
            <Form.Control
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              isInvalid={!!errors?.number}
            />
            <Form.Control.Feedback type="invalid">
              {errors?.number}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6} className="mb-3">
          <Form.Group controlId="dateTime">
            <Form.Label>التاريخ والساعة</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.dateTime}
              onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
              isInvalid={!!errors?.dateTime}
            />
            <Form.Control.Feedback type="invalid">
              {errors?.dateTime}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={12} className="mb-3">
          <Form.Group controlId="attendees">
            <Form.Label>الحضور</Form.Label>
            
            {/* Attendee Input with Add Button */}
            <div className="d-flex mb-2">
              <Form.Control
                type="text"
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="أدخل اسم الحاضر"
                className="me-2"
              />
              <Button 
                variant="outline-primary" 
                onClick={handleAddAttendee}
                disabled={!newAttendee.trim()}
                style={{ minWidth: '80px' }}
              >
                <FaPlus />
              </Button>
            </div>

            {/* Attendees List as Tags */}
            <div className="attendees-tags-container">
              {formData.attendees.map((attendee, index) => (
                <Badge 
                  key={index}
                  bg="primary" 
                  className="me-2 mb-2 p-2 d-inline-flex align-items-center"
                  style={{ fontSize: '0.9rem' }}
                >
                  {attendee}
                  <FaTimes 
                    className="ms-2 cursor-pointer" 
                    onClick={() => handleRemoveAttendee(index)}
                    style={{ cursor: 'pointer' }}
                  />
                </Badge>
              ))}
              
              {formData.attendees.length === 0 && (
                <div className="text-muted">
                  لم يتم إضافة أي حضور بعد
                </div>
              )}
            </div>

            {/* Error Message */}
            {errors?.attendees && (
              <div className="invalid-feedback d-block">
                {errors.attendees}
              </div>
            )}

            {/* Help Text */}
            <Form.Text className="text-muted">
              أضف الحضور باستخدام الزر أو بالضغط على Enter. يجب أن يكون هناك على الأقل 3 حضور.
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default BasicInfoSection;