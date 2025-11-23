import React from "react";

const PrintList = ({ list, title }) => {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    const tableContent = `
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Arial', sans-serif; text-align: right; direction: rtl; }
            table { width: 100%; border-collapse: collapse; text-align: right; direction: rtl; }
            th, td { border: 1px solid black; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            h2 { text-align: center; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <table>
            <thead>
              <tr>
                <th>الرقم</th>
                <th>الاسم</th>
                <th>اللقب</th>
                <th>رقم الهاتف</th>

                <th>التوقيع</th>
              </tr>
            </thead>
            <tbody>
              ${list
                .map(
                  (person, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${person.firstName || ""}</td>
                  <td>${person.lastName || ""}</td>
                  <td>${person.phone || ""}</td>

                  <td></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <button className="btn btn-success btn-sm" onClick={handlePrint}>
      طباعة {title}
    </button>
  );
};

export default PrintList;
