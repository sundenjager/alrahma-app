import React from 'react';
import { Form, Row, Col, Alert } from 'react-bootstrap';

const TestamentForm = ({ formData, errors, handleChange, handleFileChange }) => {
  return (
    <Form>
      {/* Display general form errors if any */}
      {errors.general && (
        <Alert variant="danger" className="mb-4">
          {errors.general}
        </Alert>
      )}

      <Row>
        <Form.Group as={Col} md={4} controlId="reference">
          <Form.Label>رقم التسلسل <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            isInvalid={!!errors.reference}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.reference}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={4} controlId="category">
          <Form.Label>الفئة <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            isInvalid={!!errors.category}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.category}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={4} controlId="brand">
          <Form.Label>العلامة التجارية <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            isInvalid={!!errors.brand}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.brand}
          </Form.Control.Feedback>
        </Form.Group>
      </Row>

      <Row className="mt-3">
        <Form.Group as={Col} md={4} controlId="source">
          <Form.Label>الوصي <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="source"
            value={formData.source}
            onChange={handleChange}
            isInvalid={!!errors.source}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.source}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={4} controlId="usage">
          <Form.Label>الاستخدام <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="usage"
            value={formData.usage}
            onChange={handleChange}
            isInvalid={!!errors.usage}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.usage}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={4} controlId="monetaryValue">
          <Form.Label>القيمة النقدية</Form.Label>
          <Form.Control
            type="number"
            name="monetaryValue"
            value={formData.monetaryValue}
            onChange={handleChange}
            min="0"
            step="0.01"
            isInvalid={!!errors.monetaryValue}
          />
          <Form.Control.Feedback type="invalid">
            {errors.monetaryValue}
          </Form.Control.Feedback>
        </Form.Group>
      </Row>

      <Row className="mt-3">
        <Form.Group as={Col} md={6} controlId="donsType">
          <Form.Label>نوع الوصية <span className="text-danger">*</span></Form.Label>
          <Form.Control
            as="select"
            name="donsType"
            value={formData.donsType}
            onChange={handleChange}
            required
          >
            <option value="نقدي">نقدي</option>
            <option value="عيني">عيني</option>
          </Form.Control>
        </Form.Group>

       
      </Row>

      <Form.Group className="mt-3" controlId="description">
        <Form.Label>الوصف</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="mt-3" controlId="legalFile">
        <Form.Label>الملف القانوني</Form.Label>
        <Form.Control 
          type="file" 
          name="legalFile" 
          onChange={handleFileChange} 
          className="form-control-file"
          accept=".pdf,.doc,.docx,.jpg,.png"
        />
        {formData.legalFile && (
          <small className="text-muted d-block mt-1">
            الملف المحدد: {formData.legalFile.name} ({Math.round(formData.legalFile.size / 1024)} KB)
          </small>
        )}
        {errors.legalFile && (
          <div className="invalid-feedback d-block">
            {errors.legalFile}
          </div>
        )}
      </Form.Group>

      <Row className="mt-3">
        <Form.Group as={Col} md={4} controlId="testatorNationality">
          <Form.Label>جنسية الواهب <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="testatorNationality"
            value={formData.testatorNationality || ''}
            onChange={handleChange}
            isInvalid={!!errors.testatorNationality}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.testatorNationality}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={4} controlId="testamentNature">
          <Form.Label>نوع الوصية <span className="text-danger">*</span></Form.Label>
          <Form.Control
            as="select"
            name="testamentNature"
            value={formData.testamentNature || ''}
            onChange={handleChange}
            required
          >
            <option value="">اختر نوع الوصية</option>
            <option value="منقول">منقول</option>
            <option value="عقار">عقار</option>
            <option value="وصية مالية">وصية مالية</option>
            <option value="وسائل نقل">وسائل نقل</option>
          </Form.Control>
          <Form.Control.Feedback type="invalid">
            {errors.testamentNature}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={4} controlId="testamentStatus">
          <Form.Label>حالة الوصية <span className="text-danger">*</span></Form.Label>
          <Form.Control
            as="select"
            name="testamentStatus"
            value={formData.testamentStatus || ''}
            onChange={handleChange}
            required
          >
            <option value="">اختر الحالة</option>
            <option value="في الانتظار">في الانتظار</option>
            <option value="نفذت">نفذت</option>
          </Form.Control>
          <Form.Control.Feedback type="invalid">
            {errors.testamentStatus}
          </Form.Control.Feedback>
        </Form.Group>
      </Row>

      <Row className="mt-3">
        <Form.Group as={Col} md={6} controlId="registrationDate">
          <Form.Label>تاريخ التسجيل <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="date"
            name="registrationDate"
            value={formData.registrationDate || ''}
            onChange={(e) => {
              handleChange(e);
              // Update dateOfEntry to match registrationDate
              handleChange({
                target: {
                  name: 'dateOfEntry',
                  value: e.target.value
                }
              });
            }}
            isInvalid={!!errors.registrationDate}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.registrationDate}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={6} controlId="executionDate">
          <Form.Label>تاريخ التنفيذ</Form.Label>
          <Form.Control
            type="date"
            name="executionDate"
            value={formData.executionDate || ''}
            onChange={handleChange}
            min={formData.registrationDate}
            isInvalid={!!errors.executionDate}
          />
          <Form.Control.Feedback type="invalid">
            {errors.executionDate}
          </Form.Control.Feedback>
        </Form.Group>
      </Row>
    </Form>
  );
};

export default TestamentForm;