import React from "react";
import { Button } from "react-bootstrap";

const PrintText = ({ title, content }) => {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const pageContent = `
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Arial', sans-serif; text-align: right; direction: rtl; padding: 20px; }
            h2 { text-align: center; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <p>${content}</p>
        </body>
      </html>
    `;
    printWindow.document.write(pageContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="mb-3">
      <Button variant="info" size="sm" onClick={() => alert(content)}>عرض</Button>{" "}
      <Button variant="success" size="sm" onClick={handlePrint}>طباعة</Button>
    </div>
  );
};

export default PrintText;
