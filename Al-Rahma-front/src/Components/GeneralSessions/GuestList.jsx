import React from "react";
import { Table, Button } from "react-bootstrap";
import { FaPhone, FaPrint } from "react-icons/fa";
import "./GuestList.css"; 

const GuestList = ({ guests }) => {
  const handlePrint = () => {
    const printContent = document.getElementById("guest-list-print").innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div class="print-container">
        <h2>قائمة الضيوف</h2>
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
  };

  return (
    <div>
      {/* Interactive Table */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>قائمة الضيوف التفاعلية</h5>
          <Button variant="outline-secondary" onClick={handlePrint}>
            <FaPrint className="me-2" />
            طباعة القائمة
          </Button>
        </div>
        
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>المنصب</th>
              <th>المؤسسة</th>
              <th>الهاتف</th>
              <th>اتصال</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest, index) => (
              <tr key={index}>
                <td>{guest.name}</td>
                <td>{guest.position}</td>
                <td>{guest.organization || "غير محدد"}</td>
                <td>{guest.phone}</td>
                <td className="text-center">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    href={`tel:${guest.phone}`}
                    className="call-button"
                  >
                    <FaPhone />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Printable Version (hidden on screen) */}
      <div id="guest-list-print" style={{ display: "none" }}>
        <Table bordered>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>المنصب</th>
              <th>المؤسسة</th>
              <th>الهاتف</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest, index) => (
              <tr key={index}>
                <td>{guest.name}</td>
                <td>{guest.position}</td>
                <td>{guest.organization || "غير محدد"}</td>
                <td>{guest.phone}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default GuestList;