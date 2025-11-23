import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";

const DocumentsModal = ({ show, onHide, documents, documentFiles }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleDocumentClick = (doc) => {
    setSelectedDocument(doc);
  };

  const handleGoBack = () => {
    setSelectedDocument(null);
  };

  const handlePrintAll = () => {
    // Open all documents in new tabs for printing
    documents.forEach((doc) => {
      const filePath = documentFiles[doc];
      window.open(filePath, "_blank");
    });
  };

  const handlePrint = () => {
    if (selectedDocument) {
      const filePath = documentFiles[selectedDocument];
      window.open(filePath, "_blank");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {selectedDocument ? selectedDocument : "وثائق الجلسة"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedDocument ? (
          <div>
            <iframe
              src={documentFiles[selectedDocument]}
              title={selectedDocument}
              width="100%"
              height="500px"
              style={{ border: "none" }}
            />
            <Button variant="secondary" onClick={handleGoBack} className="mb-3">
              العودة إلى قائمة الوثائق
            </Button>
          </div>
        ) : (
          <ul>
            {documents.map((doc, index) => (
              <li key={index}>
                <Button variant="link" onClick={() => handleDocumentClick(doc)}>
                  {doc}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          إغلاق
        </Button>
        {selectedDocument ? (
          <Button variant="primary" onClick={handlePrint}>
            طباعة الوثيقة
          </Button>
        ) : (
          <Button variant="primary" onClick={handlePrintAll}>
            طباعة جميع الوثائق
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentsModal;