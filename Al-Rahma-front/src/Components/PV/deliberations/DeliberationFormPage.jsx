import React, { useState, useEffect } from 'react';
import { 
  Form, Button, Alert, Spinner, Container, Row, Col, Card 
} from 'react-bootstrap';
import { 
  FaTimes, FaFileAlt, FaArrowLeft, FaSave 
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import deliberationService from '../../../services/deliberationService';
import './styles.css';
import BasicInfoSection from './BasicInfoSection';
import DocumentsSection from './DocumentsSection';

const DeliberationFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Form state - simplified without decisions
  const [formData, setFormData] = useState({
    number: '',
    attendees: [],
    dateTime: '',
    document: null,
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data for dropdowns
  const [committeeOptions, setCommitteeOptions] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Fetch committees (kept for potential future use)
      const committees = await deliberationService.getCommittees();
      setCommitteeOptions(committees);
      
      // If editing, load the deliberation data
      if (id) {
        const deliberation = await deliberationService.getById(id);
        setFormData({
          ...deliberation,
          attendees: Array.isArray(deliberation.attendees) 
            ? deliberation.attendees 
            : deliberation.attendees.split(',').map(a => a.trim()).filter(a => a),
        });
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('حدث خطأ أثناء جلب البيانات الأولية');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      document: e.target.files[0],
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setErrors({});
  
  try {
    // Validate form
    const newErrors = {};
    if (!formData.number.trim()) newErrors.number = 'رقم المداولة مطلوب';
    if (!formData.dateTime) newErrors.dateTime = 'التاريخ والوقت مطلوب';
    
    const attendeesList = formData.attendees;
    if (attendeesList.length < 3) {
      newErrors.attendees = 'مطلوب على الأقل 3 حضور';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    // Prepare data for API - ensure proper format
    const submissionData = {
      number: formData.number.trim(),
      dateTime: formData.dateTime,
      attendees: formData.attendees.join(', '), // Join with comma + space
      document: formData.document,
    };


    if (id) {
      await deliberationService.update(id, submissionData);
      toast.success('تم تحديث المداولة بنجاح');
    } else {
      await deliberationService.create(submissionData);
      toast.success('تم إضافة المداولة بنجاح');
    }
    
    navigate('/PV');
  } catch (error) {
    console.error('Error saving deliberation:', error);
    try {
      // Try to parse backend validation errors
      const errorData = JSON.parse(error.message);
      if (errorData.errors) {
        setErrors(errorData.errors);
      } else {
        toast.error(errorData.message || 'حدث خطأ أثناء حفظ المداولة');
      }
    } catch {
      // If not JSON, show raw error
      toast.error(error.message || 'حدث خطأ أثناء حفظ المداولة');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">جاري تحميل البيانات...</p>
      </Container>
    );
  }

  return (
    <Container className="deliberation-form-page py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/PV')}
            className="mb-3"
          >
            <FaArrowLeft className="me-2" />
            العودة إلى قائمة المداولات
          </Button>
          <h2>{id ? 'تعديل مداولة' : 'إضافة مداولة جديدة'}</h2>
        </Col>
      </Row>

      {/* Error alert */}
      {errors?.message && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" className="d-flex align-items-center">
              <FaTimes className="me-2" />
              {errors.message}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Form */}
      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Body>
            <BasicInfoSection 
              formData={formData}
              setFormData={setFormData}
              errors={errors}
            />
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Body>
            <DocumentsSection 
              formData={formData}
              handleFileChange={handleFileChange}
              errors={errors}
            />
          </Card.Body>
        </Card>

        {/* Form actions */}
        <Row className="mt-4">
          <Col className="text-end">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/PV')}
              className="me-2"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                  {id ? 'جاري الحفظ...' : 'جاري الإضافة...'}
                </>
              ) : (
                <>
                  <FaSave className="me-2" />
                  {id ? 'حفظ التعديلات' : 'إضافة مداولة'}
                </>
              )}
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default DeliberationFormPage;