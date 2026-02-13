import React, { createContext, useContext, useState } from 'react';

const ResumeContext = createContext();

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

export const ResumeProvider = ({ children }) => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResume = (resume) => {
    setResumes([...resumes, resume]);
  };

  const updateResume = (id, updates) => {
    setResumes(resumes.map(resume => 
      resume.id === id ? { ...resume, ...updates } : resume
    ));
  };

  const deleteResume = (id) => {
    setResumes(resumes.filter(resume => resume.id !== id));
  };

  const value = {
    resumes,
    loading,
    setLoading,
    addResume,
    updateResume,
    deleteResume
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};
