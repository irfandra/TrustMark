import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSegments } from 'expo-router';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const segments = useSegments();
  const normalizedSegments = segments.map((segment) =>
    segment.replace(/[()]/g, '')
  );
  const [role, setRole] = useState('collector');
  
  // Update role based on route segments
  useEffect(() => {
    if (normalizedSegments.includes('creator')) {
      setRole('creator');
    } else if (normalizedSegments.includes('collector')) {
      setRole('collector');
    }
  }, [normalizedSegments]);
  
  // Hardcoded brand data for dev
  const [brand, setBrand] = useState({
    id: 1,
    user_id: 1,
    brand_name: 'Hermes',
    company_email: 'hermes@plvmh.com',
    company_address: '24 Rue du Faubourg Saint-Honoré, 75008 Paris, France',
    logo: 'https://via.placeholder.com/100/ff6600/ffffff?text=PL',
    description: 'Hermès International S.A., or simply Hermès, is a French high fashion luxury goods manufacturer established in 1837. It specializes in leather, lifestyle accessories, home furnishings, perfumery, jewelry, watches and ready-to-wear.',
    verified: true,
    created_at: '2024-01-01',
    updated_at: '2024-03-28',
  });

  return (
    <RoleContext.Provider 
      value={{ 
        role, 
        setRole,
        brand,
        setBrand,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};