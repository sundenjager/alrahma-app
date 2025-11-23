import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Row, 
  Col, 
  OverlayTrigger, 
  Popover,
  Alert,
  Spinner,
  Button
} from 'react-bootstrap';
import { checkCINUnique } from '../../services/memberService';

const MemberFormModal = ({ 
  show, 
  mode, 
  memberId, 
  onHide, 
  onSubmit,
  initialMemberData
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    cin: '',
    numcard: '',
    address: '',
    nationality: 'تونسية', // Default nationality
    birthDate: '',
    work: '',
    tel: '',
    dateOfMembership: '',
    isVolunteering: false,
    volunteerField: '',
    memberType: 'عضو عادي'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [customNationality, setCustomNationality] = useState(''); // For manual input

  // Common nationalities list
  const nationalities = [
    'تونسية', 'مصرية', 'سعودية', 'أردنية', 'سورية', 'لبنانية', 'عراقية', 
    'فلسطينية', 'ليبية', 'جزائرية', 'مغربية', 'يمنية', 'سودانية', 'كويتية',
    'إماراتية', 'قطرية', 'عمانية', 'بحرينية', 'موريتانية', 'صومالية', 'جيبوتية',
    'أخرى'
  ];

  // Popover for CIN field
  const cinPopover = (
    <Popover id="cin-popover">
      <Popover.Header>معلومة</Popover.Header>
      <Popover.Body>أو رقم بطاقة تعريف الولي بالنسبة للتلاميذ</Popover.Body>
    </Popover>
  );

  // Volunteer committee options
  const volunteerOptions = [
    'لجنة الشباب',
    'لجنة الاسرة',
    'لجنة الصحة',
    'لجنة التنمية',
    'لجنة الكفالة',
    'لجنة التخطيط و الدراسات'
  ];

  // Handle nationality selection
  const handleNationalityChange = (nationality) => {
    if (nationality === 'أخرى') {
      setFormData(prev => ({
        ...prev,
        nationality: 'أخرى'
      }));
      setCustomNationality(''); // Reset custom nationality
    } else {
      setFormData(prev => ({
        ...prev,
        nationality
      }));
      setCustomNationality(''); // Clear custom nationality when selecting predefined
    }
    setShowNationalityDropdown(false);
    
    // Clear error if exists
    if (errors.nationality) {
      setErrors(prev => ({ ...prev, nationality: '' }));
    }
  };

  // Handle custom nationality input
  const handleCustomNationalityChange = (e) => {
    const value = e.target.value;
    setCustomNationality(value);
    
    // Update form data with custom nationality
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        nationality: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        nationality: 'أخرى'
      }));
    }
    
    // Clear error if exists
    if (errors.nationality) {
      setErrors(prev => ({ ...prev, nationality: '' }));
    }
  };

  // Reset form when modal is shown/hidden
  useEffect(() => {
    if (show) {
      if (mode === 'edit' && initialMemberData) {
        const initialNationality = initialMemberData.nationality || 'تونسية';
        const isCustomNationality = !nationalities.includes(initialNationality);
        
        setFormData({
          ...initialMemberData,
          nationality: isCustomNationality ? 'أخرى' : initialNationality,
          birthDate: initialMemberData.birthDate?.split('T')[0] || '',
          dateOfMembership: initialMemberData.dateOfMembership?.split('T')[0] || ''
        });
        
        if (isCustomNationality) {
          setCustomNationality(initialNationality);
        } else {
          setCustomNationality('');
        }
      } else {
        setFormData({
          name: '',
          lastname: '',
          cin: '',
          numcard: '',
          address: '',
          nationality: 'تونسية', // Reset to default
          birthDate: '',
          work: '',
          tel: '',
          dateOfMembership: '',
          isVolunteering: false,
          volunteerField: '',
          memberType: 'عضو عادي'
        });
        setCustomNationality('');
      }
      setErrors({});
      setApiError(null);
      setShowNationalityDropdown(false);
    }
  }, [show, mode, initialMemberData]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'memberType' && value === 'تلميذ' ? { work: 'تلميذ' } : {})
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate CIN field
  const validateCIN = async (cin) => {
    if (!/^[01][0-9]{7}$/.test(cin)) {
      return 'رقم بطاقة التعريف يجب أن يكون مكونًا من 8 أرقام ويبدأ بـ 0 أو 1';
    }
    
    if (mode === 'add') {
      const isUnique = await checkCINUnique(cin);
      if (!isUnique) {
        return 'رقم بطاقة التعريف مستخدم مسبقًا';
      }
    }
    
    return '';
  };

  const validateDateOfMembership = (date) => {
    if (!date) return 'هذا الحقل مطلوب';
    
    const selectedDate = new Date(date);
    const minDate = new Date('2010-01-01');
    
    if (selectedDate < minDate) {
      return 'تاريخ الانضمام لا يمكن أن يكون قبل سنة 2010';
    }
    
    return '';
  };

  // Validate the entire form
  const validateForm = async () => {
    const newErrors = {};

    // Required fields validation
    const requiredFields = [
      'name', 'lastname', 'cin', 'numcard', 
      'address', 'nationality', 'tel', 'dateOfMembership'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'هذا الحقل مطلوب';
      }
    });

    // Special validation for "أخرى" nationality
    if (formData.nationality === 'أخرى' && !customNationality.trim()) {
      newErrors.nationality = 'يرجى إدخال الجنسية';
    }

    // CIN validation
    if (formData.cin) {
      const cinError = await validateCIN(formData.cin);
      if (cinError) newErrors.cin = cinError;
    }

    // Date of membership validation
    if (formData.dateOfMembership) {
      const dateError = validateDateOfMembership(formData.dateOfMembership);
      if (dateError) newErrors.dateOfMembership = dateError;
    }

    // Volunteer field validation
    if (formData.isVolunteering && !formData.volunteerField) {
      newErrors.volunteerField = 'يجب اختيار ميدان التطوع';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError(null);

    const isValid = await validateForm();
    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        // If "أخرى" is selected and custom nationality is provided, use the custom value
        nationality: formData.nationality === 'أخرى' && customNationality.trim() 
          ? customNationality.trim() 
          : formData.nationality
      };

      await onSubmit(submissionData);
      onHide();
    } catch (error) {
      setApiError(error.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {mode === 'add' ? 'إضافة عضو جديد' : 'تعديل بيانات العضو'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {apiError && (
            <Alert variant="danger" dismissible onClose={() => setApiError(null)}>
              {apiError}
            </Alert>
          )}

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formMemberType">
                <Form.Label>نوع العضو</Form.Label>
                <Form.Select
                  name="memberType"
                  value={formData.memberType}
                  onChange={handleChange}
                  isInvalid={!!errors.memberType}
                >
                  <option value="عضو عادي">عضو عادي</option>
                  <option value="طالب">طالب</option>
                  <option value="تلميذ">تلميذ</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.memberType}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formCin">
                <Form.Label>
                  رقم بطاقة تعريف
                  <OverlayTrigger trigger="hover" placement="top" overlay={cinPopover}>
                    <i className="bi bi-info-circle ms-2" style={{ cursor: 'pointer' }} />
                  </OverlayTrigger>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="cin"
                  value={formData.cin}
                  onChange={handleChange}
                  isInvalid={!!errors.cin}
                  maxLength={8}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.cin}
                </Form.Control.Feedback>
                {formData.memberType === 'تلميذ' && (
                  <small className="text-muted">تلميذ: M{formData.cin}</small>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formName">
                <Form.Label>الاسم</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formLastname">
                <Form.Label>اللقب</Form.Label>
                <Form.Control
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  isInvalid={!!errors.lastname}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.lastname}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formNumcard">
                <Form.Label>رقم بطاقة العضوية</Form.Label>
                <Form.Control
                  type="text"
                  name="numcard"
                  value={formData.numcard}
                  onChange={handleChange}
                  isInvalid={!!errors.numcard}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.numcard}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            {/* Updated Nationality Field */}
            <Col md={6}>
              <Form.Group controlId="formNationality">
                <Form.Label>الجنسية</Form.Label>
                <div className="position-relative">
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      value={formData.nationality === 'أخرى' && customNationality 
                        ? customNationality 
                        : formData.nationality}
                      readOnly
                      isInvalid={!!errors.nationality}
                      className="bg-light"
                    />
                    <Button 
                      variant={showNationalityDropdown ? "primary" : "outline-secondary"}
                      onClick={() => setShowNationalityDropdown(!showNationalityDropdown)}
                      className="ms-2"
                    >
                      تغيير
                    </Button>
                  </div>
                  
                  {showNationalityDropdown && (
                    <div 
                      className="position-absolute w-100 bg-white border mt-1 rounded shadow-sm z-3"
                      style={{ 
                        maxHeight: '200px', 
                        overflowY: 'auto',
                        zIndex: 9999 
                      }}
                    >
                      {nationalities.map((nationality, index) => (
                        <div
                          key={index}
                          className="p-2 border-bottom hover-bg-light"
                          onClick={() => handleNationalityChange(nationality)}
                          style={{ 
                            cursor: 'pointer',
                            backgroundColor: formData.nationality === nationality ? '#e9ecef' : 'white'
                          }}
                        >
                          {nationality}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Manual input field for "أخرى" */}
                {formData.nationality === 'أخرى' && (
                  <div className="mt-2">
                    <Form.Label>أدخل الجنسية</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="اكتب الجنسية هنا..."
                      value={customNationality}
                      onChange={handleCustomNationalityChange}
                      isInvalid={!!errors.nationality}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.nationality}
                    </Form.Control.Feedback>
                  </div>
                )}
                
                <Form.Control.Feedback type="invalid">
                  {errors.nationality}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formBirthDate">
                <Form.Label>تاريخ الميلاد</Form.Label>
                <Form.Control
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formDateOfMembership">
                <Form.Label>تاريخ الانضمام</Form.Label>
                <Form.Control
                  type="date"
                  name="dateOfMembership"
                  value={formData.dateOfMembership}
                  onChange={handleChange}
                  isInvalid={!!errors.dateOfMembership}
                  max={new Date().toISOString().split('T')[0]}
                  min="2010-01-01"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.dateOfMembership}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formWork">
                <Form.Label>الوظيفة</Form.Label>
                <Form.Control
                  type="text"
                  name="work"
                  value={formData.work}
                  onChange={handleChange}
                  disabled={formData.memberType === 'تلميذ'}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formTel">
                <Form.Label>رقم الهاتف</Form.Label>
                <Form.Control
                  type="tel"
                  name="tel"
                  value={formData.tel}
                  onChange={handleChange}
                  isInvalid={!!errors.tel}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.tel}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>العنوان</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="address"
              value={formData.address}
              onChange={handleChange}
              isInvalid={!!errors.address}
            />
            <Form.Control.Feedback type="invalid">
              {errors.address}
            </Form.Control.Feedback>
          </Form.Group>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formIsVolunteering">
                <Form.Check
                  type="checkbox"
                  label="متطوع"
                  name="isVolunteering"
                  checked={formData.isVolunteering}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            {formData.isVolunteering && (
              <Col md={6}>
                <Form.Group controlId="formVolunteerField">
                  <Form.Label>لجنة التطوع</Form.Label>
                  <Form.Select
                    name="volunteerField"
                    value={formData.volunteerField}
                    onChange={handleChange}
                    isInvalid={!!errors.volunteerField}
                  >
                    <option value="">اختر اللجنة</option>
                    {volunteerOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.volunteerField}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" size="sm" animation="border" role="status" />
                <span className="ms-2">جاري الحفظ...</span>
              </>
            ) : (
              mode === 'add' ? 'إضافة' : 'حفظ التغييرات'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MemberFormModal;

