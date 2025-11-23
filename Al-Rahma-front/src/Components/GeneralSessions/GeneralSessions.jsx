import React from 'react';
import { Button, Card, Row, Col, Container } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import OrdinarySessions from './OrdinarySessions';
import ElectoralSessions from './ElectoralSession';
import ExtraordinarySession from './ExtraordinarySession';
import GeneralSessionsHistory from './GeneralSessionsHistory';
import OngoingGeneralSession from './OngoingGeneralSession';
import GeneralSessionsGuide from './GeneralSessionsGuide';
import SessionDocumentsTable from './SessionDocumentsTable';
import './generalSessions.css';

const GeneralSessions = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Static session data for demonstration
  const staticSessions = [
    {
      id: 1,
      type: 'ordinary',
      title: 'الجلسة العادية الأولى',
      date: '2023-05-15',
      status: 'completed'
    },
    {
      id: 2,
      type: 'electoral',
      title: 'الجلسة الانتخابية السنوية',
      date: '2023-06-20',
      status: 'completed'
    },
    {
      id: 3,
      type: 'extraordinary',
      title: 'الجلسة الطارئة لبحث الأزمة',
      date: '2023-07-10',
      status: 'completed'
    }
  ];

  const [view, setView] = React.useState(id ? 'ongoing' : 'selection');

  const handleSessionCreated = (session) => {
    navigate(`/sessions/${session.id}`);
  };

  const SelectedSession = {
    ordinary: () => (
      <OrdinarySessions 
        onBack={() => setView('selection')} 
        onSessionCreated={handleSessionCreated}
      />
    ),
    electoral: () => (
      <ElectoralSessions
        onBack={() => setView('selection')}
        onSessionCreated={handleSessionCreated}
      />
    ),
    extraordinary: () => (
      <ExtraordinarySession
        onBack={() => setView('selection')}
        onSessionCreated={handleSessionCreated}
      />
    ),
    history: () => (
      <GeneralSessionsHistory 
        sessions={staticSessions}
        loading={false}
        error={null}
        onBack={() => setView('selection')}
      />
    ),
    ongoing: () => (
      <OngoingGeneralSession 
        onBack={() => setView('selection')}
      />
    ),
    guide: () => (
      <GeneralSessionsGuide 
        onBack={() => setView('selection')}
      />
    ),
    documents: () => (
      <Container className="py-4">
        <Button onClick={() => setView('selection')} variant="outline-secondary" className="mb-4">
          العودة
        </Button>
        <SessionDocumentsTable />
      </Container>
    ),
  }[view];

  if (SelectedSession) {
    return <SelectedSession />;
  }

  return (
    <Container className="general-sessions-container py-5">
      <div className="text-center mb-5">
        <h2 className="mb-4">إدارة الجلسات العامة</h2>
        <p className="lead text-muted">اختر نوع الجلسة أو الإجراء المطلوب</p>
      </div>

      {/* Main Session Cards */}
      <Row className="g-4 mb-5">
        {[
          { 
            type: "ordinary", 
            title: "الجلسة العامة العادية", 
            text: "تحضيرات ومراجعات الجلسة العامة العادية",
            icon: "📅",
            variant: "primary"
          },
          { 
            type: "electoral", 
            title: "الجلسة العامة الانتخابية", 
            text: "تحضيرات ومراجعات الجلسة الانتخابية لاختيار المناصب",
            icon: "🗳️",
            variant: "success"
          },
          { 
            type: "extraordinary", 
            title: "الجلسة العامة الطارئة", 
            text: "تحضيرات الجلسات العامة الطارئة",
            icon: "⚠️",
            variant: "warning"
          },
        ].map(({ type, title, text, icon, variant }) => (
          <Col md={4} key={type}>
            <Card 
              className="h-100 shadow-sm border-0 hover-shadow transition-all"
              onClick={() => setView(type)}
            >
              <Card.Body className="text-center d-flex flex-column">
                <div className="display-4 mb-3">{icon}</div>
                <Card.Title className="mb-3">{title}</Card.Title>
                <Card.Text className="text-muted">{text}</Card.Text>
                <Button 
                  variant={variant} 
                  className="mt-auto align-self-center"
                  onClick={() => setView(type)}
                >
                  الدخول
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Secondary Actions */}
      <div className="bg-light rounded-3 p-4 mb-4">
        <h5 className="text-center mb-4">إجراءات أخرى</h5>
        <Row className="g-3 justify-content-center">
          <Col md={4} sm={6}>
            <Button 
              variant="outline-info" 
              className="w-100 py-3"
              onClick={() => setView("history")}
            >
              <i className="bi bi-clock-history me-2"></i>
              الجلسات السابقة
            </Button>
          </Col>
          <Col md={4} sm={6}>
            <Button 
              variant="outline-primary" 
              className="w-100 py-3"
              onClick={() => setView("ongoing")}
            >
              <i className="bi bi-activity me-2"></i>
              الجلسة الجارية
            </Button>
          </Col>
          <Col md={4} sm={6}>
            <Button 
              variant="outline-dark" 
              className="w-100 py-3"
              onClick={() => setView("guide")}
            >
              <i className="bi bi-question-circle me-2"></i>
              دليل الجلسات
            </Button>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default GeneralSessions;