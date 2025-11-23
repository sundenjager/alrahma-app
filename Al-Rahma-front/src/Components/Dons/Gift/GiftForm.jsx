import React from 'react';
import { Form, Row, Col, Alert } from 'react-bootstrap';

const GiftForm = ({ formData, errors, handleChange, handleFileChange }) => {
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
          <Form.Label>المصدر <span className="text-danger">*</span></Form.Label>
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
          <Form.Label>المستفيد <span className="text-danger">*</span></Form.Label>
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
        <Form.Group as={Col} md={4} controlId="dateOfEntry">
          <Form.Label>تاريخ الدخول <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="date"
            name="dateOfEntry"
            value={formData.dateOfEntry}
            onChange={handleChange}
            isInvalid={!!errors.dateOfEntry}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.dateOfEntry}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={4} controlId="dateOfExit">
          <Form.Label>تاريخ الخروج</Form.Label>
          <Form.Control
            type="date"
            name="dateOfExit"
            value={formData.dateOfExit}
            onChange={handleChange}
            min={formData.dateOfEntry}
            isInvalid={!!errors.dateOfExit}
          />
          <Form.Control.Feedback type="invalid">
            {errors.dateOfExit}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={4} controlId="status">
          <Form.Label>الحالة <span className="text-danger">*</span></Form.Label>
          <Form.Control
            as="select"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="صالح">صالح</option>
            <option value="معطب">معطب</option>
            <option value="تم إتلافه">تم إتلافه</option>
          </Form.Control>
        </Form.Group>
      </Row>

      <Row className="mt-3">
        <Form.Group as={Col} md={6} controlId="donsType">
          <Form.Label>نوع الهبة <span className="text-danger">*</span></Form.Label>
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

        <Form.Group as={Col} md={6} controlId="donsScope">
          <Form.Label>الجهة <span className="text-danger">*</span></Form.Label>
          <Form.Control
            as="select"
            name="donsScope"
            value={formData.donsScope}
            onChange={handleChange}
            required
          >
            <option value="عمومي">عمومي</option>
            <option value="خاص">خاص</option>
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
    </Form>
  );
};

export default GiftForm;