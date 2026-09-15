import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext(null);

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    source: 'Delhi',
    destination: 'Mumbai',
    airline: 'All',
    month: 'All',
    startDate: '',
    endDate: '',
  });

  const swapSourceDestination = () => {
    setFilters(prev => ({
      ...prev,
      source: prev.destination,
      destination: prev.source,
    }));
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      source: 'Delhi',
      destination: 'Mumbai',
      airline: 'All',
      month: 'All',
      startDate: '',
      endDate: '',
    });
  };

  return (
    <FilterContext.Provider value={{ filters, setFilters, updateFilter, swapSourceDestination, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
