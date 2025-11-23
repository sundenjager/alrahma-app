import React from "react";
import { Button } from "react-bootstrap";
import { FaPrint } from "react-icons/fa";
import { printDocument } from "../../services/sessionService"; // Adjust path as needed

const DocumentPrintView = ({ title, sessionId, documentType }) => {
  const handleClick = () => {
    if (!sessionId || !documentType) {
      console.error("Missing sessionId or documentType");
      return;
    }
    printDocument(sessionId, documentType, title);
  };

  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h6>{title}</h6>
      <Button 
        variant="outline-secondary"
        onClick={handleClick}
      >
        <FaPrint className="me-2" />
        طباعة
      </Button>
    </div>
  );
};

export default DocumentPrintView;
