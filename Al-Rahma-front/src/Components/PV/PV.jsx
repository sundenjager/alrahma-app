import React, { useState } from 'react';
import { Container, Nav, Alert } from 'react-bootstrap';
import Deliberations from './deliberations/Deliberations';
import CommiteePV from './committee-pv/CommiteePV';
import { useAuth } from '../../contexts/AuthContext'; // Import auth context
import './PV.css';

const PV = () => {
  const [activeTab, setActiveTab] = useState('CommiteePV');
  const { user } = useAuth(); // Get current user
  
  // Check if user is admin or super admin
  const isAdmin = user?.Role === 'Admin' || user?.Role === 'SuperAdmin';
  
  // Placeholder attributes for demonstration; update these when actual attributes are available.
  const deliberationsData = {
    // Attributes for "المداولات" (Deliberations)
  };

  const CommiteePVData = {};

  // If user is not admin, force the CommitteePV tab and show read-only message
  if (!isAdmin && activeTab !== 'CommiteePV') {
    setActiveTab('CommiteePV');
  }

  return (
    <Container className="pv-container">
      {/* Navigation Bar - Only show for admins */}
      {isAdmin ? (
        <Nav className="justify-content-center my-4 custom-navbar" variant="tabs">
          <Nav.Item className="custom-nav-item">
            <Nav.Link
              className={`custom-nav-link ${activeTab === 'CommiteePV' ? 'active' : ''}`}
              onClick={() => setActiveTab('CommiteePV')}
            >
              مداولات اللجان
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="custom-nav-item">
            <Nav.Link
              className={`custom-nav-link ${activeTab === 'deliberations' ? 'active' : ''}`}
              onClick={() => setActiveTab('deliberations')}
            >
              مداولات الهيئة المديرة
            </Nav.Link>
          </Nav.Item>


        </Nav>
      ) : (
        <Alert variant="info" className="my-4">
          <strong>ملاحظة:</strong> لديك صلاحية عرض مداولات اللجان فقط (وضع القراءة فقط)
        </Alert>
      )}

      {/* Toggle Sections */}
      {activeTab === 'deliberations' ? (
        <Deliberations {...deliberationsData} />
      ) : (
        <CommiteePV isReadOnly={!isAdmin} {...CommiteePVData} />
      )}
    </Container>
  );
};

export default PV;