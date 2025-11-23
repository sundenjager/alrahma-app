// src/Components/UserProfile/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import usersService from '../../services/usersService';
import { toast } from 'react-hot-toast';
import './UserProfile.css';

const UserProfile = () => {
  const { user, updateUser } = useAuth(); 
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    

    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Use the profile-specific endpoint
      await usersService.updateProfile(user.id, formData);
      
      // Update the auth context with new user data
      updateUser({
        ...user,
        ...formData
      });
      
      toast.success('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('فشل في تحديث الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>يجب تسجيل الدخول أولاً</div>;
  }

  return (
    <div className="user-profile-container">
      <div className="card">
        <div className="card-header">
          <h3>تعديل الملف الشخصي</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">البريد الإلكتروني</label>
              <input 
                type="email" 
                className="form-control" 
                id="email" 
                value={user.email} 
                disabled 
              />
              <div className="form-text">لا يمكن تعديل البريد الإلكتروني</div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="firstName" className="form-label">الاسم الأول</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="firstName" 
                  name="firstName"
                  value={formData.firstName} 
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label htmlFor="lastName" className="form-label">الاسم الأخير</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="lastName" 
                  name="lastName"
                  value={formData.lastName} 
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="phoneNumber" className="form-label">رقم الهاتف</label>
              <input 
                type="tel" 
                className="form-control" 
                id="phoneNumber" 
                name="phoneNumber"
                value={formData.phoneNumber} 
                onChange={handleChange}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;