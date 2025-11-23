// src/components/users/Users.jsx
import React, { useState, useEffect } from 'react';
import UserStats from './UserStats';
import UsersTable from './UsersTable';
import UserFilter from './UserFilter';
import UserFormModal from './UserFormModal';
import AddButton from '../AddButton';
import usersService from '../../services/usersService';
import './users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    approval: 'all'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const usersData = await usersService.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // تصفية البحث
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm) ||
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm)
      );
    }

    // تصفية الدور
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // تصفية الحالة
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => 
        filters.status === 'active' ? user.isActive : !user.isActive
      );
    }

    // تصفية الموافقة
    if (filters.approval !== 'all') {
      filtered = filtered.filter(user => 
        filters.approval === 'approved' ? user.isApproved : !user.isApproved
      );
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المستخدم؟')) {
      try {
        await usersService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await usersService.approveUser(userId);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isApproved: true } : user
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleModalSubmit = async (userData) => {
    try {
      if (editingUser) {
        await usersService.updateUser(editingUser.id, userData);
        setUsers(users.map(user => 
          user.id === editingUser.id ? { ...user, ...userData } : user
        ));
      } else {
        const newUser = await usersService.registerUser(userData);
        setUsers([...users, newUser]);
      }
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">جاري تحميل المستخدمين...</div>;
  if (error) return <div className="error">خطأ: {error}</div>;

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>إدارة المستخدمين</h1>
        <AddButton handleAdd={handleCreateUser} />
      </div>

      <UserStats users={users} />
      
      <UserFilter 
        filters={filters}
        setFilters={setFilters}
        onRefresh={fetchUsers}
      />

      <UsersTable
        users={filteredUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onApprove={handleApproveUser}
      />

      <UserFormModal
        isOpen={isModalOpen}
        user={editingUser}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default Users;