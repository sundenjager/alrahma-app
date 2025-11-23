import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Table,
  Badge,
  InputGroup,
  Alert,
  Spinner,
  Button,
  Collapse
} from 'react-bootstrap';
import { 
  Search, 
  Filter, 
  ArrowDown, 
  ArrowUp,
  Box,
  CurrencyDollar,
  Layers,
  GraphUp,
  ArrowClockwise
} from 'react-bootstrap-icons';
import stockService from '../../services/stockService';
import suppliesCategoryService from '../../services/suppliesCategoryService';
import './StockManagement.css';

const StockManagement = () => {
  const [categories, setCategories] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stockSummary, setStockSummary] = useState({
    totalItems: 0,
    totalValue: 0,
    totalCategories: 0,
    totalSubCategories: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    availableItems: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch categories and summary first
      const [categoriesRes, summaryData] = await Promise.all([
        suppliesCategoryService.getSuppliesCategories(),
        stockService.getStockSummary()
      ]);

      setCategories(categoriesRes);
      setStockSummary(summaryData);

      // Then fetch stocks with empty filters (backend will handle defaults)
      const stocksData = await stockService.getStocks({});

      setStocks(stocksData);

    } catch (err) {
      console.error('Error fetching data:', err);
      console.error('Error details:', err.response?.data);
      
      if (err.response?.status === 401) {
        setError('غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (err.response?.status === 403) {
        setError('ليس لديك صلاحية للوصول إلى هذه البيانات.');
      } else if (err.response?.status === 400) {
        setError('خطأ في البيانات المرسلة. يرجى المحاولة مرة أخرى.');
      } else {
        setError('فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Apply filters on the frontend for better performance
  const filteredStocks = stocks.filter(stock => {
    // Apply category filter
    if (categoryFilter !== 'all') {
      const categoryMatch = categories.find(cat => 
        cat.id === parseInt(categoryFilter) && 
        cat.name === stock.categoryName
      );
      if (!categoryMatch) return false;
    }

    // Apply subcategory filter
    if (subCategoryFilter !== 'all' && stock.suppliesSubCategoryId !== parseInt(subCategoryFilter)) {
      return false;
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'low':
          if (!(stock.quantity > 0 && stock.quantity < 10)) return false;
          break;
        case 'outofstock':
          if (stock.quantity !== 0) return false;
          break;
        case 'available':
          if (stock.quantity < 10) return false;
          break;
        default:
          break;
      }
    }

    // Apply search filter
    if (searchTerm) {
      const matchesSearch = stock.subCategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }

    return true;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSubCategoryFilter('all');
    setStatusFilter('all');
  };

  const getStatusVariant = (quantity) => {
    if (quantity === 0) return 'danger';
    if (quantity < 10) return 'warning';
    return 'success';
  };

  const getStatusText = (quantity) => {
    if (quantity === 0) return 'غير متوفر';
    if (quantity < 10) return 'منخفض';
    return 'متوفر';
  };

  // Get unique subcategories for filter dropdown
  const uniqueSubCategories = Array.from(
    new Map(stocks.map(stock => [stock.suppliesSubCategoryId, stock])).values()
  );

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">جاري تحميل بيانات المخزون...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="stock-management">
      {/* العنوان */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="page-title">إدارة المخزون</h1>
            <Button 
              variant="outline-primary" 
              onClick={fetchData}
              className="refresh-btn"
              disabled={loading}
            >
              <ArrowClockwise size={18} className={loading ? "spinning" : ""} />
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" className="d-flex align-items-center">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* بطاقات الإحصائيات */}
      <Row className="mb-4">
        <Col md={2} className="mb-3">
          <Card className="stat-card total-items-card">
            <Card.Body className="text-center">
              <div className="stat-icon-wrapper">
                <Box size={30} className="stat-icon" />
              </div>
              <h3 className="stat-value">{stockSummary.totalItems?.toLocaleString() || 0}</h3>
              <p className="stat-label">إجمالي الأصناف</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} className="mb-3">
          <Card className="stat-card total-value-card">
            <Card.Body className="text-center">
              <div className="stat-icon-wrapper">
                <CurrencyDollar size={30} className="stat-icon" />
              </div>
              <h3 className="stat-value">{stockSummary.totalValue?.toLocaleString() || 0} د.ت</h3>
              <p className="stat-label">القيمة الإجمالية</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} className="mb-3">
          <Card className="stat-card categories-card">
            <Card.Body className="text-center">
              <div className="stat-icon-wrapper">
                <Layers size={30} className="stat-icon" />
              </div>
              <h3 className="stat-value">{stockSummary.totalCategories || 0}</h3>
              <p className="stat-label">عدد الأقسام</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} className="mb-3">
          <Card className="stat-card subcategories-card">
            <Card.Body className="text-center">
              <div className="stat-icon-wrapper">
                <GraphUp size={30} className="stat-icon" />
              </div>
              <h3 className="stat-value">{stockSummary.totalSubCategories || 0}</h3>
              <p className="stat-label">عدد الفئات</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} className="mb-3">
          <Card className="stat-card low-stock-card">
            <Card.Body className="text-center">
              <div className="stat-icon-wrapper">
                <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '30px' }} />
              </div>
              <h3 className="stat-value">{stockSummary.lowStockItems || 0}</h3>
              <p className="stat-label">أصناف منخفضة</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} className="mb-3">
          <Card className="stat-card out-of-stock-card">
            <Card.Body className="text-center">
              <div className="stat-icon-wrapper">
                <i className="fas fa-times-circle text-danger" style={{ fontSize: '30px' }} />
              </div>
              <h3 className="stat-value">{stockSummary.outOfStockItems || 0}</h3>
              <p className="stat-label">غير متوفر</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* شريط البحث والتصفية */}
      <Row className="mb-4">
        <Col>
          <Card className="filter-card">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text className="search-icon">
                      <Search size={18} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="ابحث باسم الفئة أو القسم..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </InputGroup>
                </Col>
                <Col md={6} className="text-left">
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowFilters(!showFilters)}
                    className="d-inline-flex align-items-center filter-toggle-btn"
                  >
                    <Filter size={18} className="me-1" />
                    {showFilters ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}
                    {showFilters ? <ArrowUp size={18} className="ms-1" /> : <ArrowDown size={18} className="ms-1" />}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    className="ms-2 reset-filters-btn"
                    onClick={handleResetFilters}
                  >
                    إعادة تعيين
                  </Button>
                </Col>
              </Row>

              <Collapse in={showFilters}>
                <div className="mt-3">
                  <Row>
                    <Col md={4} className="mb-2">
                      <Form.Label className="filter-label">تصفية حسب القسم</Form.Label>
                      <Form.Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="filter-select"
                      >
                        <option value="all">جميع الأقسام</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={4} className="mb-2">
                      <Form.Label className="filter-label">تصفية حسب الحالة</Form.Label>
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                      >
                        <option value="all">جميع الحالات</option>
                        <option value="available">متوفر</option>
                        <option value="low">منخفض</option>
                        <option value="outofstock">غير متوفر</option>
                      </Form.Select>
                    </Col>
                    <Col md={4} className="mb-2">
                      <Form.Label className="filter-label">تصفية حسب الفئة</Form.Label>
                      <Form.Select
                        value={subCategoryFilter}
                        onChange={(e) => setSubCategoryFilter(e.target.value)}
                        className="filter-select"
                      >
                        <option value="all">جميع الفئات</option>
                        {uniqueSubCategories.map((stock) => (
                          <option key={stock.suppliesSubCategoryId} value={stock.suppliesSubCategoryId}>
                            {stock.subCategoryName}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </div>
              </Collapse>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* جدول المخزون */}
      <Row>
        <Col>
          <Card className="inventory-card">
            <Card.Header className="inventory-header">
              <h5 className="mb-0">جرد المخزون</h5>
              <Badge bg="secondary" className="inventory-count">
                {filteredStocks.length} من {stocks.length}
              </Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table striped hover className="mb-0 inventory-table">
                  <thead>
                    <tr>
                      <th>اسم الفئة</th>
                      <th>القسم التابع</th>
                      <th>سعر الوحدة</th>
                      <th>الكمية المتاحة</th>
                      <th>القيمة الإجمالية</th>
                      <th>الحالة</th>
                      <th>آخر تحديث</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.length > 0 ? (
                      filteredStocks.map((stock) => (
                        <tr key={stock.id}>
                          <td className="fw-medium subcategory-name">{stock.subCategoryName}</td>
                          <td className="category-name">{stock.categoryName}</td>
                          <td className="unit-price">
                            {stock.quantity > 0 
                              ? (stock.totalValue / stock.quantity).toLocaleString('ar-TN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })
                              : '0.00'
                            } د.ت
                          </td>
                          <td>
                            <Badge 
                              bg={getStatusVariant(stock.quantity)} 
                              className="quantity-badge"
                            >
                              {stock.quantity.toLocaleString()}
                            </Badge>
                          </td>
                          <td className="total-value">
                            {stock.totalValue.toLocaleString('ar-TN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} د.ت
                          </td>
                          <td>
                            <Badge bg={getStatusVariant(stock.quantity)} className="status-badge">
                              {getStatusText(stock.quantity)}
                            </Badge>
                          </td>
                          <td className="last-updated">
                            {new Date(stock.lastUpdated).toLocaleString('ar-TN')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-4 no-results">
                          <div className="no-results-content">
                            <i className="fas fa-search mb-3"></i>
                            <p className="text-muted mb-0">لا توجد نتائج مطابقة لبحثك</p>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="mt-2"
                              onClick={handleResetFilters}
                            >
                              إعادة تعيين الفلاتر
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ملخص النتائج */}
      <Row className="mt-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center summary-footer">
            <p className="text-muted mb-0">
              آخر تحديث: {new Date().toLocaleString('ar-TN')}
            </p>
            
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default StockManagement;