import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Offcanvas, Stack, Badge } from 'react-bootstrap';
import { FaFilter, FaSearch, FaSync, FaCalendarAlt, FaIdCard, FaUser, FaPhone, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';

const MembersFilter = ({ 
  filters, 
  onApply, 
  onReset,
  availableYears = [],
  loading = false 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Initialize local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleInputChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    setShowFilters(false);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      membershipYear: '',
      volunteerField: '',
      memberType: '',
      nationality: '',
      minAge: '',
      maxAge: '',
      hasPhone: '',
      hasCardNumber: '',
      membershipStatus: '',
      city: ''
    };
    setLocalFilters(resetFilters);
    onReset();
    setShowFilters(false);
  };

  const removeFilter = (filterKey) => {
    const newFilters = { ...localFilters, [filterKey]: '' };
    setLocalFilters(newFilters);
    onApply(newFilters);
  };

  const hasActiveFilters = Object.values(filters).some(filter => 
    filter !== '' && filter !== null && filter !== undefined
  );

  // Volunteer field options
  const volunteerFieldOptions = [
    { value: '', label: 'جميع اللجان' },
    { value: 'لجنة الشباب', label: 'لجنة الشباب' },
    { value: 'لجنة الاسرة', label: 'لجنة الاسرة' },
    { value: 'لجنة الصحة', label: 'لجنة الصحة' },
    { value: 'لجنة التنمية', label: 'لجنة التنمية' },
    { value: 'لجنة الكفالة', label: 'لجنة الكفالة' },
    { value: 'لجنة التخطيط و الدراسات', label: 'لجنة التخطيط و الدراسات' }
  ];

  // Member type options
  const memberTypeOptions = [
    { value: '', label: 'جميع الأنواع' },
    { value: 'عضو عادي', label: 'عضو عادي' },
    { value: 'طالب', label: 'طالب' },
    { value: 'تلميذ', label: 'تلميذ' }
  ];

  // Membership status options
  const membershipStatusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' }
  ];

  // Common nationalities
  const nationalityOptions = [
    { value: '', label: 'جميع الجنسيات' },
    { value: 'تونسية', label: 'تونسية' },
    { value: 'جزائرية', label: 'جزائرية' },
    { value: 'ليبية', label: 'ليبية' },
    { value: 'مغربية', label: 'مغربية' },
    { value: 'مصرية', label: 'مصرية' }
  ];

  // Common cities
  const cityOptions = [
    { value: '', label: 'جميع المدن' },
    { value: 'تونس', label: 'تونس' },
    { value: 'صفاقس', label: 'صفاقس' },
    { value: 'سوسة', label: 'سوسة' },
    { value: 'نابل', label: 'نابل' },
    { value: 'بنزرت', label: 'بنزرت' },
    { value: 'قابس', label: 'قابس' },
    { value: 'قفصة', label: 'قفصة' },
    { value: 'القيروان', label: 'القيروان' }
  ];

  const getFilterLabel = (key, value) => {
    const labels = {
      membershipYear: `سنة: ${value}`,
      volunteerField: `لجنة: ${volunteerFieldOptions.find(opt => opt.value === value)?.label || value}`,
      memberType: `نوع: ${memberTypeOptions.find(opt => opt.value === value)?.label || value}`,
      nationality: `جنسية: ${value}`,
      minAge: `عمر من: ${value}`,
      maxAge: `عمر إلى: ${value}`,
      hasPhone: value === 'yes' ? 'له هاتف' : value === 'no' ? 'ليس له هاتف' : '',
      hasCardNumber: value === 'yes' ? 'له رقم بطاقة' : value === 'no' ? 'ليس له رقم بطاقة' : '',
      membershipStatus: value === 'active' ? 'نشط' : value === 'inactive' ? 'غير نشط' : '',
      city: `مدينة: ${value}`
    };
    return labels[key] || `${key}: ${value}`;
  };

  return (
    <>
      {/* Filter Button with Badge */}
      <Button 
        variant={hasActiveFilters ? "primary" : "outline-primary"}
        onClick={() => setShowFilters(true)}
        disabled={loading}
        className="d-flex align-items-center"
      >
        <FaFilter className="me-1" />
        تصفية
        {hasActiveFilters && (
          <Badge bg="light" text="dark" className="ms-1">
            {Object.values(filters).filter(f => f !== '').length}
          </Badge>
        )}
      </Button>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-2">
          <small className="text-muted d-block mb-1">التصفيات النشطة:</small>
          <div className="d-flex flex-wrap gap-1">
            {filters.search && (
              <Badge bg="primary" className="d-flex align-items-center">
                بحث: {filters.search}
                <FaTimes 
                  className="ms-1" 
                  size={10}
                  onClick={() => removeFilter('search')}
                  style={{ cursor: 'pointer' }}
                />
              </Badge>
            )}
            {Object.entries(filters).map(([key, value]) => {
              if (value && key !== 'search') {
                return (
                  <Badge 
                    key={key} 
                    bg="secondary" 
                    className="d-flex align-items-center"
                  >
                    {getFilterLabel(key, value)}
                    <FaTimes 
                      className="ms-1" 
                      size={10}
                      onClick={() => removeFilter(key)}
                      style={{ cursor: 'pointer' }}
                    />
                  </Badge>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Filters Offcanvas */}
      <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="end" style={{ width: '450px' }}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="d-flex align-items-center">
            <FaFilter className="me-2 text-primary" />
            تصفية الأعضاء
          </Offcanvas.Title>
        </Offcanvas.Header>
        
        <Offcanvas.Body>
          <div className="d-flex flex-column h-100">
            {/* Search Filter */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                <FaSearch className="me-2" />
                بحث بالأعضاء
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="ابحث بالاسم، اللقب، العنوان، الجنسية..."
                value={localFilters.search || ''}
                onChange={(e) => handleInputChange('search', e.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Row className="g-3">
              {/* Membership Year Filter */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <FaCalendarAlt className="me-1" />
                    سنة الانضمام أو التجديد
                  </Form.Label>
                  <Form.Select 
                    value={localFilters.membershipYear || ''}
                    onChange={(e) => handleInputChange('membershipYear', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">جميع السنوات</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    يشمل الأعضاء الذين انضموا أو جددوا عضويتهم في هذه السنة
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Volunteer Field Filter */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <FaUser className="me-1" />
                    مجال التطوع
                  </Form.Label>
                  <Form.Select 
                    value={localFilters.volunteerField || ''}
                    onChange={(e) => handleInputChange('volunteerField', e.target.value)}
                    disabled={loading}
                  >
                    {volunteerFieldOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Member Type Filter */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">نوع العضو</Form.Label>
                  <Form.Select 
                    value={localFilters.memberType || ''}
                    onChange={(e) => handleInputChange('memberType', e.target.value)}
                    disabled={loading}
                  >
                    {memberTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Nationality Filter */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">الجنسية</Form.Label>
                  <Form.Select 
                    value={localFilters.nationality || ''}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    disabled={loading}
                  >
                    {nationalityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* City Filter */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <FaMapMarkerAlt className="me-1" />
                    المدينة
                  </Form.Label>
                  <Form.Select 
                    value={localFilters.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={loading}
                  >
                    {cityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Age Range */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">العمر من</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="18"
                    value={localFilters.minAge || ''}
                    onChange={(e) => handleInputChange('minAge', e.target.value)}
                    disabled={loading}
                    min="0"
                    max="120"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">العمر إلى</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="65"
                    value={localFilters.maxAge || ''}
                    onChange={(e) => handleInputChange('maxAge', e.target.value)}
                    disabled={loading}
                    min="0"
                    max="120"
                  />
                </Form.Group>
              </Col>

              {/* Phone Availability */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <FaPhone className="me-1" />
                    وجود الهاتف
                  </Form.Label>
                  <Form.Select 
                    value={localFilters.hasPhone || ''}
                    onChange={(e) => handleInputChange('hasPhone', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">الكل</option>
                    <option value="yes">له هاتف</option>
                    <option value="no">ليس له هاتف</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Card Number Availability */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <FaIdCard className="me-1" />
                    وجود رقم البطاقة
                  </Form.Label>
                  <Form.Select 
                    value={localFilters.hasCardNumber || ''}
                    onChange={(e) => handleInputChange('hasCardNumber', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">الكل</option>
                    <option value="yes">له رقم بطاقة</option>
                    <option value="no">ليس له رقم بطاقة</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Membership Status */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">حالة العضوية</Form.Label>
                  <Form.Select 
                    value={localFilters.membershipStatus || ''}
                    onChange={(e) => handleInputChange('membershipStatus', e.target.value)}
                    disabled={loading}
                  >
                    {membershipStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Action Buttons */}
            <div className="mt-auto pt-3 border-top">
              <Stack direction="horizontal" gap={2} className="justify-content-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={handleReset}
                  disabled={loading}
                  className="d-flex align-items-center"
                >
                  <FaSync className="me-1" />
                  إعادة تعيين
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleApply}
                  disabled={loading}
                >
                  تطبيق التصفيات
                </Button>
              </Stack>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default MembersFilter;