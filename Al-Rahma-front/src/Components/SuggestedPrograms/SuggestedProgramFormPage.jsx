import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, Alert } from 'react-bootstrap';
import ProgramForm from './ProgramForm';
import {
  getPrograms,
  createProgram,
  updateProgram
} from '../../services/SuggestedProgramsService';
import { useAuth } from '../../contexts/AuthContext'; // Import the auth context

const SuggestedProgramFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth(); // Get the current user
  const [editingProgram, setEditingProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is admin or super admin
  const isAdmin = user?.Role === 'Admin' || user?.Role === 'SuperAdmin';

  useEffect(() => {
    // Regular users can only create new programs, not edit existing ones
    if (id && !isAdmin) {
      setError('ليس لديك صلاحية لتعديل البرامج');
      setLoading(false);
      return;
    }

    if (id) {
      const fetchProgram = async () => {
        try {
          const program = await getPrograms(id);
          setEditingProgram(program);
        } catch (err) {
          setError('Failed to load program data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchProgram();
    } else {
      setLoading(false);
    }
  }, [id, isAdmin]);

  const handleSubmit = async (programData) => {
    try {
      if (editingProgram) {
        await updateProgram(editingProgram.id, programData);
      } else {
        await createProgram(programData);
      }
      navigate('/suggested-programs');
    } catch (err) {
      setError('Failed to save program. Please try again.');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{editingProgram ? 'تعديل البرنامج' : 'إضافة برنامج جديد'}</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/suggested-programs')}>
          العودة إلى القائمة
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <ProgramForm 
        committee={editingProgram?.committee || ''}
        onSubmit={handleSubmit}
        editingProgram={editingProgram}
        onCancel={() => navigate('/suggested-programs')}
      />
    </Container>
  );
};

export default SuggestedProgramFormPage;