// SuggestionTable.jsx
import React from 'react';
import { Table, Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaTrash, FaDownload } from 'react-icons/fa'; // Remove FaEdit
import './styles.css';

const SuggestionTable = ({ 
  suggestions = [], 
  onDelete = () => {},
  onDownloadDocument = () => {},
  isReadOnly = false
}) => {
  // Format attendees to handle empty or null cases
  const formatAttendees = (attendees) => {
    if (!attendees || attendees.length === 0) return 'لا يوجد حضور';
    return attendees.join('، ');
  };

  // Format date and time with Arabic locale
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'غير محدد';
    
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(dateTime).toLocaleString('ar-TN', options);
  };

  return (
      <Table striped bordered hover responsive className="mt-3 suggestion-table">
        <thead className="table-header">
          <tr>
            <th width="20%">محضر الجلسة عدد</th>
            <th width="20%">اللجنة</th>
            <th width="25%">الحضور</th>
            <th width="20%">التاريخ والساعة</th>
            <th width="10%">المستند</th>
            {!isReadOnly && <th width="5%">إجراءات</th>} {/* Reduced width since only delete remains */}
          </tr>
        </thead>
        <tbody>
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <tr key={suggestion.id || index}>
                <td>{suggestion.number || 'غير محدد'}</td>
                <td>
                  <Badge bg="info" className="committee-badge">
                    {suggestion.committee || 'غير محدد'}
                  </Badge>
                </td>
                <td>{formatAttendees(suggestion.attendees)}</td>
                <td>{formatDateTime(suggestion.dateTime)}</td>
                
                <td className="text-center">
                  {suggestion.documentPath ? (
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>تنزيل المستند</Tooltip>}
                    >
                      <Button 
                        variant="link" 
                        onClick={() => onDownloadDocument(suggestion.id)}
                        className="document-link p-0"
                      >
                        <FaDownload />
                      </Button>
                    </OverlayTrigger>
                  ) : (
                    <span className="text-muted">لا يوجد</span>
                  )}
                </td>
                {!isReadOnly && (
                  <td className="text-center">
                    {/* REMOVE EDIT BUTTON COMPLETELY */}
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>حذف</Tooltip>}
                    >
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => onDelete(index)}
                        className="action-btn"
                      >
                        <FaTrash />
                      </Button>
                    </OverlayTrigger>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={isReadOnly ? "5" : "6"} className="text-center text-muted py-4">
                لا توجد بيانات متاحة
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    );
  };

export default SuggestionTable;