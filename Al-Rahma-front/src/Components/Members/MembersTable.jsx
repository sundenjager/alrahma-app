import React, { useState, useEffect, useCallback } from 'react';
import { ButtonGroup, Table, Form, Button, Modal, Spinner, Alert, Card, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPrint, FaUser, FaCalendarAlt, FaIdCard, FaPhone, FaFilter } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import SearchBar from '../SearchBar';
import DataCounter from '../DataCounter';
import Pagination from '../Pagination';
import { apiClient } from '../../config/api';
import { fetchMembers, updateMember, deleteMember } from '../../services/memberService';
import { getMembershipHistory, addMembershipUpdate, updateMembershipRecord, deleteMembershipRecord } from '../../services/membershipHistoryService';
import './MembersTable.css'; 
import ExportToExcel from '../ExportToExcel';
import MembersFilter from './MembersFilter';

const MembersTable = ({ members: propMembers, onDelete, onUpdate }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Edit state
  const [editableMemberId, setEditableMemberId] = useState(null);
  const [updatedMemberData, setUpdatedMemberData] = useState({});
  
  // Modal states
  const [selectedMember, setSelectedMember] = useState(null);
  const [showUpdateDatesModal, setShowUpdateDatesModal] = useState(false);
  const [newUpdateDate, setNewUpdateDate] = useState('');
  const [dateError, setDateError] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editingHistory, setEditingHistory] = useState(null);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState(null);
  const [showDeleteHistoryConfirm, setShowDeleteHistoryConfirm] = useState(false);
  
  // Add state for card number in update form
  const [updatedMemberCard, setUpdatedMemberCard] = useState({ cardNumber: '' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Filters
  const [filters, setFilters] = useState({
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
  });
  
  const [availableYears, setAvailableYears] = useState([]);

  // ============================================================================
  // OPTIONS
  // ============================================================================
  const volunteerFieldOptions = [
    { value: '', label: 'اختر اللجنة' },
    { value: 'لجنة الشباب', label: 'لجنة الشباب' },
    { value: 'لجنة الاسرة', label: 'لجنة الاسرة' },
    { value: 'لجنة الصحة', label: 'لجنة الصحة' },
    { value: 'لجنة التنمية', label: 'لجنة التنمية' },
    { value: 'لجنة الكفالة', label: 'لجنة الكفالة' },
    { value: 'لجنة التخطيط و الدراسات', label: 'لجنة التخطيط و الدراسات' }
  ];

  const memberTypeOptions = [
    { value: 'عضو عادي', label: 'عضو عادي' },
    { value: 'طالب', label: 'طالب' },
    { value: 'تلميذ', label: 'تلميذ' }
  ];

  // ============================================================================
  // HELPER FUNCTIONS - Simple, reusable, testable
  // ============================================================================
  
  // Get all years a member was active (joined OR renewed)
  const getMemberActiveYears = (member) => {
    if (!member) return [];
    
    const years = new Set();
    
    // Add join year
    if (member.dateOfMembership) {
      const joinDate = new Date(member.dateOfMembership);
      if (!isNaN(joinDate.getTime())) {
        years.add(joinDate.getFullYear());
      }
    }
    
    // Add renewal years
    if (member.updateDates && Array.isArray(member.updateDates)) {
      member.updateDates.forEach(dateValue => {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear());
        }
      });
    }
    
    return Array.from(years).sort((a, b) => b - a);
  };
  
  // Check if member was active in a specific year
  const wasMemberActiveInYear = (member, year) => {
    return getMemberActiveYears(member).includes(year);
  };
  
  // Get most recent activity date
  const getMostRecentDate = (member) => {
    if (!member) return null;
    
    const dates = [];
    
    if (member.dateOfMembership) {
      const d = new Date(member.dateOfMembership);
      if (!isNaN(d.getTime())) dates.push(d);
    }
    
    if (member.updateDates && Array.isArray(member.updateDates)) {
      member.updateDates.forEach(dateValue => {
        const d = new Date(dateValue);
        if (!isNaN(d.getTime())) dates.push(d);
      });
    }
    
    return dates.length > 0 ? new Date(Math.max(...dates)) : null;
  };
  
  // Calculate age as a number
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Check if history record is the oldest (initial membership)
  const isOldestRecord = (historyRecord, allHistories) => {
    if (!allHistories || allHistories.length === 0 || !historyRecord) return false;
    
    // Sort by date ascending to find the oldest
    const sortedHistories = [...allHistories].sort((a, b) => 
      new Date(a.updateDate) - new Date(b.updateDate)
    );
    
    const oldestRecord = sortedHistories[0];
    return oldestRecord && oldestRecord.id === historyRecord.id;
  };

  // ============================================================================
  // DATA LOADING
  // ============================================================================
  
  // Load members
  useEffect(() => {
    const loadData = async () => {
      if (propMembers) {
        setMembers(propMembers);
        setFilteredMembers(propMembers);
        setLoading(false);
      } else {
        try {
          const data = await fetchMembers();
          

          
          setMembers(data);
          setFilteredMembers(data);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [propMembers]);
  
  // Load available years
  useEffect(() => {
    const loadYears = async () => {
      try {
        const response = await apiClient.get('/members/available-years');
        setAvailableYears(response.data);
      } catch (error) {
        console.error('Error loading years:', error);
      }
    };
    loadYears();
  }, []);

  // ============================================================================
  // FILTERING LOGIC
  // ============================================================================
  
  useEffect(() => {
    let result = [...members];
    

    
    // Text search
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(m =>
        ['name', 'lastname', 'address', 'nationality', 'work', 'cin', 'numcard'].some(
          field => m[field]?.toString().toLowerCase().includes(query)
        )
      );
    }
    
    // Year filter - THE KEY FIX
    if (filters.membershipYear) {
      const year = Number(filters.membershipYear);
      result = result.filter(m => wasMemberActiveInYear(m, year));
      

    }
    
    // Committee filter
    if (filters.volunteerField) {
      result = result.filter(m => m.volunteerField === filters.volunteerField);
    }
    
    // Member type
    if (filters.memberType) {
      result = result.filter(m => m.memberType === filters.memberType);
    }
    
    // Nationality
    if (filters.nationality) {
      result = result.filter(m => m.nationality === filters.nationality);
    }
    
    // City
    if (filters.city) {
      result = result.filter(m => m.address?.includes(filters.city));
    }
    
    // Age range
    if (filters.minAge || filters.maxAge) {
      result = result.filter(m => {
        const age = calculateAge(m.birthDate);
        if (age === null) return false;
        if (filters.minAge && age < parseInt(filters.minAge)) return false;
        if (filters.maxAge && age > parseInt(filters.maxAge)) return false;
        return true;
      });
    }
    
    // Phone availability
    if (filters.hasPhone) {
      result = result.filter(m => 
        filters.hasPhone === 'yes' ? !!m.tel : !m.tel
      );
    }
    
    // Card number availability
    if (filters.hasCardNumber) {
      result = result.filter(m => 
        filters.hasCardNumber === 'yes' ? !!m.numcard : !m.numcard
      );
    }
    
    // Membership status
    if (filters.membershipStatus) {
      result = result.filter(m => {
        const hasRenewals = m.updateDates?.length > 0;
        return filters.membershipStatus === 'active' ? hasRenewals : !hasRenewals;
      });
    }
    
    setFilteredMembers(result);
    setCurrentPage(1);
  }, [filters, members]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  const handleSearch = useCallback((query) => {
    setFilters(prev => ({ ...prev, search: query }));
  }, []);
  
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };
  
  const resetFilters = () => {
    setFilters({
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
    });
  };
  
  const handleEdit = (member) => {
    setEditableMemberId(member.id);
    setUpdatedMemberData({ 
      ...member,
      birthDate: member.birthDate ? member.birthDate.split('T')[0] : '',
      dateOfMembership: member.dateOfMembership ? member.dateOfMembership.split('T')[0] : ''
    });
  };
  
  const handleSave = async () => {
    try {
      const updated = await updateMember(updatedMemberData.id, updatedMemberData);
      const newMembers = members.map(m => m.id === updated.id ? updated : m);
      
      setMembers(newMembers);
      setFilteredMembers(newMembers);
      if (onUpdate) onUpdate(newMembers);
      
      setEditableMemberId(null);
      setSuccessMessage('تم تحديث العضو بنجاح');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    setUpdatedMemberData({
      ...updatedMemberData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setUpdatedMemberData({
      ...updatedMemberData,
      [name]: value,
      ...(name === 'volunteerField' && {
        isVolunteering: !!value
      })
    });
  };
  
  const handleShowUpdateDates = async (member) => {
    try {
      setLoading(true);
      const history = await getMembershipHistory(member.id);
      
      setSelectedMember({
        ...member,
        membershipHistories: history, // Store full history objects with card numbers
        updateDates: history.map(entry => entry.updateDate)
      });
      setShowUpdateDatesModal(true);
    } catch (error) {
      console.error('Error fetching membership history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddUpdateDate = async () => {
    try {
      setError(null);
      setDateError(null);
      setLoading(true);

      if (!newUpdateDate) {
        throw new Error("يرجى اختيار تاريخ التحديث");
      }

      const selectedDate = new Date(newUpdateDate);
      const today = new Date();
      
      if (selectedDate > today) {
        throw new Error("لا يمكن إضافة تاريخ في المستقبل");
      }

      const mostRecentDate = getMostRecentDate(selectedMember);
      if (mostRecentDate && selectedDate < mostRecentDate) {
        throw new Error(`تاريخ التحديث الجديد يجب أن يكون بعد آخر تاريخ (${mostRecentDate.toLocaleDateString()})`);
      }

      if (!selectedMember.numcard && !updatedMemberCard.cardNumber) {
        throw new Error("يرجى إدخال رقم البطاقة");
      }

      const cardNumber = updatedMemberCard.cardNumber || selectedMember.numcard;

      await addMembershipUpdate(selectedMember.id, newUpdateDate, cardNumber);

      // Refresh the history after adding new date
      const refreshedHistory = await getMembershipHistory(selectedMember.id);
      setSelectedMember(prev => ({
        ...prev,
        numcard: cardNumber,
        updateDates: refreshedHistory.map(h => h.updateDate),
        membershipHistories: refreshedHistory
      }));

      // Update main members list
      const updatedMembers = members.map(m => 
        m.id === selectedMember.id 
          ? { 
              ...m, 
              numcard: cardNumber,
              updateDates: refreshedHistory.map(h => h.updateDate)
            }
          : m
      );

      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
      
      // Reset form
      setNewUpdateDate('');
      setUpdatedMemberCard({ cardNumber: '' });
      setSuccessMessage('تم إضافة تجديد العضوية بنجاح');
    } catch (error) {
      setDateError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!memberToDelete?.id) {
      setError('No member selected');
      setShowDeleteConfirm(false);
      return;
    }
  
    try {
      setLoading(true);
      await deleteMember(memberToDelete.id);
      
      const updated = members.filter(m => m.id !== memberToDelete.id);
      setMembers(updated);
      setFilteredMembers(updated);
      
      setSuccessMessage(`تم حذف العضو ${memberToDelete.name} بنجاح`);
    } catch (error) {
      setError(`خطأ في الحذف: ${error.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
    }
  };

  const handleEditHistory = (historyRecord) => {
    setEditingHistory({
      ...historyRecord,
      updateDate: historyRecord.updateDate.split('T')[0] // Format for date input
    });
    setShowEditHistoryModal(true);
  };

  const handleUpdateHistory = async () => {
    try {
      setLoading(true);
      setDateError(null);

      // Check if this is the oldest record (client-side validation)
      const isOldest = isOldestRecord(editingHistory, selectedMember.membershipHistories);
      if (isOldest) {
        throw new Error("لا يمكن تعديل سجل الانضمام الأساسي. هذا التاريخ يمثل تاريخ انضمام العضو الأساسي.");
      }

      const updatedHistory = await updateMembershipRecord(
        editingHistory.id,
        {
          memberId: selectedMember.id,
          updateDate: editingHistory.updateDate,
          cardNumber: editingHistory.cardNumber
        }
      );

      // Refresh the history
      const refreshedHistory = await getMembershipHistory(selectedMember.id);
      setSelectedMember(prev => ({
        ...prev,
        updateDates: refreshedHistory.map(h => h.updateDate),
        membershipHistories: refreshedHistory
      }));

      setShowEditHistoryModal(false);
      setEditingHistory(null);
      setSuccessMessage('تم تحديث سجل العضوية بنجاح');
    } catch (error) {
      setDateError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!historyToDelete) return;

    try {
      setLoading(true);

      // Check if this is the oldest record (client-side validation)
      const isOldest = isOldestRecord(historyToDelete, selectedMember.membershipHistories);
      if (isOldest) {
        throw new Error("لا يمكن حذف سجل الانضمام الأساسي. هذا التاريخ يمثل تاريخ انضمام العضو الأساسي.");
      }

      await deleteMembershipRecord(historyToDelete.id);

      // Refresh the history
      const refreshedHistory = await getMembershipHistory(selectedMember.id);
      setSelectedMember(prev => ({
        ...prev,
        updateDates: refreshedHistory.map(h => h.updateDate),
        membershipHistories: refreshedHistory
      }));

      setShowDeleteHistoryConfirm(false);
      setHistoryToDelete(null);
      setSuccessMessage('تم حذف سجل العضوية بنجاح');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EXPORT DATA
  // ============================================================================
  
  const getExportData = () => {
    return filteredMembers.map(member => ({
      'الاسم': member.name || '',
      'اللقب': member.lastname || '',
      'رقم التعريف': member.cin || '',
      'رقم الانخراط': member.numcard || '',
      'العنوان': member.address || '',
      'الجنسية': member.nationality || '',
      'تاريخ الميلاد': member.birthDate ? new Date(member.birthDate).toLocaleDateString('ar-TN') : '',
      'العمر': calculateAge(member.birthDate) || '',
      'العمل': member.work || '',
      'الهاتف': member.tel || '',
      'تاريخ الانضمام': member.dateOfMembership ? new Date(member.dateOfMembership).toLocaleDateString('ar-TN') : '',
      'التطوع': member.volunteerField || '',
      'النوع': member.memberType || '',
      'السنوات النشطة': getMemberActiveYears(member).join(', '),
      'عدد التجديدات': member.updateDates?.length || 0,
      'آخر نشاط': getMostRecentDate(member)?.toLocaleDateString('ar-TN') || ''
    }));
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const renderEditableField = (fieldName, value, member, type = 'text') => {
    if (editableMemberId !== member.id) {
      if (fieldName === 'birthDate' || fieldName === 'dateOfMembership') {
        return value ? new Date(value).toLocaleDateString() : '-';
      }
      return value || '-';
    }
    
    if (type === 'select-volunteer') {
      return (
        <Form.Select
          name="volunteerField"
          value={updatedMemberData.volunteerField || ''}
          onChange={handleSelectChange}
          className="form-select-sm"
        >
          {volunteerFieldOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      );
    }
    
    if (type === 'select-memberType') {
      return (
        <Form.Select
          name="memberType"
          value={updatedMemberData.memberType || ''}
          onChange={handleSelectChange}
          className="form-select-sm"
        >
          {memberTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      );
    }
    
    return (
      <Form.Control
        type={type}
        name={fieldName}
        value={updatedMemberData[fieldName] || ''}
        onChange={handleChange}
        max={type === 'date' && fieldName === 'birthDate' ? new Date().toISOString().split('T')[0] : undefined}
        className="form-control-sm"
      />
    );
  };
  
  const PhoneLink = ({ phoneNumber }) => {
    if (!phoneNumber) return '-';
    return (
      <div className="d-flex align-items-center">
        <span className="me-2">{phoneNumber}</span>
        <a href={`tel:${phoneNumber}`} className="btn btn-sm btn-outline-success d-flex align-items-center p-1">
          <FaPhone />
        </a>
      </div>
    );
  };
  
  const renderAgeBadge = (birthDate) => {
    const age = calculateAge(birthDate);
    if (age === null) return <Badge bg="secondary">غير محدد</Badge>;
    
    let variant = 'info';
    if (age < 18) variant = 'success';
    if (age > 60) variant = 'warning';
    
    return <Badge bg={variant}>{age}</Badge>;
  };

  // ============================================================================
  // PAGINATION
  // ============================================================================
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);
  
  const hasActiveFilters = Object.values(filters).some(f => f !== '');

  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">جاري تحميل بيانات الأعضاء...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center mt-5">
        <Alert.Heading>حدث خطأ!</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={() => setError(null)}>حاول مرة أخرى</Button>
      </Alert>
    );
  }

  return (
    <div className="members-table-container">
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
          <FaUser className="me-2" />
          {successMessage}
        </Alert>
      )}

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">
              <FaUser className="me-2 text-primary" />
              سجل الأعضاء
            </h4>
            <div className="d-flex gap-2">
              <ExportToExcel 
                data={getExportData()} 
                filename="الأعضاء"
                buttonText="Excel"
                buttonProps={{ size: "sm", variant: "outline-success" }}
              />

              
              <Link to="/membership-update-list">
                <Button variant="outline-secondary" size="sm">الأعضاء غير المجددين</Button>
              </Link>
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-8">
              <SearchBar
                searchFields={['name', 'lastname', 'numcard', 'address', 'nationality', 'work', 'cin']}
                onSearch={handleSearch}
                placeholder="ابحث بالأعضاء..."
              />
            </div>
            <div className="col-md-4 d-flex align-items-center justify-content-end gap-2">
              <MembersFilter 
                filters={filters}
                onApply={applyFilters}
                onReset={resetFilters}
                availableYears={availableYears}
                loading={loading}
              />
              <DataCounter count={filteredMembers.length} label="عضو" />
            </div>
          </div>

          {hasActiveFilters && (
            <Alert variant="info" className="d-flex justify-content-between align-items-center mt-3 mb-0">
              <div className="d-flex align-items-center">
                <FaFilter className="me-2" />
                <span>التصفيات مفعلة - عرض {filteredMembers.length} نتيجة</span>
              </div>
              <Button variant="outline-info" size="sm" onClick={resetFilters}>
                إلغاء جميع التصفيات
              </Button>
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th width="50">#</th>
                  <th>الاسم</th>
                  <th>اللقب</th>
                  <th><FaIdCard className="me-1" /> رقم بطاقة التعريف</th>
                  <th>رقم الانخراط</th>
                  <th>العنوان</th>
                  <th>الجنسية</th>
                  <th>تاريخ الميلاد</th>
                  <th>العمر</th>
                  <th>العمل</th>
                  <th>الهاتف</th>
                  <th>تاريخ الانضمام</th>
                  <th>التطوع</th>
                  <th>النوع</th>
                  <th width="150">التجديد</th>
                  <th width="150">العمليات</th>
                </tr>
              </thead>
              <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((member, index) => (
                  <tr key={member.id}>
                    <td data-label="#">{indexOfFirstItem + index + 1}</td>
                    <td data-label="الاسم" className="fw-semibold">{renderEditableField('name', member.name, member)}</td>
                    <td data-label="اللقب">{renderEditableField('lastname', member.lastname, member)}</td>
                    <td data-label="رقم بطاقة التعريف">{renderEditableField('cin', member.cin, member)}</td>
                    <td data-label="رقم الانخراط">{renderEditableField('numcard', member.numcard, member)}</td>
                    <td data-label="العنوان">{renderEditableField('address', member.address, member)}</td>
                    <td data-label="الجنسية">{renderEditableField('nationality', member.nationality, member)}</td>
                    <td data-label="تاريخ الميلاد">{renderEditableField('birthDate', member.birthDate, member, 'date')}</td>
                    <td data-label="العمر" className="text-center">{renderAgeBadge(member.birthDate)}</td>
                    <td data-label="العمل">{renderEditableField('work', member.work, member)}</td>
                    <td data-label="الهاتف">
                      {editableMemberId === member.id ? (
                        <Form.Control
                          type="tel"
                          name="tel"
                          value={updatedMemberData.tel || ''}
                          onChange={handleChange}
                          className="form-control-sm"
                        />
                      ) : (
                        <PhoneLink phoneNumber={member.tel} />
                      )}
                    </td>
                    <td data-label="تاريخ الانضمام">{renderEditableField('dateOfMembership', member.dateOfMembership, member, 'date')}</td>
                    <td data-label="التطوع">{renderEditableField('volunteerField', member.volunteerField, member, 'select-volunteer')}</td>
                    <td data-label="النوع">{renderEditableField('memberType', member.memberType, member, 'select-memberType')}</td>
                    <td data-label="التجديد">
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="w-100"
                        onClick={() => handleShowUpdateDates(member)}
                      >
                        <FaCalendarAlt className="me-1" />
                        التواريخ ({member.updateDates?.length || 0})
                      </Button>
                    </td>
                    <td data-label="العمليات">
                      {editableMemberId === member.id ? (
                        <ButtonGroup size="sm" className="w-100">
                          <Button variant="success" onClick={handleSave}>حفظ</Button>
                          <Button variant="outline-secondary" onClick={() => setEditableMemberId(null)}>إلغاء</Button>
                        </ButtonGroup>
                      ) : (
                        <ButtonGroup size="sm" className="w-100">
                          <Button variant="outline-primary" onClick={() => handleEdit(member)} title="تعديل">
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" onClick={() => {
                            setMemberToDelete(member);
                            setShowDeleteConfirm(true);
                          }} title="حذف">
                            <FaTrash />
                          </Button>
                        </ButtonGroup>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="16" className="text-center py-4 text-muted">
                    {hasActiveFilters ? 'لا توجد نتائج تطابق معايير البحث' : 'لا توجد بيانات متاحة'}
                  </td>
                </tr>
              )}
            </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {filteredMembers.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            عرض {indexOfFirstItem + 1} إلى {Math.min(indexOfLastItem, filteredMembers.length)} من {filteredMembers.length} عضو
          </div>
          <Pagination
            totalItems={filteredMembers.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ============================================================================ */}
      {/* MODALS */}
      {/* ============================================================================ */}

      {/* Member Delete Confirmation Modal - THIS WAS MISSING */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="text-danger">
            <FaTrash className="me-2" />
            تأكيد حذف العضو
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-danger">
            <h5>هل أنت متأكد أنك تريد حذف العضو التالي؟</h5>
            <p className="fw-bold mb-1">{memberToDelete?.name} {memberToDelete?.lastname}</p>
            <p className="text-muted">رقم البطاقة: {memberToDelete?.numcard}</p>
            <p className="mb-0"><strong>تنبيه:</strong> هذا الإجراء لا يمكن التراجع عنه!</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteConfirm(false)}>إلغاء</Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>نعم، احذف العضو</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete History Confirmation Modal */}
      <Modal show={showDeleteHistoryConfirm} onHide={() => setShowDeleteHistoryConfirm(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaTrash className="me-2" />
            تأكيد حذف سجل العضوية
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {historyToDelete && isOldestRecord(historyToDelete, selectedMember?.membershipHistories) ? (
            <div className="alert alert-warning">
              <h5>⚠️ لا يمكن حذف سجل الانضمام الأساسي</h5>
              <p className="mb-0">
                هذا السجل يمثل تاريخ انضمام العضو الأساسي ولا يمكن حذفه للحفاظ على سجلات العضوية.
              </p>
            </div>
          ) : (
            <div className="alert alert-danger">
              <h5>هل أنت متأكد أنك تريد حذف سجل العضوية هذا؟</h5>
              <p className="fw-bold mb-1">
                التاريخ: {historyToDelete ? new Date(historyToDelete.updateDate).toLocaleDateString('ar-TN') : ''}
              </p>
              <p className="mb-0">
                رقم البطاقة: <code>{historyToDelete?.cardNumber}</code>
              </p>
              <p className="mb-0 mt-2"><strong>تنبيه:</strong> هذا الإجراء لا يمكن التراجع عنه!</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteHistoryConfirm(false)}>
            إلغاء
          </Button>
          {!isOldestRecord(historyToDelete, selectedMember?.membershipHistories) && (
            <Button variant="danger" onClick={handleDeleteHistory}>
              نعم، احذف السجل
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Update Dates Modal */}
      <Modal show={showUpdateDatesModal} onHide={() => {
        setShowUpdateDatesModal(false);
        setNewUpdateDate('');
        setUpdatedMemberCard({ cardNumber: '' });
        setDateError(null);
      }} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaCalendarAlt className="me-2" />
            سجل تجديدات العضوية
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">جاري تحميل بيانات العضو...</p>
            </div>
          ) : (
            <>
              <div className="member-info-card mb-4 p-3 bg-light rounded">
                <h4 className="mb-1">{selectedMember?.name} {selectedMember?.lastname}</h4>
                <div className="d-flex flex-wrap gap-3">
                  <div>
                    <span className="text-muted">رقم البطاقة:</span>{' '}
                    <span className="fw-bold">{selectedMember?.numcard}</span>
                  </div>
                  <div>
                    <span className="text-muted">تاريخ الانضمام:</span>{' '}
                    <span className="fw-bold">
                      {selectedMember?.dateOfMembership ? new Date(selectedMember.dateOfMembership).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">السنوات النشطة:</span>{' '}
                    <span className="fw-bold">{getMemberActiveYears(selectedMember || {}).join(', ')}</span>
                  </div>
                </div>
              </div>

              <Card className="mb-4">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">تواريخ التجديد السابقة</h5>
                  <Badge bg="primary">{selectedMember?.membershipHistories?.length || 0} تجديد</Badge>
                </Card.Header>
                <Card.Body>
                  {selectedMember?.membershipHistories?.length > 0 ? (
                    <div className="table-responsive">
                      <Table striped bordered hover size="sm" className="mb-0">
                        <thead>
                          <tr>
                            <th width="50">#</th>
                            <th>تاريخ التجديد</th>
                            <th>رقم البطاقة</th>
                            <th width="120">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMember.membershipHistories
                            .sort((a, b) => new Date(b.updateDate) - new Date(a.updateDate))
                            .map((history, index) => {
                              const d = new Date(history.updateDate);
                              const isOldest = isOldestRecord(history, selectedMember.membershipHistories);
                              
                              return (
                                <tr key={history.id} className={isOldest ? 'table-warning' : ''}>
                                  <td>
                                    {index + 1}
                                    {isOldest && (
                                      <Badge bg="secondary" className="ms-1" title="تاريخ الانضمام الأساسي">
                                        انضمام
                                      </Badge>
                                    )}
                                  </td>
                                  <td>
                                    <Badge bg={isOldest ? "warning" : "info"} className="me-2">
                                      {d.toLocaleDateString('ar-TN')}
                                    </Badge>
                                    <small className="text-muted">({d.getFullYear()})</small>
                                  </td>
                                  <td>
                                    <code>{history.cardNumber}</code>
                                  </td>
                                  <td>
                                    {isOldest ? (
                                      <div className="text-center text-muted">
                                        <small>سجل أساسي</small>
                                      </div>
                                    ) : (
                                      <ButtonGroup size="sm">
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => handleEditHistory(history)}
                                          title="تعديل"
                                        >
                                          <FaEdit />
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => {
                                            setHistoryToDelete(history);
                                            setShowDeleteHistoryConfirm(true);
                                          }}
                                          title="حذف"
                                        >
                                          <FaTrash />
                                        </Button>
                                      </ButtonGroup>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted">
                      لا توجد تواريخ تجديد سابقة
                    </div>
                  )}
                </Card.Body>
              </Card>

              <Card>
                <Card.Header className="bg-light">
                  <h5 className="mb-0">إضافة تجديد جديد</h5>
                </Card.Header>
                <Card.Body>
                  {dateError && (
                    <Alert variant="danger" className="mb-3">
                      {dateError}
                    </Alert>
                  )}
                  
                  <Form.Group className="mb-3">
                    <Form.Label>رقم البطاقة</Form.Label>
                    <Form.Control
                      type="text"
                      value={updatedMemberCard.cardNumber || selectedMember?.numcard || ''}
                      onChange={(e) => setUpdatedMemberCard({
                        cardNumber: e.target.value
                      })}
                      placeholder="أدخل رقم البطاقة الجديد"
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>تاريخ التجديد الجديد</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="date"
                        value={newUpdateDate}
                        onChange={(e) => {
                          setNewUpdateDate(e.target.value);
                          setDateError(null);
                        }}
                        max={new Date().toISOString().split('T')[0]}
                        min={(() => {
                          const mostRecentDate = getMostRecentDate(selectedMember);
                          return mostRecentDate ? mostRecentDate.toISOString().split('T')[0] : undefined;
                        })()}
                      />
                      <Button 
                        variant="primary" 
                        onClick={handleAddUpdateDate}
                        disabled={!newUpdateDate || loading}
                        className="flex-shrink-0"
                      >
                        {loading ? 'جاري الإضافة...' : 'إضافة التاريخ'}
                      </Button>
                    </div>
                    <Form.Text className="text-muted">
                      اختر تاريخ التجديد (لا يمكن أن يكون في المستقبل أو قبل آخر تاريخ)
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Edit History Modal */}
              <Modal show={showEditHistoryModal} onHide={() => {
                setShowEditHistoryModal(false);
                setEditingHistory(null);
                setDateError(null);
              }} centered>
                <Modal.Header closeButton className="bg-warning text-dark">
                  <Modal.Title>
                    <FaEdit className="me-2" />
                    تعديل سجل العضوية
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {editingHistory && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>رقم البطاقة</Form.Label>
                        <Form.Control
                          type="text"
                          value={editingHistory.cardNumber || ''}
                          onChange={(e) => setEditingHistory({
                            ...editingHistory,
                            cardNumber: e.target.value
                          })}
                          placeholder="أدخل رقم البطاقة"
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.Label>تاريخ التجديد</Form.Label>
                        <Form.Control
                          type="date"
                          value={editingHistory.updateDate}
                          onChange={(e) => {
                            setEditingHistory({
                              ...editingHistory,
                              updateDate: e.target.value
                            });
                            setDateError(null);
                          }}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </Form.Group>

                      {dateError && (
                        <Alert variant="danger" className="mt-3">
                          {dateError}
                        </Alert>
                      )}
                    </>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setShowEditHistoryModal(false);
                      setEditingHistory(null);
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    variant="warning" 
                    onClick={handleUpdateHistory}
                    disabled={loading}
                  >
                    {loading ? 'جاري التحديث...' : 'تحديث السجل'}
                  </Button>
                </Modal.Footer>
              </Modal>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowUpdateDatesModal(false);
              setNewUpdateDate('');
              setUpdatedMemberCard({ cardNumber: '' });
              setDateError(null);
            }}
            disabled={loading}
          >
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MembersTable;