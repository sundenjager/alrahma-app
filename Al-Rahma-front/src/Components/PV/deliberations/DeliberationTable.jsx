import React, { useState } from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import PropTypes from 'prop-types';
import AttendeesModal from './AttendeesModal.jsx';
import './styles.css';

const DeliberationTable = ({ 
  deliberations, 
  onDelete, 
  onDownloadDocument 
}) => {
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState([]);

  const handleShowAttendees = (attendees) => {
    setSelectedAttendees(attendees);
    setShowAttendeesModal(true);
  };

  const handleCloseAttendeesModal = () => {
    setShowAttendeesModal(false);
    setSelectedAttendees([]);
  };

  return (
    <>
      <Table striped bordered hover responsive className="mt-3 deliberation-table">
        <thead>
          <tr>
            <th width="15%">محضر الجلسة عدد</th>
            <th width="25%">الحضور</th>
            <th width="20%">التاريخ والساعة</th>
            <th width="15%">المستند</th>
            <th width="25%">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {deliberations.map((deliberation, index) => (
            <tr key={index}>
              <td>{deliberation.number}</td>
              <td>
                <Button 
                  variant="link" 
                  onClick={() => handleShowAttendees(deliberation.attendees)}
                  className="p-0 text-start"
                >
                  {deliberation.attendees.slice(0, 2).join('، ')}
                  {deliberation.attendees.length > 2 && (
                    <Badge bg="secondary" className="ms-2">
                      +{deliberation.attendees.length - 2}
                    </Badge>
                  )}
                </Button>
              </td>
              <td>
                {new Date(deliberation.dateTime).toLocaleDateString("ar-TN")}{' '}
                {new Date(deliberation.dateTime).toLocaleTimeString("ar-TN", { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </td>
              <td>
                {deliberation.documentPath ? (
                  <Button 
                    variant="link" 
                    onClick={() => onDownloadDocument(deliberation.id)}
                    className="document-link p-0"
                  >
                    تنزيل
                  </Button>
                ) : (
                  'لا يوجد مستند'
                )}
              </td>
              <td>
                {/* Only Delete button remains */}
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => onDelete(index)}
                >
                  حذف
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Attendees Modal */}
      <AttendeesModal
        show={showAttendeesModal}
        onHide={handleCloseAttendeesModal}
        attendees={selectedAttendees}
      />
    </>
  );
};

DeliberationTable.propTypes = {
  deliberations: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDownloadDocument: PropTypes.func.isRequired,
};

export default DeliberationTable;