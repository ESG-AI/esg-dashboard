"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type JobContextType = {
  pendingJobs: string[];
  setPendingJobs: React.Dispatch<React.SetStateAction<string[]>>;
};

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [pendingJobs, setPendingJobs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("esg_pending_jobs");
    if (saved) {
      try {
        setPendingJobs(JSON.parse(saved));
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      if (pendingJobs.length > 0) {
        localStorage.setItem("esg_pending_jobs", JSON.stringify(pendingJobs));
      } else {
        localStorage.removeItem("esg_pending_jobs");
      }
    }
  }, [pendingJobs, isLoaded]);

  return (
    <JobContext.Provider value={{ pendingJobs, setPendingJobs }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobProvider");
  }
  return context;
}
