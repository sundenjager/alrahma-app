import React, { useState, useEffect } from 'react';
import { Button, Form, Row, Col, ListGroup, Badge, Accordion, Spinner } from 'react-bootstrap';
import { getMembersByCommitteeAndYear } from '../../services/memberService';
import { createProgram, updateProgram } from '../../services/SuggestedProgramsService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProgramForm = ({ committee, editingProgram, onCancel }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    project: '',
    projectCode: '',
    startDate: new Date().toISOString().split('T')[0],
    completionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period: '',
    place: '',
    beneficiaries: '',
    beneficiariesOther: '',
    beneficiariesCount: '',
    targetGroup: '',
    targetGroupOther: '',
    budget: 0,
    totalCost: 0,
    budgetSource: '',
    budgetSourceOther: '',
    fundingStatus: '',
    implementationStatus: 'pending',
    statusComment: '',
    budgetCommentary: '',
    projectManager: '',
    contactPhone: '',
    details: '',
    notes: '',
    refusalCommentary: '',
    committee: committee || '',
    partners: editingProgram?.partners || [],
    year: new Date().getFullYear().toString()
  });

  const [phases, setPhases] = useState([]);
  const [newPhase, setNewPhase] = useState({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
    budget: 0,
    programType: 'Suggested Program',
    tasks: []
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
  });

  const [newPartner, setNewPartner] = useState({
    name: '',
    type: 'Financial',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    contributionAmount: 0,
    contributionType: 'Cash'
  });

  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

const committees = [
  'الهيئة المديرة',
  'لجنة الشباب',
  'لجنة التخطيط و الدراسات',
  'لجنة التنمية',
  'لجنة الكفالة',
  'لجنة الاسرة',
  'لجنة الصحة'
];

  const budgetSources = [
    'تمويل ذاتي (الجمعية)',
    'تبرعات موجهة',
    'شراكة مع القطاع الخاص',
    'أخرى'
  ];

  const fundingStatuses = [
    'تم التمويل بالكامل',
    'تمويل جزئي',
    'في انتظار التمويل',
    'غير ممول'
  ];

  const targetGroups = [
    'أطفال',
    'شباب',
    'مراهقين',
    'نساء حوامل',
    'أمهات',
    'أمهات التلاميذ',
    'أرامل',
    'أسر فقيرة',
    'أسر محتاجة',
    'أسر الأيتام',
    'رجال',
    'نساء',
    'عائلات',
    'كبار السن',
    'أشخاص ذوي إعاقة',
    'أخرى'
  ];

  useEffect(() => {
    if (editingProgram) {
      const { phases: programPhases = [], ...mainFormData } = editingProgram;
      setFormData({
        ...mainFormData,
        committee: mainFormData.committee || committee || '',
        startDate: mainFormData.startDate?.split('T')[0] || '',
        completionDate: mainFormData.completionDate?.split('T')[0] || '',
        projectManager: mainFormData.projectManager || '',
        beneficiariesOther: mainFormData.beneficiaries === 'أخرى' ? mainFormData.beneficiaries : '',
        targetGroupOther: mainFormData.targetGroup === 'أخرى' ? mainFormData.targetGroup : '',
        budgetSourceOther: mainFormData.budgetSource === 'أخرى' ? mainFormData.budgetSource : ''
      });

      setPhases(programPhases.map(phase => ({
        ...phase,
        startDate: phase.startDate?.split('T')[0] || '',
        endDate: phase.endDate?.split('T')[0] || '',
        tasks: phase.tasks || []
      })));
    }
  }, [editingProgram, committee]);

useEffect(() => {
  const fetchMembers = async () => {
    if (!formData.committee) {
      setCommitteeMembers([]);
      setFilteredMembers([]);
      return;
    }

    setLoadingMembers(true);
    
    try {
      const previousYear = new Date().getFullYear() - 1;
      const members = await getMembersByCommitteeAndYear(formData.committee, previousYear);
      
      console.log(`Found ${members.length} volunteers for ${previousYear}`);
      
      const formattedMembers = members.map(member => ({
        id: member.id,
        fullName: member.fullName,
        cin: member.cin,
        tel: member.tel,
        volunteerField: member.volunteerField
      }));

      setCommitteeMembers(formattedMembers);
      setFilteredMembers(formattedMembers);
      
      if (members.length === 0) {
        toast.info(`لا يوجد متطوعون مسجلون في ${formData.committee} للسنة ${previousYear}`);
      }
      
    } catch (error) {
      console.error('Error fetching volunteers:', error.message);
      toast.error(error.message || `خطأ في جلب متطوعين ${formData.committee}`);
      setCommitteeMembers([]);
      setFilteredMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  fetchMembers();
}, [formData.committee]);



  useEffect(() => {
    if (formData.startDate && formData.completionDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.completionDate);

      if (end > start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffMonths / 12);

        let periodText = '';
        if (diffYears > 0) {
          periodText += `${diffYears} سنة `;
          const remainingMonths = diffMonths % 12;
          if (remainingMonths > 0) periodText += `${remainingMonths} أشهر`;
        } else if (diffMonths > 0) {
          periodText += `${diffMonths} أشهر`;
          const remainingDays = diffDays % 30;
          if (remainingDays > 0) periodText += ` و ${remainingDays} يوم`;
        } else {
          periodText += `${diffDays} يوم`;
        }

        setFormData(prev => ({ ...prev, period: periodText }));
      }
    }
  }, [formData.startDate, formData.completionDate]);

  // Add this useEffect to log available committees (temporary for debugging)
useEffect(() => {
  const checkCommittees = async () => {
    try {
      // You might want to add an endpoint to get all available committees
      console.log('Frontend committees:', committees);
    } catch (error) {
      console.error('Error checking committees:', error);
    }
  };
  
  if (formData.committee) {
    checkCommittees();
  }
}, [formData.committee]);

  // Add this right after your state declarations for debugging
  useEffect(() => {
    console.log('=== DEBUG: Component State ===');
    console.log('formData.committee:', formData.committee);
    console.log('committeeMembers:', committeeMembers);
    console.log('filteredMembers:', filteredMembers);
    console.log('loadingMembers:', loadingMembers);
  }, [formData.committee, committeeMembers, filteredMembers, loadingMembers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'beneficiaries' && value !== 'أخرى' ? { beneficiariesOther: '' } : {}),
      ...(name === 'targetGroup' && value !== 'أخرى' ? { targetGroupOther: '' } : {}),
      ...(name === 'budgetSource' && value !== 'أخرى' ? { budgetSourceOther: '' } : {})
    }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      [`${name}Other`]: value === 'أخرى' ? prev[`${name}Other`] : ''
    }));
  };

  const handleOtherInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManagerSelection = (fullName) => {
    setFormData(prev => ({
      ...prev,
      projectManager: fullName
    }));
  };

  const handleCustomManagerChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      projectManager: value
    }));
  };

  const handlePartnerChange = (e) => {
    const { name, value } = e.target;
    setNewPartner(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPartner = () => {
    if (!newPartner.name) {
      toast.warning('يرجى إدخال اسم الشريك على الأقل');
      return;
    }

    const partnerToAdd = {
      name: newPartner.name,
      type: newPartner.type || undefined,
      contactPerson: newPartner.contactPerson || undefined,
      contactPhone: newPartner.contactPhone || undefined,
      contactEmail: newPartner.contactEmail || undefined,
      contributionType: newPartner.contributionType || undefined,
      contributionAmount: newPartner.contributionAmount || undefined
    };

    setFormData(prev => ({
      ...prev,
      partners: [...prev.partners, partnerToAdd]
    }));

    setNewPartner({
      name: '',
      type: 'Financial',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      contributionAmount: 0,
      contributionType: 'Cash'
    });
  };

  const handleRemovePartner = (index) => {
    setFormData(prev => ({
      ...prev,
      partners: prev.partners.filter((_, i) => i !== index)
    }));
  };

  const handlePhaseChange = (e) => {
    const { name, value } = e.target;
    setNewPhase(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };


  const handleAddTask = () => {
    if (!newTask.title) {
      toast.warning('يرجى إدخال عنوان للمهمة');
      return;
    }

    setNewPhase(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        title: newTask.title,
        description: newTask.description,
      }]
    }));

    setNewTask({ title: '', description: '' });
  };

  const handleRemoveTask = (index) => {
    setNewPhase(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const handleAddPhase = () => {
    setPhases(prev => [...prev, {
      title: newPhase.title,
      startDate: newPhase.startDate,
      endDate: newPhase.endDate,
      description: newPhase.description,
      budget: parseFloat(newPhase.budget) || 0,
      tasks: [...newPhase.tasks]
    }]);

    setNewPhase({
      title: '',
      startDate: '',
      endDate: '',
      description: '',
      budget: 0,
      tasks: []
    });
    setNewTask({ title: '', description: '' });
  };

  const handleRemovePhase = (index) => {
    setPhases(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.project || !formData.committee) {
      toast.error('يرجى إدخال اسم المشروع واختيار اللجنة');
      return;
    }

    if (new Date(formData.completionDate) < new Date(formData.startDate)) {
      toast.error('تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء');
      return;
    }

    setIsSubmitting(true);

    try {
      const programData = {
        ...formData,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        completionDate: formData.completionDate || new Date().toISOString().split('T')[0],
        budget: parseFloat(formData.budget) || 0,
        totalCost: parseFloat(formData.totalCost) || 0,
        beneficiariesCount: parseInt(formData.beneficiariesCount) || 0,
        phases: phases.map(phase => ({
          title: phase.title || '',
          startDate: phase.startDate || formData.startDate,
          endDate: phase.endDate || formData.completionDate,
          description: phase.description || '',
          budget: parseFloat(phase.budget) || 0,
          tasks: phase.tasks.map(task => ({
            title: task.title || '',
            description: task.description || '',
            status: 'pending',
          }))
        }))
      };

      if (!programData.projectManager) {
        programData.projectManager = 'غير محدد';
      }

      if (editingProgram) {
        await updateProgram({ ...programData, id: editingProgram.id });
        toast.success('تم تحديث المشروع بنجاح');
      } else {
        await createProgram(programData);
        toast.success('تم إنشاء المشروع بنجاح');
      }

      navigate('/suggested-programs');
    } catch (error) {
      console.error('Error submitting program:', error);
      toast.error(error.message || 'حدث خطأ أثناء حفظ المشروع');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white shadow-sm" dir="rtl">
      <Form onSubmit={handleSubmit}>
        <div className="mb-4">
          <h5 className="mb-3 text-primary border-bottom pb-2">المعلومات الأساسية</h5>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>اسم المشروع *</Form.Label>
                <Form.Control
                  type="text"
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>كود المشروع</Form.Label>
                <Form.Control
                  type="text"
                  name="projectCode"
                  value={formData.projectCode}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>اللجنة *</Form.Label>
                <Form.Control
                  as="select"
                  name="committee"
                  value={formData.committee}
                  onChange={handleChange}
                  required
                >
                  <option value="">اختر اللجنة</option>
                  {committees.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>المسؤول عن المشروع</Form.Label>
                {formData.committee ? (
                  loadingMembers ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <div className="border rounded p-2 mb-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {filteredMembers.length > 0 ? (
                          <>
                            {filteredMembers.map(member => (
                              <Form.Check
                                key={member.cin || member.id || Math.random()}
                                type="radio"
                                id={`manager-${member.cin || member.id}`}
                                name="projectManagerRadio"
                                label={member.fullName}
                                checked={formData.projectManager === member.fullName}
                                onChange={() => handleManagerSelection(member.fullName)}
                                className="mb-2"
                              />
                            ))}
                            <Form.Check
                              type="radio"
                              id="manager-custom"
                              name="projectManagerRadio"
                              label="آخر (حدد يدوياً)"
                              checked={!filteredMembers.some(m => m.fullName === formData.projectManager)}
                              onChange={() => handleManagerSelection('')}
                              className="mb-2"
                            />
                          </>
                        ) : (
                          <div className="text-muted">لا يوجد أعضاء مسجلين في هذه اللجنة</div>
                        )}
                      </div>
                      {(!formData.projectManager || !filteredMembers.some(m => m.fullName === formData.projectManager)) && (
                        <Form.Control
                          type="text"
                          name="projectManager"
                          value={formData.projectManager}
                          onChange={handleCustomManagerChange}
                          placeholder="أدخل اسم المسؤول"
                        />
                      )}
                    </>
                  )
                ) : (
                  <div className="text-muted">يرجى اختيار اللجنة أولاً</div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="mb-4">
          <h5 className="mb-3 text-primary border-bottom pb-2">الجدول الزمني</h5>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>تاريخ البدء</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>تاريخ الانتهاء</Form.Label>
                <Form.Control
                  type="date"
                  name="completionDate"
                  value={formData.completionDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="mb-4">
          <h5 className="mb-3 text-primary border-bottom pb-2">المستفيدون</h5>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>الفئة المستفيدة</Form.Label>
                <Form.Control
                  as="select"
                  name="beneficiaries"
                  value={formData.beneficiaries}
                  onChange={handleSelectChange}
                >
                  <option value="">اختر الفئة المستفيدة</option>
                  <option value="الأيتام">الأيتام</option>
                  <option value="العائلات المعوزة">العائلات المعوزة</option>
                  <option value="العائلات المعوزة و الأيتام">العائلات المعوزة و الأيتام</option>
                  <option value="مبرمج">مبرمج</option>
                  <option value="غير مبرمج">غير مبرمج</option>
                  <option value="استثنائي">استثنائي</option>
                  <option value="أخرى">أخرى</option>
                </Form.Control>
                {formData.beneficiaries === 'أخرى' && (
                  <Form.Control
                    type="text"
                    name="beneficiariesOther"
                    value={formData.beneficiariesOther}
                    onChange={handleOtherInputChange}
                    placeholder="حدد الفئة المستفيدة"
                    className="mt-2"
                  />
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>الفئة المستهدفة</Form.Label>
                <Form.Control
                  as="select"
                  name="targetGroup"
                  value={formData.targetGroup}
                  onChange={handleSelectChange}
                >
                  <option value="">اختر الفئة المستهدفة</option>
                  {targetGroups.map((g, i) => (
                    <option key={i} value={g}>{g}</option>
                  ))}
                </Form.Control>
                {formData.targetGroup === 'أخرى' && (
                  <Form.Control
                    type="text"
                    name="targetGroupOther"
                    value={formData.targetGroupOther}
                    onChange={handleOtherInputChange}
                    placeholder="حدد الفئة المستهدفة"
                    className="mt-2"
                  />
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>عدد المستفيدين المتوقع</Form.Label>
                <Form.Control
                  type="number"
                  name="beneficiariesCount"
                  value={formData.beneficiariesCount}
                  onChange={handleChange}
                  min="0"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>هاتف التواصل</Form.Label>
                <Form.Control
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="mb-4">
          <h5 className="mb-3 text-primary border-bottom pb-2">المعلومات المالية</h5>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>الميزانية المقترحة</Form.Label>
                <Form.Control
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>التكلفة الإجمالية</Form.Label>
                <Form.Control
                  type="number"
                  name="totalCost"
                  value={formData.totalCost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>مصدر التمويل</Form.Label>
                <Form.Control
                  as="select"
                  name="budgetSource"
                  value={formData.budgetSource}
                  onChange={handleSelectChange}
                >
                  <option value="">اختر مصدر التمويل</option>
                  {budgetSources.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </Form.Control>
                {formData.budgetSource === 'أخرى' && (
                  <Form.Control
                    type="text"
                    name="budgetSourceOther"
                    value={formData.budgetSourceOther}
                    onChange={handleOtherInputChange}
                    placeholder="حدد مصدر التمويل"
                    className="mt-2"
                  />
                )}
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="mb-4">
          <h5 className="mb-3 text-primary border-bottom pb-2">معلومات إضافية</h5>
          <Form.Group className="mb-3">
            <Form.Label>تفاصيل المشروع</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="details"
              value={formData.details}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>ملاحظات إضافية</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </Form.Group>
        </div>

        <div className="mb-4 border-top pt-4">
          <h5 className="mb-3 text-primary">إدارة مراحل المشروع (اختياري)</h5>

          {phases.length > 0 && (
            <div className="mb-4">
              <h6>المراحل المضافة</h6>
              <Accordion>
                {phases.map((phase, i) => (
                  <Accordion.Item key={i} eventKey={i.toString()}>
                    <Accordion.Header>
                      <Badge bg="info" className="me-2">{i + 1}</Badge>
                      {phase.title || "مرحلة بدون عنوان"}
                    </Accordion.Header>
                    <Accordion.Body>
                      <div className="d-flex justify-content-between">
                        <div>
                          {phase.description && <p>{phase.description}</p>}
                          {phase.tasks?.length > 0 && (
                            <div className="mt-3">
                              <h6>المهام</h6>
                              <ListGroup>
                                {phase.tasks.map((task, ti) => (
                                  <ListGroup.Item key={ti}>
                                    <strong>{task.title}</strong>
                                    {task.description && <p className="text-muted">{task.description}</p>}
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemovePhase(i)}
                        >
                          حذف
                        </Button>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          )}

          <div className="border p-3 rounded">
            <h6>إضافة مرحلة جديدة</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>عنوان المرحلة</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={newPhase.title}
                    onChange={handlePhaseChange}
                    placeholder="اختياري"
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>تاريخ البدء</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={newPhase.startDate}
                    onChange={handlePhaseChange}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>تاريخ الانتهاء</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={newPhase.endDate}
                    onChange={handlePhaseChange}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>الميزانية</Form.Label>
                  <Form.Control
                    type="number"
                    name="budget"
                    value={newPhase.budget}
                    onChange={handlePhaseChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>وصف المرحلة</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={newPhase.description}
                onChange={handlePhaseChange}
                placeholder="اختياري"
              />
            </Form.Group>

            <div className="border p-3 rounded mb-3">
              <h6>إضافة مهام للمرحلة</h6>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>عنوان المهمة</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={newTask.title}
                      onChange={handleTaskChange}
                      placeholder="اختياري"
                    />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>وصف المهمة</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={1}
                      name="description"
                      value={newTask.description}
                      onChange={handleTaskChange}
                      placeholder="اختياري"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Button
                variant="outline-secondary"
                onClick={handleAddTask}
                className="mt-2"
                disabled={!newTask.title}
              >
                إضافة المهمة
              </Button>

              {newPhase.tasks.length > 0 && (
                <div className="mt-3">
                  <h6>المهام المضافة</h6>
                  <ListGroup>
                    {newPhase.tasks.map((task, i) => (
                      <ListGroup.Item key={i} className="d-flex justify-content-between">
                        <div>
                          <strong>{task.title}</strong>
                          {task.description && <p className="text-muted">{task.description}</p>}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveTask(i)}
                        >
                          حذف
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
            </div>

            <Button
              variant="outline-primary"
              onClick={handleAddPhase}
            >
              إضافة المرحلة
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <h5 className="mb-3 text-primary border-bottom pb-2">الشركاء والمتعاونون (اختياري)</h5>

          <ListGroup>
            {formData.partners.map((partner, i) => (
              <ListGroup.Item key={i} className="d-flex justify-content-between align-items-start">
                <div className="me-3">
                  <div className="d-flex align-items-center">
                    <strong className="me-2">{partner.name}</strong>
                    {partner.type && (
                      <span className="badge bg-secondary">
                        {partner.type === 'Financial' ? 'مالي' :
                         partner.type === 'Technical' ? 'فني' :
                         partner.type === 'Media' ? 'إعلامي' : 'أخرى'}
                      </span>
                    )}
                  </div>
                  {partner.contactPerson && (
                    <div className="mt-1">
                      <small className="text-muted">
                        <strong>المسؤول:</strong> {partner.contactPerson}
                      </small>
                    </div>
                  )}
                  {(partner.contactPhone || partner.contactEmail) && (
                    <div>
                      <small className="text-muted">
                        {partner.contactPhone && <><strong>الهاتف:</strong> {partner.contactPhone}</>}
                        {partner.contactPhone && partner.contactEmail && " | "}
                        {partner.contactEmail && <><strong>البريد:</strong> {partner.contactEmail}</>}
                      </small>
                    </div>
                  )}
                  {(partner.contributionType || partner.contributionAmount) && (
                    <div>
                      <small className="text-muted">
                        {partner.contributionType && (
                          <><strong>نوع المساهمة:</strong> {
                            partner.contributionType === 'Cash' ? 'نقدي' :
                            partner.contributionType === 'In-kind' ? 'عيني' : 'خدمات'
                          }</>
                        )}
                        {partner.contributionType && partner.contributionAmount && " | "}
                        {partner.contributionAmount > 0 && (
                          <><strong>قيمة المساهمة:</strong> {partner.contributionAmount.toLocaleString()}</>
                        )}
                      </small>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleRemovePartner(i)}
                  className="align-self-center"
                >
                  حذف
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>

          <div className="border p-3 rounded">
            <h6>إضافة شريك/متعاون جديد</h6>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>اسم الشريك</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={newPartner.name}
                    onChange={handlePartnerChange}
                    placeholder="اسم الشريك"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>نوع الشريك</Form.Label>
                  <Form.Select
                    name="type"
                    value={newPartner.type}
                    onChange={handlePartnerChange}
                  >
                    <option value="Financial">مالي</option>
                    <option value="Technical">فني</option>
                    <option value="Media">إعلامي</option>
                    <option value="Other">أخرى</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>اسم المسؤول</Form.Label>
                  <Form.Control
                    type="text"
                    name="contactPerson"
                    value={newPartner.contactPerson}
                    onChange={handlePartnerChange}
                    placeholder="اسم المسؤول"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>هاتف التواصل</Form.Label>
                  <Form.Control
                    type="tel"
                    name="contactPhone"
                    value={newPartner.contactPhone}
                    onChange={handlePartnerChange}
                    placeholder="هاتف التواصل"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>البريد الإلكتروني</Form.Label>
                  <Form.Control
                    type="email"
                    name="contactEmail"
                    value={newPartner.contactEmail}
                    onChange={handlePartnerChange}
                    placeholder="البريد الإلكتروني"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>نوع المساهمة</Form.Label>
                  <Form.Select
                    name="contributionType"
                    value={newPartner.contributionType}
                    onChange={handlePartnerChange}
                  >
                    <option value="Cash">نقدي</option>
                    <option value="In-kind">عيني</option>
                    <option value="Services">خدمات</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>قيمة المساهمة</Form.Label>
                  <Form.Control
                    type="number"
                    name="contributionAmount"
                    value={newPartner.contributionAmount}
                    onChange={handlePartnerChange}
                    placeholder="قيمة المساهمة"
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button
              variant="outline-primary"
              onClick={handleAddPartner}
              disabled={!newPartner.name}
            >
              إضافة الشريك
            </Button>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4">
          <Button variant="outline-secondary" onClick={onCancel} className="me-2">
            إلغاء
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                جاري الحفظ...
              </>
            ) : editingProgram ? 'حفظ التعديلات' : 'إضافة المشروع'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProgramForm;