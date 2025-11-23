// src/components/users/UserFilter.jsx
import React from 'react';

const UserFilter = ({ filters, setFilters, onRefresh }) => {
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: 'all',
      status: 'all',
      approval: 'all'
    });
  };

  return (
    <div className="user-filter">
      <div className="filter-group">
        <label>بحث في المستخدمين</label>
        <input
          type="text"
          placeholder="ابحث بالاسم أو البريد الإلكتروني..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-group">
        <label>الدور</label>
        <select
          value={filters.role}
          onChange={(e) => handleFilterChange('role', e.target.value)}
          className="filter-select"
        >
          <option value="all">جميع الأدوار</option>
          <option value="Admin">مشرف</option>
          <option value="User">مستخدم</option>
          <option value="SuperAdmin">مراقب</option>
        </select>
      </div>

      <div className="filter-group">
        <label>الحالة</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
      </div>

      <div className="filter-group">
        <label>الموافقة</label>
        <select
          value={filters.approval}
          onChange={(e) => handleFilterChange('approval', e.target.value)}
          className="filter-select"
        >
          <option value="all">جميع حالات الموافقة</option>
          <option value="approved">موافق</option>
          <option value="pending">قيد الانتظار</option>
        </select>
      </div>

      <div className="filter-actions">
        <button onClick={clearFilters} className="btn-secondary">
          مسح الفلاتر
        </button>
        <button onClick={onRefresh} className="btn-refresh" title="تحديث">
          🔄
        </button>
      </div>
    </div>
  );
};

export default UserFilter;