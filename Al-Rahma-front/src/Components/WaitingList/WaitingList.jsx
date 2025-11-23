// src/Components/WaitingList.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import AddButton from '../AddButton';
import WaitingListForm from './WaitingListForm';
import WaitingListTable from './WaitingListTable';
import FilterByDate from './FilterByDate';
import { waitingListService } from '../../services/waitingListService';
import './WaitingList.css';

const WaitingList = () => {
  const [showForm, setShowForm] = useState(false);
  const [waitingList, setWaitingList] = useState([]);
  const [filteredDate, setFilteredDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchWaitingList();
  }, [filteredDate, retryCount]);

  const fetchWaitingList = async () => {
    try {
      setLoading(true);
      setError('');
      const filters = {};
      
      if (filteredDate) {
        filters.date = filteredDate;
      }
      
      const data = await waitingListService.getAll(filters);
      setWaitingList(data);
    } catch (err) {
      const errorMessage = err.message || 'فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.';
      setError(`خطأ: ${errorMessage}`);
      console.error('Error fetching waiting list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleSubmitForm = async (newEntry) => {
    try {
      setError('');
      await waitingListService.create(newEntry);
      setShowForm(false);
      // Refresh the list after successful creation
      fetchWaitingList();
    } catch (err) {
      const errorMessage = err.message || 'فشل في إضافة المدخل. يرجى المحاولة مرة أخرى.';
      setError(`خطأ: ${errorMessage}`);
      console.error('Error creating entry:', err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setError('');
      await waitingListService.updateStatus(id, newStatus);
      fetchWaitingList();
    } catch (err) {
      const errorMessage = err.message || 'فشل في تحديث الحالة. يرجى المحاولة مرة أخرى.';
      setError(`خطأ: ${errorMessage}`);
      console.error('Error updating status:', err);
    }
  };

  const handleFilterChange = (date) => {
    setFilteredDate(date);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4 waiting-list-container">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
          <div className="mt-2">
            <Button variant="outline-danger" size="sm" onClick={handleRetry}>
              إعادة المحاولة
            </Button>
          </div>
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col>
          <h1 className="text-center">قائمة الانتظار</h1>
        </Col>
      </Row>
      
      <Row className="mb-3 justify-content-between">
        <Col md={4}>
          <FilterByDate onFilterChange={handleFilterChange} />
        </Col>
        <Col md={2} className="text-left">
          <AddButton handleAdd={handleAdd} />
        </Col>
      </Row>
      
      <Row>
        <Col>
          <WaitingListTable 
            data={waitingList} 
            onStatusChange={handleStatusChange} 
          />
        </Col>
      </Row>
      
      <WaitingListForm 
        show={showForm} 
        handleClose={handleCloseForm} 
        handleSubmit={handleSubmitForm} 
      />
    </Container>
  );
};

export default WaitingList;