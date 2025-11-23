// src/components/users/UsersTable.jsx
import React from 'react';

const UsersTable = ({ users, onEdit, onDelete, onApprove }) => {

  const getStatusBadge = (user) => {
    if (!user.isActive) return 'inactive';
    if (!user.isApproved) return 'pending';
    return 'active';
  };

  return (
    <div className="users-table-container">
      <table className="users-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>البريد الإلكتروني</th>
            <th>الدور</th>
            <th>الهاتف</th>
            <th>الحالة</th>
            <th>الموافقة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className={!user.isActive ? 'inactive-user' : ''}>
              <td>
                <div className="user-info">
                  <div className="user-name">{user.firstName} {user.lastName}</div>
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge role-${user.role.toLowerCase()}`}>
                  {user.role === 'Admin' ? 'مشرف' : user.role === 'SuperAdmin' ? 'مراقب' : user.role === 'User' ? 'مستخدم' : user.role}
                </span>
              </td>
              <td>{user.phoneNumber || 'غير متوفر'}</td>
              <td>
                <span className={`status-badge status-${getStatusBadge(user)}`}>
                  {getStatusBadge(user) === 'active' ? 'نشط' : 
                   getStatusBadge(user) === 'inactive' ? 'غير نشط' : 'قيد الانتظار'}
                </span>
              </td>
              <td>
                <span className={`approval-badge ${user.isApproved ? 'approved' : 'pending'}`}>
                  {user.isApproved ? 'موافق' : 'قيد الانتظار'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button 
                    className="btn-edit"
                    onClick={() => onEdit(user)}
                    title="تعديل المستخدم"
                  >
                    ✏️
                  </button>
                  
                  {!user.isApproved && (
                    <button 
                      className="btn-approve"
                      onClick={() => onApprove(user.id)}
                      title="الموافقة على المستخدم"
                    >
                      ✓
                    </button>
                  )}
                  
                  <button 
                    className="btn-delete"
                    onClick={() => onDelete(user.id)}
                    title="حذف المستخدم"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <div className="no-users">
          لم يتم العثور على مستخدمين يتطابقون مع معايير البحث.
        </div>
      )}
    </div>
  );
};

export default UsersTable;