import React, { useState } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";

const CandidateCard = ({ show, onHide, onComplete }) => {
  const [candidates, setCandidates] = useState([]);
  const [position, setPosition] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateFile, setCandidateFile] = useState(null);

  const positionsList = [
    "رئيس الجمعية",
    "نائب رئيس الجمعية",
    "أمين المال",
    "الكاتب العام",
    "نائب الكاتب العام",
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setCandidateFile(file);
    } else {
      alert("يرجى تحميل ملف PDF فقط.");
      e.target.value = null;
    }
  };

  const handleAddCandidate = () => {
    if (!position || !candidateName || !candidateFile) {
      alert("يرجى ملء جميع الحقول.");
      return;
    }

    const fileURL = URL.createObjectURL(candidateFile);
    const newCandidate = { position, candidateName, fileURL };

    setCandidates([...candidates, newCandidate]);

    // Reset inputs
    setPosition("");
    setCandidateName("");
    setCandidateFile(null);
  };

  const handleDeleteCandidate = (pos, index) => {
    setCandidates((prev) =>
      prev.filter((_, i) => !(prev[i].position === pos && i === index))
    );
  };

  const handleSubmit = () => {
    if (candidates.length === 0) {
      alert("يجب إضافة مرشح واحد على الأقل.");
      return;
    }
    onComplete(candidates);
    onHide();
  };

  // Group candidates by position
  const groupedCandidates = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.position]) {
      acc[candidate.position] = [];
    }
    acc[candidate.position].push(candidate);
    return acc;
  }, {});

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>إضافة مترشح</Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>المنصب</Form.Label>
            <Form.Select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <option value="">اختر المنصب</option>
              {positionsList.map((pos, index) => (
                <option key={index} value={pos}>
                  {pos}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>اسم المترشح</Form.Label>
            <Form.Control
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>رفع بطاقة المترشح (PDF فقط)</Form.Label>
            <Form.Control type="file" accept=".pdf" onChange={handleFileChange} />
          </Form.Group>

          <Button className="custom-btn" onClick={handleAddCandidate}>
            إضافة مرشح
          </Button>
        </Form>

        {candidates.length > 0 && (
          <>
            <h5 className="mt-4">قائمة المترشحين</h5>

            {/* Separate table for each منصب */}
            {Object.entries(groupedCandidates).map(([pos, candidates]) => (
              <div key={pos} className="mb-4">
                <h6 className="text-primary">{pos}</h6>
                <Table bordered hover>
                  <thead>
                    <tr>
                      <th>اسم المترشح</th>
                      <th>ملف المترشح</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c, index) => (
                      <tr key={index}>
                        <td>{c.candidateName}</td>
                        <td>
                          <Button
                            className="custom-btn"
                            size="sm"
                            onClick={() => window.open(c.fileURL, "_blank")}
                          >
                            عرض
                          </Button>
                        </td>
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteCandidate(pos, index)}
                          >
                            حذف
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ))}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          إلغاء
        </Button>
        <Button variant="success" onClick={handleSubmit}>
          تأكيد
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CandidateCard;
