import React, { useState, useEffect } from 'react';

const UserFormModal = ({ isOpen, user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'User',
    password: '',
    confirmPassword: '',
    isActive: true,
    isApproved: false,
    sendEmail: true
  });

  const [errors, setErrors] = useState({});
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        role: user.role || 'User',
        password: '',
        confirmPassword: '',
        isActive: user.isActive,
        isApproved: user.isApproved,
        sendEmail: false // Don't send email when editing
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: 'User',
        password: '',
        confirmPassword: '',
        isActive: true,
        isApproved: false,
        sendEmail: true // Send email by default for new users
      });
    }
    setErrors({});
  }, [user, isOpen]);

  // Password generator function
  const generatePassword = () => {
    setIsGeneratingPassword(true);
    
    // Generate a strong password with 12 characters
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each: lowercase, uppercase, number, special char
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setFormData(prev => ({
      ...prev,
      password: password,
      confirmPassword: password
    }));
    
    setIsGeneratingPassword(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    // trim inputs
    formData.firstName = formData.firstName?.trim();
    formData.lastName = formData.lastName?.trim();
    formData.email = formData.email?.trim();

    if (!formData.firstName) newErrors.firstName = 'الاسم الأول مطلوب';
    if (!formData.lastName) newErrors.lastName = 'الاسم الأخير مطلوب';
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(formData.email)) newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }

    // Only validate password for new users
    if (!user) {
      if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
      if (formData.password && formData.password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      let submitData;
      
      if (user) {
        // Editing existing user - use UpdateUserDto format
        submitData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          isActive: formData.isActive,
          isApproved: formData.isApproved
        };
      } else {
        // Creating new user - use RegisterUserWithEmailDto format
       submitData = {
        Email: formData.email,
        FirstName: formData.firstName,
        LastName: formData.lastName,
        // Only include required fields initially
      };
      }
      
      onSubmit(submitData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? 'تعديل المستخدم' : 'إنشاء مستخدم جديد'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <div className="form-group">
              <label>الاسم الأول *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label>الاسم الأخير *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!!user}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>رقم الهاتف</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>الدور</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="User">مستخدم</option>
              <option value="Admin">مشرف</option>
              <option value="SuperAdmin">مراقب</option>
            </select>
          </div>

          {!user && (
            <>
              <div className="form-group">
                <div className="password-header">
                  <label>كلمة المرور *</label>
                  <button 
                    type="button" 
                    className="btn-generate"
                    onClick={generatePassword}
                    disabled={isGeneratingPassword}
                  >
                    {isGeneratingPassword ? 'جاري التوليد...' : 'توليد كلمة مرور'}
                  </button>
                </div>
                <input
                  type="text" // Changed to text to see generated password
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="سيتم إرسال كلمة المرور إلى البريد الإلكتروني"
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label>تأكيد كلمة المرور *</label>
                <input
                  type="text" // Changed to text to see generated password
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="sendEmail"
                    checked={formData.sendEmail}
                    onChange={handleChange}
                  />
                  إرسال بيانات الدخول إلى البريد الإلكتروني
                </label>
                <small className="help-text">
                  سيتم إرسال البريد الإلكتروني وكلمة المرور إلى المستخدم
                </small>
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                نشط
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isApproved"
                  checked={formData.isApproved}
                  onChange={handleChange}
                />
                موافق
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              {user ? 'تحديث المستخدم' : 'إنشاء مستخدم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;