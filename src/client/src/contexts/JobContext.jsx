import React, { createContext, useContext, useState } from 'react';

const JobContext = createContext();

export const useJob = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
};

export const JobProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const addJob = (job) => {
    setJobs([...jobs, job]);
  };

  const updateJob = (id, updates) => {
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, ...updates } : job
    ));
  };

  const saveJob = (job) => {
    if (!savedJobs.find(savedJob => savedJob.id === job.id)) {
      setSavedJobs([...savedJobs, job]);
    }
  };

  const unsaveJob = (jobId) => {
    setSavedJobs(savedJobs.filter(job => job.id !== jobId));
  };

  const value = {
    jobs,
    savedJobs,
    loading,
    setLoading,
    addJob,
    updateJob,
    saveJob,
    unsaveJob
  };

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
};
