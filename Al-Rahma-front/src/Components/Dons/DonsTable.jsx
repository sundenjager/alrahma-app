import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Nav } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import SearchBar from '../SearchBar';
import DataCounter from '../DataCounter';

const DonsTable = () => {
  const [dons, setDons] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filteredDons, setFilteredDons] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [donsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    id: '',
    reference: '',
    categorie: '',
    brand: '',
    source: '',
    sourceNature: '',
    usage: '',
    dateOfEntry: '',
    dateOfExit: '',
    status: 'صالح',
    description: '',
    legalFile: null,
    isMonetary: 'نقدي',
    isPrivate: 'عمومي',
    monetaryValue: '',
  });

  // Fetch donations data
  useEffect(() => {
    const fetchDons = async () => {
      const staticDons = [

      ];

      setDons(staticDons);
    };
    fetchDons();
  }, []);

  // Generate the years for filtering
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2010;
    const allYears = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);
    setYears(allYears);
  }, []);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const filtered = dons.filter((don) => {
      const entryYear = new Date(don.dateOfEntry).getFullYear();
      const exitYear = don.dateOfExit ? new Date(don.dateOfExit).getFullYear() : null;
  
      // If selected year is 'all', show all donations
      if (selectedYear === 'all') {
        return true;
      }
  
      // If there's no exit date, show donations from entry year to current year
      if (!exitYear) {
        return entryYear <= selectedYear && selectedYear <= currentYear;
      } else {
        // If there's an exit date, show only for the entry year and years before exit
        return entryYear === selectedYear || (entryYear <= selectedYear && selectedYear <= exitYear);
      }
    });
    setFilteredDons(filtered);
  }, [selectedYear, dons]);

  // Handle search functionality
  const handleSearch = (query, searchFields) => {
    if (!query) {
      setFilteredDons(dons);
      return;
    }
    const lowerCaseQuery = query.toLowerCase();
    const filtered = dons.filter((don) =>
      searchFields.some((field) => don[field].toString().toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredDons(filtered);
  };

  // Delete confirmation
  const handleDeleteConfirm = () => {
    const updatedDons = dons.filter((_, i) => i !== deletingIndex);
    setDons(updatedDons);
    setFilteredDons(updatedDons);
    setShowDeleteConfirm(false);
  };

  // Edit donation
  const handleEdit = (index) => {
    setEditingIndex(index);
    setFormData(dons[index]);
  };

  // Save edited donation
  const handleSave = (index) => {
    // Validate form data
    if (!formData.reference || !formData.categorie) {
      alert('المرجع والفئة مطلوبان.');
      return;
    }

    const updatedDons = [...dons];
    updatedDons[index] = formData;
    setDons(updatedDons);
    setFilteredDons(updatedDons);
    setFormData({
      id: '',
      reference: '',
      categorie: '',
      brand: '',
      source: '',
      sourceNature: '',
      usage: '',
      dateOfEntry: '',
      dateOfExit: '',
      status: 'صالح',
      description: '',
      legalFile: null,
      isMonetary: 'نقدي',
      isPrivate: 'عمومي',
      monetaryValue: '',
    });
    setEditingIndex(null);
  };

  // Handle changes in form input
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'file' ? files[0] : value,
    }));
  };

  // Handle delete click
  const handleDeleteClick = (index) => {
    setShowDeleteConfirm(true);
    setDeletingIndex(index);
  };

  // Close delete confirmation modal
  const handleCloseDeleteConfirm = () => setShowDeleteConfirm(false);

  // Download CSV
  const downloadCSV = () => {
    const csvRows = [];
    const headers = ['المرجع', 'الفئة', 'العلامة التجارية', 'المصدر', 'الاستعمال', 'تاريخ الدخول', 'تاريخ الخروج', 'معدات طبية', 'أصول ثابتة', 'الحالة', 'الوصف', 'الملف القانوني'];
    csvRows.push(headers.join(','));

    filteredDons.forEach(don => {
      const values = [
        don.reference,
        don.categorie,
        don.brand,
        don.sourceNature,
        don.source,
        don.usage,
        don.dateOfEntry,
        don.dateOfExit || '-',
        don.status,
        don.description,
        don.monetaryValue || '-',
        don.legalFile ? don.legalFile.name : '-',
      ];
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'dons.csv');
    a.click();
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredDons.length / donsPerPage);
  const indexOfLastDon = currentPage * donsPerPage;
  const indexOfFirstDon = indexOfLastDon - donsPerPage;
  const currentDons = filteredDons.slice(indexOfFirstDon, indexOfLastDon);

  return (
    <>
      <div className="mb-3">
        <Nav variant="tabs" className="year-nav-tabs mb-3">
          <Nav.Item key="see-all" className="year-nav-item">
            <Nav.Link
              className={`year-nav-link ${selectedYear === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedYear('all')}
            >
              عرض الكل
            </Nav.Link>
          </Nav.Item>
          {years.map((year) => (
            <Nav.Item key={year} className="year-nav-item">
              <Nav.Link
                className={`year-nav-link ${selectedYear === year ? 'active' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>

      <div className="row">
        <div className="col">
          <SearchBar searchFields={['reference', 'categorie', 'source', 'usage']} onSearch={handleSearch} />
        </div>
        <div className="col">
          <DataCounter count={filteredDons.length} />
        </div>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th> {/* id */}
            <th>رقم التسلسل</th> {/* reference */}
            <th>الفئة</th> {/* categorie */}
            <th>العلامة التجارية</th> {/* brand */}
            <th>طبيعة المصدر</th> {/* sourceNature */}
            <th>المصدر</th> {/* source */}
            <th>المستفيد</th> {/* usage */}
            <th>تاريخ الدخول</th> {/* dateOfEntry */}
            <th>تاريخ الخروج</th> {/* dateOfExit */}
            <th>القيمة النقدية</th>
            <th>الحالة</th> {/* status */}
            <th>الوصف</th> {/* description */}
            <th>الملف القانوني</th> {/* legalFile */}
            <th>نوع التبرع</th> {/* isMonetary */}
            <th>خاص / عمومي</th> {/* isPrivate */}
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {currentDons.map((don, index) => {
            const {
              id,
              reference,
              categorie,
              brand,
              sourceNature,
              source,
              usage,
              dateOfEntry,
              dateOfExit,
              status,
              description,
              legalFile,
              isMonetary,
              isPrivate,
              monetaryValue,
            } = don;

            return (
              <tr key={index}>
                {editingIndex === index ? (
                  <>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="categorie"
                        value={formData.categorie}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="sourceNature"
                        value={formData.sourceNature}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="source"
                        value={formData.source}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="usage"
                        value={formData.usage}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        name="dateOfEntry"
                        value={formData.dateOfEntry}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        name="dateOfExit"
                        value={formData.dateOfExit}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="monetaryValue"
                        value={formData.monetaryValue}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="صالح">صالح</option>
                        <option value="معطب">معطب</option>
                        <option value="تم إتلافه">تم إتلافه</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        type="file"
                        name="legalFile"
                        onChange={(e) =>
                          handleInputChange({
                            target: { name: 'legalFile', value: e.target.files[0] },
                          })
                        }
                      />
                    </td>
                    <td>
                      <select
                        name="isMonetary"
                        value={formData.isMonetary}
                        onChange={handleInputChange}
                      >
                        <option value="نقدي">نقدي</option>
                        <option value="عيني">عيني</option>
                      </select>
                    </td>
                    <td>
                      <select
                        name="isPrivate"
                        value={formData.isPrivate}
                        onChange={handleInputChange}
                      >
                        <option value="عمومي">عمومي</option>
                        <option value="خاص">خاص</option>
                      </select>
                    </td>
                    <td>
                      <Button
                        variant="outline-success"
                        onClick={() => handleSave(index)}
                      >
                        <FaSave /> حفظ
                      </Button>{' '}
                      <Button
                        variant="outline-secondary"
                        onClick={() => setEditingIndex(null)}
                      >
                        <FaTimes /> إلغاء
                      </Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{index + 1}</td>
                    <td>{id}</td>
                    <td>{reference}</td>
                    <td>{categorie}</td>
                    <td>{brand}</td>
                    <td>{sourceNature}</td>
                    <td>{source}</td>
                    <td>{usage}</td>
                    <td>{dateOfEntry}</td>
                    <td>{dateOfExit || '-'}</td>
                    <td>{monetaryValue || '-'}</td> {/* Display monetary value */}
                    <td>{status}</td>
                    <td>{description}</td>
                    <td>
                      {legalFile ? (
                        <Button
                          className="custom-btn"
                          onClick={() => {
                            const url = URL.createObjectURL(legalFile);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = legalFile.name || 'document.pdf';
                            document.body.appendChild(a);
                            a.click();
                            URL.revokeObjectURL(url); // Cleanup memory
                            document.body.removeChild(a);
                          }}
                        >
                          تحميل الملف
                        </Button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{isMonetary}</td>
                    <td>{isPrivate}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        onClick={() => handleEdit(index)}
                      >
                        <FaEdit /> تعديل
                      </Button>{' '}
                      <Button
                        variant="outline-danger"
                        onClick={() => handleDeleteClick(index)}
                      >
                        <FaTrash /> حذف
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </Table>



      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={handleCloseDeleteConfirm}>
        <Modal.Header closeButton>
          <Modal.Title>تأكيد الحذف</Modal.Title>
        </Modal.Header>
        <Modal.Body>هل أنت متأكد أنك تريد حذف هذا السجل؟</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteConfirm}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            حذف
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DonsTable;
