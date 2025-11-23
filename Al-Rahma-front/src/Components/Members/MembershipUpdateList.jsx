import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';
import {
    getMembersNotUpdatedThisYear,
    getMembershipHistory,
    addMembershipUpdate
    
} from '../../services/membershipHistoryService';

const MembershipUpdateList = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpdateDatesModal, setShowUpdateDatesModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [updatedMemberData, setUpdatedMemberData] = useState({ cardNumber: '' });
    const [newUpdateDate, setNewUpdateDate] = useState('');
    const [updateDates, setUpdateDates] = useState([]); // New state for updateDates
    const [searchQuery, setSearchQuery] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [dateError, setDateError] = useState(null);
    const [error, setError] = useState(null); // Add this line
    const navigate = useNavigate();

    // Fetch members who did not update their membership this year
    useEffect(() => {
        const fetchMembersNotUpdatedThisYear = async () => {
            try {
                const data = await getMembersNotUpdatedThisYear();

                setMembers(data);
            } catch (error) {
                console.error('Error fetching members:', error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchMembersNotUpdatedThisYear();
    }, []);

    // Open the modal and set the selected member
    const handleShowUpdateDatesModal = (member) => {
        setSelectedMember(member);
        setShowUpdateDatesModal(true);
    };

    // Close the modal and reset states
    const handleCloseUpdateDatesModal = () => {
        setShowUpdateDatesModal(false);
        setSelectedMember(null);
        setUpdatedMemberData({ cardNumber: '' });
        setNewUpdateDate('');
        setUpdateDates([]); // Reset updateDates
        setModalLoading(false);
        setModalError(null);
    };

    // Fetch membership history when the modal is opened
        useEffect(() => {
        if (showUpdateDatesModal && selectedMember) {
            const fetchMembershipHistory = async () => {
            setModalLoading(true);
            setModalError(null);
            try {
                const history = await getMembershipHistory(selectedMember.id);



                // Store full history objects with card numbers
                setUpdateDates(history.map((entry) => ({
                id: entry.id,
                updateDate: entry.updateDate,
                cardNumber: entry.cardNumber
                })));
            } catch (error) {
                console.error('Error fetching membership history:', error);
                setModalError('فشل في جلب تاريخ العضوية. يرجى المحاولة مرة أخرى.');
            } finally {
                setModalLoading(false);
            }
            };

            fetchMembershipHistory();
        }
        }, [showUpdateDatesModal, selectedMember]);

    // Add a new membership update
    const handleAddUpdateDate = async () => {
    try {
        // Clear previous errors
        setError(null);
        setDateError(null);
        setModalLoading(true);

        // Validate date is selected
        if (!newUpdateDate) {
        throw new Error("يرجى اختيار تاريخ التحديث");
        }

        const today = new Date();
        const selectedDate = new Date(newUpdateDate);
        
        // Validate date is not in the future
        if (selectedDate > today) {
        throw new Error("لا يمكن إضافة تاريخ في المستقبل");
        }

        // Get most recent existing date
        const mostRecentDate = getMostRecentDate(selectedMember);
        
        // Validate new date is not before the most recent date
        if (mostRecentDate && selectedDate < mostRecentDate) {
        throw new Error(`تاريخ التحديث الجديد يجب أن يكون بعد آخر تاريخ (${mostRecentDate.toLocaleDateString()})`);
        }

        // Validate card number
        if (!selectedMember.numcard && !updatedMemberData.cardNumber) {
        throw new Error("يرجى إدخال رقم البطاقة");
        }

        // Prepare update data
        const updateData = {
        memberId: selectedMember.id,
        updateDate: newUpdateDate,
        cardNumber: updatedMemberData.cardNumber || selectedMember.numcard
        };

        // Make API call
        const result = await addMembershipUpdate(
        updateData.memberId,
        updateData.updateDate,
        updateData.cardNumber
        );

        // Update state
        const updatedMembers = members.map(m =>
        m.id === selectedMember.id
            ? {
                ...m,
                numcard: updateData.cardNumber,
                updateDates: [...(m.updateDates || []), updateData.updateDate]
            }
            : m
        );

        setMembers(updatedMembers);
        setUpdateDates([...(updateDates || []), updateData.updateDate]);
        setNewUpdateDate('');
        setModalError(null);
    } catch (error) {
        console.error('Update Error:', error);
        setModalError(error.message || 'حدث خطأ غير متوقع أثناء تحديث العضوية');
    } finally {
        setModalLoading(false);
    }
    };

    const getMostRecentDate = (member) => {
        if (!member) return null;
        
        // Get all valid dates from updateDates
        const validUpdateDates = (member.updateDates || [])
            .map(date => new Date(date))
            .filter(date => !isNaN(date.getTime()));
        
        // Get membership date if available
        const membershipDate = member.dateOfMembership ? new Date(member.dateOfMembership) : null;
        
        // Find the most recent date
        const allDates = [...validUpdateDates];
        if (membershipDate && !isNaN(membershipDate.getTime())) {
            allDates.push(membershipDate);
        }
        
        return allDates.length > 0 ? new Date(Math.max(...allDates)) : null;
        };

    // Navigate back to the members table
    const handleGoBack = () => {
        navigate('/member');
    };

    // Filter members based on search query
    const filteredMembers = members.filter(
        (member) =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.cin.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.tel.includes(searchQuery)
    );

    // Display loading spinner while fetching data
    if (loading) {
        return <div>جاري التحميل...</div>;
    }

    // Display message if no members are found
    if (!filteredMembers.length) {
        return <div>لا توجد أشخاص لديهم عضويات قديمة.</div>;
    }

    return (
        <div className="container mt-4">
            <button className="custom-btn" onClick={handleGoBack}>
                العودة إلى جدول الأعضاء
            </button>
            <h2>الأشخاص الذين لديهم انخراطات قديمة</h2>

            {/* Search Bar */}
            <Form.Group className="mb-3">
                <Form.Control
                    type="text"
                    placeholder="ابحث عن عضو بالاسم أو CIN أو الهاتف"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </Form.Group>

            {/* Members Table */}
            <table className="table table-striped table-bordered">
              <thead className="table-dark">
                  <tr>
                      <th>الاسم</th>
                      <th>CIN</th>
                      <th>الهاتف</th>
                      <th>تاريخ آخر تحديث</th>
                      <th>الإجراءات</th>
                  </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {

                    return (
                        <tr key={member.id}>
                            <td>{member.name}</td>
                            <td>{member.cin}</td>
                            <td>{member.tel}</td>
                            <td>
                                {member.updateDates && member.updateDates.length > 0
                                    ? (() => {
                                        const validDates = member.updateDates.filter((date) => !isNaN(new Date(date).getTime()));
                                        return validDates.length > 0
                                            ? new Date(Math.max(...validDates.map((date) => new Date(date)))).toLocaleDateString()
                                            : 'لا يوجد تاريخ';
                                    })()
                                    : 'لا يوجد تاريخ'}
                            </td>
                            <td>
                                <Button
                                    className="custom-btn"
                                    onClick={() => handleShowUpdateDatesModal(member)}
                                >
                                    تجديد الانخراط
                                </Button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            </table>

            {/* Update Dates Modal */}
            <Modal show={showUpdateDatesModal} onHide={handleCloseUpdateDatesModal}>
                <Modal.Header closeButton>
                    <Modal.Title>تجديد الانخراط</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <Form.Group>
                    <Form.Label>تواريخ التحديث الحالية</Form.Label>
                    {modalLoading ? (
                        <div className="text-center py-2">
                        <Spinner animation="border" size="sm" />
                        <span className="me-2">جاري تحميل التاريخ...</span>
                        </div>
                    ) : updateDates.length > 0 ? (
                        <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                            <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>رقم البطاقة</th>
                            </tr>
                            </thead>
                            <tbody>
                            {updateDates.map((entry, index) => (
                                <tr key={entry.id || index}>
                                <td>{new Date(entry.updateDate).toLocaleDateString('ar-TN')}</td>
                                <td><code>{entry.cardNumber}</code></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    ) : (
                        <div className="text-muted text-center py-2">لا توجد تواريخ تحديث</div>
                    )}
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>رقم البطاقة الجديد</Form.Label>
                        <Form.Control
                            type="text"
                            value={updatedMemberData.cardNumber || selectedMember?.numcard || ''}
                            onChange={(e) => setUpdatedMemberData({
                            ...updatedMemberData,
                            cardNumber: e.target.value
                            })}
                        />
                        <Form.Label>تاريخ التجديد</Form.Label>
                        <Form.Control
                            type="date"
                            value={newUpdateDate}
                            onChange={(e) => {
                                setNewUpdateDate(e.target.value);
                                setDateError(null);
                            }}
                            max={new Date().toISOString().split('T')[0]} // Can't be in the future
                            min={(() => {
                                const mostRecentDate = getMostRecentDate(selectedMember);
                                return mostRecentDate ? mostRecentDate.toISOString().split('T')[0] : undefined;
                            })()}
                            />
                        {dateError && <div className="text-danger mt-2">{dateError}</div>}
                    </Form.Group>

                    {modalError && <div className="text-danger mt-2">{modalError}</div>}

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseUpdateDatesModal}>
                        إغلاق
                    </Button>
                    <Button
                        className="custom-btn"
                        onClick={handleAddUpdateDate}
                        disabled={modalLoading}
                    >
                        تجديد الانخراط
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default MembershipUpdateList;