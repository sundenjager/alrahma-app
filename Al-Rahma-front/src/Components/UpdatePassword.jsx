// src/components/UpdatePassword.jsx - Fixed version
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import usersService from '../services/usersService';

const UpdatePassword = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (!formData.currentPassword) {
      setError('يرجى إدخال كلمة المرور الحالية');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    setLoading(true);
    
    try {
      // Make the actual API call
      await usersService.updatePassword(user.id, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      setSuccess('تم تحديث كلمة المرور بنجاح');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message || 'فشل في تحديث كلمة المرور. يرجى التحقق من كلمة المرور الحالية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">تغيير كلمة المرور</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">
                    كلمة المرور الحالية
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <div className="form-text">
                    يجب أن تكون كلمة المرور على الأقل 6 أحرف
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;