import React from 'react';
import PropTypes from 'prop-types';
import { Nav } from 'react-bootstrap';

const YearNavigation = ({ selectedYear, setSelectedYear, availableYears }) => {
  // Determine the years dynamically from available data or use default range
  const years = availableYears && availableYears.length > 0 
    ? availableYears 
    : Array.from({ length: new Date().getFullYear() - 2011 + 1 }, (_, index) => 2011 + index);

  // Reverse the years array to display from right to left
  const reversedYears = [...years].reverse();

  return (
    <nav className="year-nav">
      <Nav className="year-nav-tabs">
        {/* Button to show all years */}
        <Nav.Item className="year-nav-item">
          <Nav.Link
            className={`year-nav-link ${selectedYear === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedYear('all')}
          >
            عرض الكل
          </Nav.Link>
        </Nav.Item>

        {/* Buttons for each available year */}
        {reversedYears.map(year => (
          <Nav.Item key={year} className="year-nav-item">
            <Nav.Link
              className={`year-nav-link ${selectedYear === year.toString() ? 'active' : ''}`}
              onClick={() => setSelectedYear(year.toString())}
            >
              {year}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
    </nav>
  );
};

YearNavigation.propTypes = {
  selectedYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setSelectedYear: PropTypes.func.isRequired,
  availableYears: PropTypes.arrayOf(PropTypes.number), // Allow dynamic years as an array
};

export default YearNavigation;
