import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Button, Tab, Tabs, Alert, Spinner, 
  ListGroup, Badge, Row, Col 
} from 'react-bootstrap';
import { getSession } from '../../services/sessionService';

const SessionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await getSession(id);
        setSession(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  };

  const getSessionType = (type) => {
    const types = {
      Ordinary: 'عادية',
      Electoral: 'انتخابية',
      Extraordinary: 'طارئة'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Draft: { text: 'مسودة', variant: 'secondary' },
      Preparation: { text: 'تحضير', variant: 'warning' },
      InProgress: { text: 'جارية', variant: 'primary' },
      Completed: { text: 'مكتملة', variant: 'success' },
      Cancelled: { text: 'ملغاة', variant: 'danger' }
    };
    const statusInfo = statusMap[status] || { text: status, variant: 'info' };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mx-3 my-5">
        {error}
      </Alert>
    );
  }

  if (!session) {
    return (
      <Alert variant="warning" className="mx-3 my-5">
        لم يتم العثور على الجلسة
      </Alert>
    );
  }

  return (
    <div className="container my-4">
      <Button variant="secondary" className="mb-4" onClick={() => navigate(-1)}>
        العودة
      </Button>

      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">تفاصيل الجلسة: {session.title || 'بدون عنوان'}</h4>
          {getStatusBadge(session.status)}
        </Card.Header>

        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="details" title="التفاصيل العامة">
              <Row className="mt-3">
                <Col md={6}>
                  <ListGroup>
                    <ListGroup.Item>
                      <strong>نوع الجلسة:</strong> {getSessionType(session.type)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>التاريخ:</strong> {formatDate(session.date)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>الموقع:</strong> {session.location}
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col md={6}>
                  <ListGroup>
                    <ListGroup.Item>
                      <strong>تاريخ الإنشاء:</strong> {formatDate(session.createdAt)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>أنشأ بواسطة:</strong> {session.createdBy?.name || 'غير معروف'}
                    </ListGroup.Item>
                    {session.notes && (
                      <ListGroup.Item>
                        <strong>ملاحظات:</strong> {session.notes}
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="preparations" title="التحضيرات">
              <h5 className="mt-3">حالة التحضيرات</h5>
              <ListGroup>
                {Object.entries(session.preparations || {}).map(([key, value]) => (
                  <ListGroup.Item key={key} className="d-flex justify-content-between align-items-center">
                    <span>{key}</span>
                    {value ? (
                      <Badge bg="success">مكتمل</Badge>
                    ) : (
                      <Badge bg="warning">غير مكتمل</Badge>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Tab>

            <Tab eventKey="documents" title="الوثائق">
              <h5 className="mt-3">الوثائق المرفقة</h5>
              {session.documents?.length > 0 ? (
                <ListGroup>
                  {session.documents.map((doc) => (
                    <ListGroup.Item key={doc.id} className="d-flex justify-content-between align-items-center">
                      <span>{doc.name}</span>
                      <Button variant="outline-primary" size="sm">
                        تحميل
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="info">لا توجد وثائق مرفقة</Alert>
              )}
            </Tab>
          </Tabs>
        </Card.Body>

        <Card.Footer className="d-flex justify-content-end">
          {session.status === 'Draft' && (
            <Button variant="primary" className="me-2">
              تعديل
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate(-1)}>
            إغلاق
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default SessionDetails;