// src/components/users/UserStats.jsx
import React from 'react';

const UserStats = ({ users }) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;
  const approvedUsers = users.filter(user => user.isApproved).length;
  const adminUsers = users.filter(user => user.role === 'Admin').length;

  const stats = [
    { label: 'إجمالي المستخدمين', value: totalUsers, color: '#3498db' },
    { label: 'المستخدمون النشطون', value: activeUsers, color: '#2ecc71' },
    { label: 'المستخدمون الموافق عليهم', value: approvedUsers, color: '#9b59b6' },
    { label: 'المستخدمون المشرفون', value: adminUsers, color: '#e74c3c' }
  ];

  return (
    <div className="user-stats">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card" style={{ borderLeft: `4px solid ${stat.color}` }}>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default UserStats;