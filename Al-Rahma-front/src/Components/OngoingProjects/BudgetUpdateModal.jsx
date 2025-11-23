import React, { useState, useEffect } from 'react';
import { Modal, Form, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { FaMoneyBillWave, FaExclamationTriangle, FaInfoCircle, FaPercentage } from 'react-icons/fa';

const BudgetUpdateModal = ({ 
  show, 
  onHide, 
  project, 
  onSubmit, 
  formatCurrency, 
  isLoading
}) => {
  const [formData, setFormData] = useState({
    spent: 0,
    remaining: 0,
    spentPercentage: 0,
    remainingPercentage: 100,
    error: null
  });

  useEffect(() => {
    if (project) {
      setFormData({
        spent: project.spent || 0,
        remaining: project.remaining || 0,
        spentPercentage: project.budget > 0 ? Math.round(((project.spent || 0) / project.budget) * 100) : 0,
        remainingPercentage: project.budget > 0 ? Math.round(((project.remaining || 0) / project.budget) * 100) : 0,
        error: null
      });
    }
  }, [project]);

  const handleSpentChange = (e) => {
    const value = e.target.value;
    
    if (value === '') {
      updateBudgetValues(0);
      return;
    }

    const spentValue = parseFloat(value);
    
    if (isNaN(spentValue)) {
      setFormData(prev => ({
        ...prev,
        error: 'الرجاء إدخال رقم صحيح'
      }));
      return;
    }

    if (spentValue < 0) {
      setFormData(prev => ({
        ...prev,
        error: 'لا يمكن أن يكون المبلغ المصروف أقل من الصفر'
      }));
      return;
    }

    if (spentValue > project.budget) {
      setFormData(prev => ({
        ...prev,
        error: `لا يمكن أن يتجاوز المبلغ المصروف الميزانية الكلية (${formatCurrency(project.budget)})`
      }));
      return;
    }

    updateBudgetValues(spentValue);
  };

  const updateBudgetValues = (spentValue) => {
    const remainingValue = project.budget - spentValue;
    const spentPercentage = project.budget > 0 ? Math.round((spentValue / project.budget) * 100) : 0;
    const remainingPercentage = 100 - spentPercentage;
    
    setFormData({
      spent: spentValue,
      remaining: remainingValue,
      spentPercentage,
      remainingPercentage,
      error: null
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.spent < 0) {
      setFormData(prev => ({
        ...prev,
        error: 'المبلغ المصروف لا يمكن أن يكون سالبًا'
      }));
      return;
    }

    if (formData.spent > project.budget) {
      setFormData(prev => ({
        ...prev,
        error: 'المبلغ المصروف لا يمكن أن يتجاوز الميزانية الكلية'
      }));
      return;
    }

    const budgetUpdate = {
      spent: formData.spent,
      remaining: formData.remaining
    };

    onSubmit(project.id, budgetUpdate);
  };

  if (!project) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <FaMoneyBillWave className="me-2 text-success" />
          تحديث الميزانية
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {formData.error && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              {formData.error}
            </Alert>
          )}
          
          <div className="row mb-4">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>الميزانية الكلية</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formatCurrency(project.budget)} 
                  readOnly 
                  className="fw-bold fs-5"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>حالة الميزانية</Form.Label>
                <div className="d-flex align-items-center">
                  <ProgressBar className="flex-grow-1" style={{ height: '30px' }}>
                    <ProgressBar 
                      variant="warning" 
                      now={formData.spentPercentage} 
                      label={`${formData.spentPercentage}% مصروف`} 
                    />
                    <ProgressBar 
                      variant="success" 
                      now={formData.remainingPercentage} 
                      label={`${formData.remainingPercentage}% متبقي`} 
                    />
                  </ProgressBar>
                  <FaPercentage className="ms-2" />
                </div>
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>المبلغ المصروف *</Form.Label>
                <Form.Control
                  type="number"
                  name="spent"
                  value={formData.spent}
                  onChange={handleSpentChange}
                  min="0"
                  max={project.budget}
                  required
                  className="fs-5"
                />
                <div className="text-muted mt-1">
                  {formatCurrency(formData.spent)} ({formData.spentPercentage}%)
                </div>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>المبلغ المتبقي</Form.Label>
                <Form.Control
                  type="text"
                  name="remaining"
                  value={formatCurrency(formData.remaining)}
                  readOnly
                  className="fw-bold fs-5"
                />
                <div className="text-muted mt-1">
                  {formData.remainingPercentage}% من الميزانية
                </div>
              </Form.Group>
            </div>
          </div>
          
          <Alert variant="info" className="d-flex align-items-center mt-4">
            <FaInfoCircle className="me-2" />
            <div>
              <strong>ملاحظة:</strong> أدخل فقط المبلغ المصروف وسيتم حساب المتبقي تلقائيًا
            </div>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onHide}
            disabled={isLoading}
          >
            إلغاء
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                جاري الحفظ...
              </>
            ) : 'حفظ التغييرات'}
          </button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default BudgetUpdateModal;