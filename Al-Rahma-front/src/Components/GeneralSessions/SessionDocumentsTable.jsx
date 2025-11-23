import React, { useState, useEffect } from "react";
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Badge,
  Alert,
  Spinner
} from "react-bootstrap";
import { 
  FaFileUpload, 
  FaFileDownload, 
  FaHistory, 
  FaPrint, 
  FaFileDownload as FaDownload,
  FaEye
} from "react-icons/fa";
import { 
  uploadDocumentProof, 
  getDocumentHistory, 
  getDocumentStatuses, 
  printDocumentProof,
  downloadDocumentProof
} from "../../services/sessionService";

const SessionDocumentsTable = ({ sessionId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [file, setFile] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Document types
  const documentTypes = [
    {
      id: 1,
      name: "مراسلة رئاسة الحكومة",
      key: "governmentPresidency",
      description: "تتضمن التقرير الأدبي والتقرير المالي وتقرير مراقب الحسابات للسنة المنقضية"
    },
    {
      id: 2,
      name: "تسجيل محضر الجلسة",
      key: "financialRegistry",
      description: "في قباضة المالية"
    },
    {
      id: 3,
      name: "مراسلة البنك",
      key: "bankDocuments",
      description: "محضر الجلسة (PV) والتقرير الأدبي والتقرير المالي وتقرير مراقب الحسابات"
    },
    {
      id: 4,
      name: "مراسلة السجل الوطني للمؤسسات",
      key: "rneDocuments",
      description: "كامل ملف الجلسة ومحضر الجلسة (RNE)"
    },
    {
      id: 5,
      name: "مراسلة المعتمدية",
      key: "delegationDocuments",
      description: "محضر الجلسة (PV) والتقرير الأدبي والتقرير المالي"
    }
  ];

  useEffect(() => {
    const fetchDocumentStatus = async () => {
      try {
        setLoading(true);
        
        const backendStatus = await getDocumentStatuses(sessionId);
        
        const mergedStatus = documentTypes.map(doc => {
          const backendDoc = backendStatus.find(d => d.documentType === doc.key);
          return {
            ...doc,
            sent: backendDoc?.isSent || false,
            received: backendDoc?.isReceived || false,
            sentProof: backendDoc?.sentProof || null,
            receivedProof: backendDoc?.receivedProof || null,
            sentDate: backendDoc?.sentDate || null,
            receivedDate: backendDoc?.receivedDate || null
          };
        });
        
        setDocuments(mergedStatus);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDocumentStatus();
  }, [sessionId]);

  const handleUploadClick = (document, action) => {
    setCurrentDocument(document);
    setActionType(action);
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
        alert("الرجاء اختيار ملف");
        return;
    }

    try {
        await uploadDocumentProof(sessionId, currentDocument.key, actionType, file);

        setDocuments(prev => prev.map(doc => {
            if (doc.id === currentDocument.id) {
                return {
                    ...doc,
                    ...(actionType === 'send' ? {
                        sent: true,
                        sentDate: new Date().toISOString()
                    } : {
                        received: true,
                        receivedDate: new Date().toISOString()
                    })
                };
            }
            return doc;
        }));

        setShowUploadModal(false);
        setFile(null);
    } catch (err) {
        setError(`حدث خطأ أثناء تحميل حالة الوثائق: ${err.message}`);
    }
  };

  const handleShowHistory = async (document) => {
    try {
      setHistoryLoading(true);
      setCurrentDocument(document);
      
      const backendHistory = await getDocumentHistory(sessionId, document.key);
      
      const formattedHistory = backendHistory.map(item => ({
        id: item.id,
        action: item.actionType,
        date: item.actionDate,
        proofUrl: item.proofFilePath
      }));
      
      setHistory(formattedHistory);
      setShowHistoryModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePrintProof = async (trackingId) => {
    try {
      setPrinting(true);
      await printDocumentProof(trackingId, `Proof - ${currentDocument?.name}`);
    } catch (err) {
      setError(`Print error: ${err.message}`);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadProof = async (trackingId) => {
    try {
      setDownloading(true);
      await downloadDocumentProof(trackingId);
    } catch (err) {
      setError(`Download error: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (document) => {
    if (document.sent && document.received) {
      return (
        <>
          <Badge bg="success">تم الإرسال والتسليم</Badge>
          <div className="text-muted small mt-1">
            {new Date(document.sentDate).toLocaleString()} - 
            {new Date(document.receivedDate).toLocaleString()}
          </div>
        </>
      );
    }
    if (document.sent) {
      return (
        <>
          <Badge bg="warning" text="dark">تم الإرسال</Badge>
          <div className="text-muted small mt-1">
            {new Date(document.sentDate).toLocaleString()}
          </div>
        </>
      );
    }
    return <Badge bg="danger">لم يتم الإرسال</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">جاري تحميل حالة الوثائق...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">حدث خطأ أثناء تحميل حالة الوثائق: {error}</Alert>;
  }

  return (
    <div className="mt-4">
      <h5 className="text-center mb-4">حالة إرسال الوثائق</h5>
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>الوثيقة</th>
            <th>الوصف</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.id}</td>
              <td>{doc.name}</td>
              <td>{doc.description}</td>
              <td>{getStatusBadge(doc)}</td>
              <td>
                <div className="d-flex gap-2">
                  {!doc.sent && (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleUploadClick(doc, 'send')}
                    >
                      <FaFileUpload className="me-1" />
                      تم الإرسال
                    </Button>
                  )}
                  {doc.sent && !doc.received && (
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={() => handleUploadClick(doc, 'receive')}
                    >
                      <FaFileDownload className="me-1" />
                      تم التسليم
                    </Button>
                  )}
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => handleShowHistory(doc)}
                  >
                    <FaHistory className="me-1" />
                    السجل
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Upload Proof Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === 'send' ? 'إثبات الإرسال' : 'إثبات التسليم'} - {currentDocument?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>رفع ملف الإثبات</Form.Label>
              <Form.Control 
                type="file" 
                onChange={handleFileChange} 
                accept=".pdf,.jpg,.jpeg,.png" 
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            تأكيد
          </Button>
        </Modal.Footer>
      </Modal>

      {/* History Modal */}
      <Modal 
        show={showHistoryModal} 
        onHide={() => setShowHistoryModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>سجل الوثيقة - {currentDocument?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {historyLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : history.length === 0 ? (
            <Alert variant="info">لا يوجد سجل لهذه الوثيقة</Alert>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الإجراء</th>
                  <th>التاريخ</th>
                  <th>الوثيقة</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      {item.action === 'send' ? 
                        <Badge bg="primary">إرسال</Badge> : 
                        <Badge bg="success">تسليم</Badge>}
                    </td>
                    <td>{new Date(item.date).toLocaleString()}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handlePrintProof(item.id)}
                          disabled={printing}
                        >
                          {printing ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            <>
                              <FaPrint className="me-1" />
                              طباعة
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SessionDocumentsTable;