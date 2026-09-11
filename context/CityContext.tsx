import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { City } from '../types';
import { MOCK_CITIES } from '../constants';
import { storageService } from '../services/storageService';

interface CityContextType {
  cities: City[];
  currentCity: City;
  updateCities: (newCities: City[]) => void;
  selectCity: (cityId: string) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<City[]>(MOCK_CITIES);

  useEffect(() => {
    const loadCities = async () => {
      const saved = await storageService.getCities();
      if (saved && saved.length > 0) {
        setCities(saved);
      }
    };
    loadCities();
  }, []);

  const updateCities = (newCities: City[]) => {
    const safeCities = newCities.length > 0 ? newCities : MOCK_CITIES;
    setCities(safeCities);
    storageService.setCities(safeCities);
  };

  const selectCity = (cityId: string) => {
    const updated = cities.map(c => ({
      ...c,
      isCurrent: c.id === cityId || c.cityID === cityId,
    }));
    updateCities(updated);
  };

  const currentCity = useMemo(() => {
    return cities.find(c => c.isCurrent) || cities[0] || MOCK_CITIES[0];
  }, [cities]);

  return (
    <CityContext.Provider value={{ cities, currentCity, updateCities, selectCity }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = (): CityContextType => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
