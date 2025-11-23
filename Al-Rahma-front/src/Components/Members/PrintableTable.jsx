import React from "react";
import { Table, Button } from "react-bootstrap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PrintableTable = ({ members = [] }) => {
  const generatePDF = () => {
    const input = document.getElementById('printable-table');

    html2canvas(input, { scale: 3 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdfHeight = Math.ceil(imgHeight);

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pdfHeight);
      pdf.save('الاعضاء.pdf');
    });
  };

  return (
    <>
    <div style={{ margin: "20px" }} id="printable-table">
      <h2 style={{ textAlign: "center" }}>قائمة الأعضاء</h2>
      <div>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>اللقب</th>
              <th>رقم بطاقة تعريف</th>
              <th>رقم بطاقة الانخراط</th>
              <th>العنوان</th>
              <th>الجنسية</th>
              <th>العمر</th>
              <th>تاريخ الميلاد</th>
              <th>العمل</th>
              <th>رقم الهاتف</th>
              <th>تاريخ الانضمام</th>
              <th>ميدان التطوع</th>
              <th>تاريخ آخر تجديد</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? (
              members.map((member, index) => (
                <tr key={member.id}>
                  <td>{index + 1}</td>
                  <td>{member.name}</td>
                  <td>{member.lastname}</td>
                  <td>{member.cin}</td>
                  <td>{member.numcard}</td>
                  <td>{member.address}</td>
                  <td>{member.nationality}</td>
                  <td>{member.age}</td>
                  <td>{new Date(member.birthDate).toLocaleDateString()}</td>
                  <td>{member.work}</td>
                  <td>{member.tel}</td>
                  <td>{new Date(member.dateOfMembership).toLocaleDateString()}</td>
                  <td>{member.isVolunteering ? member.volunteerField : "لا"}</td>
                  <td>{new Date(member.lastUpdate).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="14">لا توجد بيانات</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

    </div>
          <Button className="custom-btn" onClick={generatePDF}>
          إنشاء ملف PDF
        </Button>
    </>
  );
};

export default PrintableTable;
