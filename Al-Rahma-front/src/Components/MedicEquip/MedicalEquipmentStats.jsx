import React from 'react';
import { Card } from 'react-bootstrap';
import './styles/MedicalEquipment.css';

const MedicalEquipmentStats = ({ equipment }) => {
const stats = {
  total: equipment.length,
  operational: equipment.filter(e => e.status === 'صالح').length,
  damaged: equipment.filter(e => e.status === 'معطب').length,
  disposed: equipment.filter(e => e.status === 'تم اتلافه').length,
  forLoan: equipment.filter(e => e.usage === 'للاعارة').length,
  forDonation: equipment.filter(e => e.usage === 'للمساعدات').length 
};
  return (
    <div className="equipment-stats mb-4">
      <Card>
        <Card.Body className="stats-horizontal-container">
          <div className="stat-item">
            <div className="stat-value text-info">{stats.forLoan}</div>
            <div className="stat-label">للإعارة</div>
          </div>
          <div className="stat-item">
            <div className="stat-value text-primary">{stats.forDonation}</div>
            <div className="stat-label">للمساعدات</div>
          </div>

          <div className="stat-item">
            <div className="stat-value text-success">{stats.operational}</div>
            <div className="stat-label">صالح للاستخدام</div>
          </div>

          <div className="stat-item">
            <div className="stat-value text-warning">{stats.damaged}</div>
            <div className="stat-label">معطب</div>
          </div>
          <div className="stat-item">
            <div className="stat-value text-danger">{stats.disposed}</div>
            <div className="stat-label">تم اتلافه</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">إجمالي المعدات</div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MedicalEquipmentStats;