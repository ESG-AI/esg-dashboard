"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Download, Info, FileText, BarChart3, Calendar,
} from "lucide-react";

// Type definitions for document details
interface DocumentDetail {
  id: string;
  name: string;
  uploadDate: string;
  summary: {
    overall: number;
    governance: number;
    economic: number;
    social: number;
    environmental: number;
    spdi_index: number;
  };
  indicators: {
    [key: string]: {
      score: number;
      reasoning: string;
      title: string;
      type: string;
      sub_type: string;
      description: string;
    };
  };
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    async function fetchDocumentDetails() {
      setLoading(true);
      try {
        // Direct API call to your backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_ESG_API}/documents/${documentId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching document details: ${response.status}`);
        }
        
        const data = await response.json();
        setDocument(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch document details:", err);
        setError("Failed to load document details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    if (documentId) {
      fetchDocumentDetails();
    }
  }, [documentId]);

  async function handleDownloadPdf() {
    try {
      // Direct API call to your backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_ESG_API}/documents/${documentId}/pdf`);
      if (!response.ok) {
        throw new Error(`Error fetching PDF URL: ${response.status}`);
      }
      
      const { url } = await response.json();
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert("Failed to download the PDF. Please try again later.");
    }
  }

  // Filter indicators by type
  const getFilteredIndicators = () => {
    if (!document) return [];
    
    const indicators = Object.entries(document.indicators).map(([key, value]) => ({
      id: key,
      ...value
    }));
    
    if (activeCategory === "all") {
      return indicators;
    }
    
    return indicators.filter(indicator => indicator.type.toLowerCase() === activeCategory);
  };

  const filteredIndicators = getFilteredIndicators();
  
  // Get counts by category
  const getCategoryCounts = () => {
    if (!document) return {};
    
    return Object.values(document.indicators).reduce((acc, indicator) => {
      const type = indicator.type.toLowerCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };
  
  const categoryCounts = getCategoryCounts();

  // Helper function for score color classes
  function getScoreColorClass(score: number): string {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-200 p-4 md:p-6">
      {/* Header with back button and document title */}
      <div className="flex flex-col mb-6">
        <Link 
          href="/history" 
          className="flex items-center text-blue-400 hover:text-blue-300 transition mb-4 w-fit"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to History
        </Link>
        
        {loading ? (
          <div className="h-8 w-48 bg-gray-700 animate-pulse rounded"></div>
        ) : error ? (
          <div className="flex items-center text-red-400">
            <Info size={20} className="mr-2" />
            Error loading document
          </div>
        ) : document ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{document.name}</h1>
            
            <div className="flex items-center mt-4 md:mt-0">
              <Calendar size={18} className="text-gray-400 mr-2" />
              <span className="text-gray-300 mr-4">
                {new Date(document.uploadDate).toLocaleDateString()}
              </span>
              
              <button
                onClick={handleDownloadPdf}
                className="flex items-center bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition"
              >
                <Download size={18} className="mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        ) : null}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-8 text-center">
          <p className="text-lg text-red-400 mb-2">{error}</p>
          <button 
            onClick={() => router.refresh()}
            className="mt-4 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      ) : document ? (
        <div className="space-y-8">
          {/* Score Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold text-center mb-2">Overall Score</h3>
              <div className={`text-4xl font-bold ${getScoreColorClass(document.summary.overall)}`}>
                {document.summary.overall}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold text-center mb-2">Governance</h3>
              <div className={`text-4xl font-bold ${getScoreColorClass(document.summary.governance)}`}>
                {document.summary.governance}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold text-center mb-2">Economic</h3>
              <div className={`text-4xl font-bold ${getScoreColorClass(document.summary.economic)}`}>
                {document.summary.economic}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold text-center mb-2">Social</h3>
              <div className={`text-4xl font-bold ${getScoreColorClass(document.summary.social)}`}>
                {document.summary.social}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold text-center mb-2">Environmental</h3>
              <div className={`text-4xl font-bold ${getScoreColorClass(document.summary.environmental)}`}>
                {document.summary.environmental}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold text-center mb-2">SPDI Index</h3>
              <div className={`text-4xl font-bold ${getScoreColorClass(document.summary.spdi_index)}`}>
                {document.summary.spdi_index}
              </div>
            </div>
          </div>
          
          {/* Category Filters */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Filter by Category</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  activeCategory === "all" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <BarChart3 size={16} className="mr-2" />
                All Indicators ({Object.keys(document.indicators).length})
              </button>
              
              {Object.keys(categoryCounts).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    activeCategory === category 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <FileText size={16} className="mr-2" />
                  {category.charAt(0).toUpperCase() + category.slice(1)} ({categoryCounts[category]})
                </button>
              ))}
            </div>
          </div>
          
          {/* Indicators List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              {activeCategory === "all" ? "All Indicators" : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Indicators`}
            </h2>
            
            {filteredIndicators.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <Info size={40} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">No indicators found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredIndicators.map((indicator) => (
                  <div key={indicator.id} className="bg-gray-800 rounded-lg p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold flex items-center">
                          {indicator.id}{" "}
                          {indicator.title && <span className="ml-2 text-gray-400">- {indicator.title}</span>}
                        </h3>
                        <div className="flex items-center mt-2">
                          <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs mr-2">
                            {indicator.type}
                          </span>
                          {indicator.sub_type && (
                            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                              {indicator.sub_type}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className={`flex items-center justify-center w-16 h-16 rounded-full mt-4 md:mt-0 bg-gray-700 ${getScoreColorClass(indicator.score)}`}>
                        <span className="text-2xl font-bold">{indicator.score}</span>
                      </div>
                    </div>
                    
                    {indicator.description && (
                      <div className="mb-4 p-3 bg-gray-750 rounded-lg">
                        <p className="text-sm text-gray-300">{indicator.description}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-md font-semibold text-gray-300 mb-2">Analysis</h4>
                      <p className="text-gray-400 leading-relaxed whitespace-pre-line">{indicator.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}