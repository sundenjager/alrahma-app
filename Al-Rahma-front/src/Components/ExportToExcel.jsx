// components/ExportToExcel.js
import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from 'react-bootstrap';
import { FaFileExcel } from 'react-icons/fa';

const ExportToExcel = ({ data, filename, buttonText = "تصدير إلى Excel", buttonProps = {} }) => {
  const exportToExcel = () => {
    // Prepare data for export
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename || 'export'}.xlsx`);
  };

  return (
    <Button 
      variant="outline-success" 
      onClick={exportToExcel}
      {...buttonProps}
    >
      <FaFileExcel className="me-2" />
      {buttonText}
    </Button>
  );
};

export default ExportToExcel;