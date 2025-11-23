import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Alert, 
  Spinner, 
  Button,
  Row,
  Col,
  Form
} from 'react-bootstrap';
import MembersTable from './MembersTable';
import MemberFormModal from './MemberFormModal';
import { 
  fetchMembers, 
  addMember, 
  deleteMember 
} from '../../services/memberService';
import AddButton from '../AddButton';

const Member = () => {
  // State management
  const [state, setState] = useState({
    members: [],
    filteredMembers: [],
    years: [],
    loading: true,
    error: null,
    successMessage: null
  });

  const [modal, setModal] = useState({
    show: false,
    mode: 'add', // 'add' or 'edit'
    memberId: null
  });

  // Fetch members on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch members data
        const membersData = await fetchMembers();
        
        // Generate years for filtering
        const currentYear = new Date().getFullYear();
        const startYear = 2011;
        const yearsArray = Array.from(
          { length: currentYear - startYear + 1 }, 
          (_, i) => currentYear - i
        );

        setState(prev => ({
          ...prev,
          members: membersData,
          filteredMembers: membersData,
          years: yearsArray,
          loading: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }));
      }
    };

    initializeData();
  }, []);

  // Handle member operations
  const handleAddMember = async (memberData) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const newMember = await addMember(memberData);
      
      setState(prev => ({
        ...prev,
        members: [...prev.members, newMember],
        filteredMembers: [...prev.members, newMember],
        successMessage: 'تمت إضافة العضو بنجاح',
        loading: false
      }));
      
      setModal({ show: false });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      await deleteMember(memberId);
      const updatedMembers = state.members.filter(m => m.id !== memberId);
      
      setState(prev => ({
        ...prev,
        members: updatedMembers,
        filteredMembers: updatedMembers,
        successMessage: 'تم حذف العضو بنجاح',
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  };

  // Clear messages after timeout
  useEffect(() => {
    if (state.successMessage || state.error) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          successMessage: null,
          error: null
        }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.successMessage, state.error]);

  // Loading state
  if (state.loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </Spinner>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <Alert variant="danger" className="text-center mt-5">
        خطأ: {state.error}
      </Alert>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Page Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="mb-0">قائمة الأعضاء</h1>
          
        </Col>
        <Col className="text-end">
          <AddButton
            handleAdd={() => setModal({ show: true, mode: 'add' })}
          />
        </Col>
      </Row>

      {/* Status Alerts */}
      {state.successMessage && (
        <Alert variant="success" dismissible onClose={() => 
          setState(prev => ({ ...prev, successMessage: null }))
        }>
          {state.successMessage}
        </Alert>
      )}


      {/* Members Table */}
      <MembersTable 
        members={state.filteredMembers}
        onDelete={handleDeleteMember}
      />

      {/* Member Form Modal */}
      <MemberFormModal
        show={modal.show}
        mode={modal.mode}
        memberId={modal.memberId}
        onHide={() => setModal({ show: false })}
        onSubmit={handleAddMember}
      />
    </Container>
  );
};

export default Member;