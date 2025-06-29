"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  SlidersHorizontal,
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Edit3,
  Save,
  X,
} from "lucide-react";

// Type definitions
interface ApiDocument {
  id: number;
  filename: string;
  created_at: string; // Changed from upload_date
  file_size: number;
  indicators: {
    [key: string]: {
      score: number;
      title: string;
      type: string;
      subtype: string;
      description: string;
      reasoning: string;
    };
  };
  spdi_index?: number;
}

interface DocumentSummary {
  id: string;
  name: string;
  uploadDate: string;
  indicators: {
    [key: string]: {
      score: number;
      title: string;
      type: string;
      subtype: string;
      description: string;
      reasoning: string;
    };
  };
  spdiIndex?: number;
}

interface FilterOptions {
  dateRange: {
    start: string | null;
    end: string | null;
  };
  scoreRange: {
    min: number;
    max: number;
  };
  sortBy: "date" | "name" | "score";
  sortOrder: "asc" | "desc";
}

export default function HistoryPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    dateRange: { start: null, end: null },
    scoreRange: { min: 0, max: 100 },
    sortBy: "date",
    sortOrder: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Edit state for indicators
  const [editingIndicators, setEditingIndicators] = useState<Set<string>>(
    new Set()
  );
  const [editedValues, setEditedValues] = useState<{
    [key: string]: { score: number; reasoning: string };
  }>({});

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append("limit", ITEMS_PER_PAGE.toString());
        params.append("offset", ((page - 1) * ITEMS_PER_PAGE).toString());

        if (filterOptions.dateRange.start) {
          params.append("startDate", filterOptions.dateRange.start);
        }
        if (filterOptions.dateRange.end) {
          params.append("endDate", filterOptions.dateRange.end);
        }
        params.append("minScore", filterOptions.scoreRange.min.toString());
        params.append("maxScore", filterOptions.scoreRange.max.toString());
        params.append("sortBy", filterOptions.sortBy);
        params.append("sortOrder", filterOptions.sortOrder);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_ESG_API}/documents?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Error fetching documents: ${response.status}`);
        }

        const data = await response.json();

        // Transform the data to match your expected format
        const transformedDocuments = data.documents.map((doc: ApiDocument) => ({
          id: doc.id.toString(),
          name: doc.filename,
          uploadDate: doc.created_at,
          indicators: doc.indicators,
          spdiIndex: doc.spdi_index,
        }));

        setDocuments(transformedDocuments);
        setTotalDocuments(data.count); // Backend uses 'count' instead of 'total'
        setError(null);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("Failed to load document history. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [page, filterOptions]);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilterOptions((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Edit functions
  const handleEditIndicator = (
    documentId: string,
    indicatorKey: string,
    currentScore: number,
    currentReasoning: string
  ) => {
    const editKey = `${documentId}-${indicatorKey}`;
    setEditingIndicators((prev) => new Set(prev).add(editKey));
    setEditedValues((prev) => ({
      ...prev,
      [editKey]: { score: currentScore, reasoning: currentReasoning },
    }));
  };

  const handleCancelEdit = (documentId: string, indicatorKey: string) => {
    const editKey = `${documentId}-${indicatorKey}`;
    setEditingIndicators((prev) => {
      const newSet = new Set(prev);
      newSet.delete(editKey);
      return newSet;
    });
    setEditedValues((prev) => {
      const newValues = { ...prev };
      delete newValues[editKey];
      return newValues;
    });
  };

  const handleSaveIndicator = async (
    documentId: string,
    indicatorKey: string
  ) => {
    const editKey = `${documentId}-${indicatorKey}`;
    const editedValue = editedValues[editKey];
    if (!editedValue) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ESG_API}/documents/${documentId}/indicator/${indicatorKey}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score: editedValue.score,
            reasoning: editedValue.reasoning,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update indicator: ${response.status}`);
      }

      const result = await response.json();

      // Update local state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                indicators: {
                  ...doc.indicators,
                  [indicatorKey]: {
                    ...doc.indicators[indicatorKey],
                    score: editedValue.score,
                    reasoning: editedValue.reasoning,
                  },
                },
                // Update SPDI index if provided
                spdiIndex: result.updated_spdi_index ?? doc.spdiIndex,
              }
            : doc
        )
      );

      // Exit edit mode
      handleCancelEdit(documentId, indicatorKey);

      console.log("Indicator updated successfully:", result);
    } catch (error) {
      console.error("Error updating indicator:", error);
      alert("Failed to update indicator. Please try again.");
    }
  };

  const handleScoreChange = (
    documentId: string,
    indicatorKey: string,
    newScore: number
  ) => {
    const editKey = `${documentId}-${indicatorKey}`;
    setEditedValues((prev) => ({
      ...prev,
      [editKey]: { ...prev[editKey], score: newScore },
    }));
  };

  const handleReasoningChange = (
    documentId: string,
    indicatorKey: string,
    newReasoning: string
  ) => {
    const editKey = `${documentId}-${indicatorKey}`;
    setEditedValues((prev) => ({
      ...prev,
      [editKey]: { ...prev[editKey], reasoning: newReasoning },
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-200 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Analysis History</h1>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          <SlidersHorizontal size={18} className="mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Filters */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">Start Date</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar size={16} className="text-gray-500" />
                </span>
                <input
                  type="date"
                  value={filterOptions.dateRange.start || ""}
                  onChange={(e) =>
                    handleFilterChange({
                      dateRange: {
                        ...filterOptions.dateRange,
                        start: e.target.value || null,
                      },
                    })
                  }
                  className="bg-gray-700 text-white pl-10 pr-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-400">End Date</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar size={16} className="text-gray-500" />
                </span>
                <input
                  type="date"
                  value={filterOptions.dateRange.end || ""}
                  onChange={(e) =>
                    handleFilterChange({
                      dateRange: {
                        ...filterOptions.dateRange,
                        end: e.target.value || null,
                      },
                    })
                  }
                  className="bg-gray-700 text-white pl-10 pr-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Score Range Filters */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">Min Score</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Filter size={16} className="text-gray-500" />
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filterOptions.scoreRange.min}
                  onChange={(e) =>
                    handleFilterChange({
                      scoreRange: {
                        ...filterOptions.scoreRange,
                        min: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="bg-gray-700 text-white pl-10 pr-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-400">Max Score</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Filter size={16} className="text-gray-500" />
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filterOptions.scoreRange.max}
                  onChange={(e) =>
                    handleFilterChange({
                      scoreRange: {
                        ...filterOptions.scoreRange,
                        max: parseInt(e.target.value) || 100,
                      },
                    })
                  }
                  className="bg-gray-700 text-white pl-10 pr-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Sort Controls */}
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="block text-sm text-gray-400">Sort By</label>
              <div className="flex space-x-4">
                <select
                  value={filterOptions.sortBy}
                  onChange={(e) =>
                    handleFilterChange({
                      sortBy: e.target.value as "date" | "name" | "score",
                    })
                  }
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="date">Date</option>
                  <option value="name">Document Name</option>
                  <option value="score">Overall Score</option>
                </select>

                <button
                  onClick={() =>
                    handleFilterChange({
                      sortOrder:
                        filterOptions.sortOrder === "asc" ? "desc" : "asc",
                    })
                  }
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center"
                >
                  {filterOptions.sortOrder === "asc" ? (
                    <ArrowUpAZ size={18} className="mr-2" />
                  ) : (
                    <ArrowDownAZ size={18} className="mr-2" />
                  )}
                  {filterOptions.sortOrder === "asc"
                    ? "Ascending"
                    : "Descending"}
                </button>
              </div>
            </div>

            {/* Reset Filters Button */}
            <div className="col-span-1 md:col-span-2 flex items-end">
              <button
                onClick={() =>
                  setFilterOptions({
                    dateRange: { start: null, end: null },
                    scoreRange: { min: 0, max: 100 },
                    sortBy: "date",
                    sortOrder: "desc",
                  })
                }
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setPage(1)}
            className="mt-4 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg">
            No documents found matching your criteria.
          </p>
          {(filterOptions.dateRange.start ||
            filterOptions.dateRange.end ||
            filterOptions.scoreRange.min > 0 ||
            filterOptions.scoreRange.max < 100) && (
            <p className="mt-2 text-gray-500">
              Try adjusting your filters to see more results.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-gray-800 rounded-lg p-6 shadow-md">
              {/* Document Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {doc.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2" />
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-2
                        ${
                          doc.spdiIndex
                            ? getScoreColorClass(doc.spdiIndex)
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {doc.spdiIndex
                          ? Number.isInteger(doc.spdiIndex)
                            ? doc.spdiIndex
                            : doc.spdiIndex.toFixed(1)
                          : "N/A"}
                      </span>
                      <span>SPDI Index</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Link
                    href={`/detail/${doc.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center"
                  >
                    <span className="mr-2">View Details</span>
                  </Link>
                  <button
                    onClick={() => handleDownloadPdf(doc.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center"
                  >
                    <Download size={16} className="mr-2" />
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Indicators Section */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-md font-semibold text-gray-300 mb-4">
                  Indicators ({Object.keys(doc.indicators).length})
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(doc.indicators).map(([key, indicator]) => {
                    const editKey = `${doc.id}-${key}`;
                    const isEditing = editingIndicators.has(editKey);
                    const editedValue = editedValues[editKey];

                    return (
                      <div
                        key={key}
                        className="bg-gray-700 p-4 rounded-lg border border-gray-600"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-white mb-1">
                              {key}
                            </h5>
                            <p className="text-xs text-gray-400 mb-2">
                              {indicator.title}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isEditing ? (
                              <>
                                <input
                                  type="number"
                                  min="0"
                                  max="4"
                                  value={editedValue?.score ?? indicator.score}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      doc.id,
                                      key,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 bg-gray-600 text-white px-2 py-1 rounded text-center text-sm"
                                />
                                <span className="text-gray-400 text-sm">
                                  / 4
                                </span>
                              </>
                            ) : (
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                                ${getScoreColorClass(indicator.score)}`}
                              >
                                {indicator.score}
                              </span>
                            )}
                            {isEditing ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() =>
                                    handleSaveIndicator(doc.id, key)
                                  }
                                  className="bg-green-600 hover:bg-green-700 text-white p-1 rounded transition"
                                  title="Save"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={() => handleCancelEdit(doc.id, key)}
                                  className="bg-gray-600 hover:bg-gray-700 text-white p-1 rounded transition"
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleEditIndicator(
                                    doc.id,
                                    key,
                                    indicator.score,
                                    indicator.reasoning
                                  )
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded transition"
                                title="Edit"
                              >
                                <Edit3 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <h6 className="text-xs font-medium text-gray-300 mb-2">
                            Reasoning
                          </h6>
                          {isEditing ? (
                            <textarea
                              value={
                                editedValue?.reasoning ?? indicator.reasoning
                              }
                              onChange={(e) =>
                                handleReasoningChange(
                                  doc.id,
                                  key,
                                  e.target.value
                                )
                              }
                              className="w-full bg-gray-600 text-white p-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none resize-vertical text-sm"
                              rows={3}
                            />
                          ) : (
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {indicator.reasoning}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && documents.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-400">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(page * ITEMS_PER_PAGE, totalDocuments)} of{" "}
            {totalDocuments} documents
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="flex items-center bg-gray-800 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
            >
              <ChevronLeft size={18} className="mr-1" />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= Math.ceil(totalDocuments / ITEMS_PER_PAGE)}
              className="flex items-center bg-gray-800 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
            >
              Next
              <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function for score color classes
function getScoreColorClass(score: number): string {
  if (score >= 4) return "bg-green-900/50 text-green-400";
  if (score >= 3) return "bg-blue-900/50 text-blue-400";
  if (score >= 2) return "bg-yellow-900/50 text-yellow-400";
  if (score >= 1) return "bg-orange-900/50 text-orange-400";
  return "bg-red-900/50 text-red-400";
}

// Function to handle PDF download
async function handleDownloadPdf(documentId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ESG_API}/documents/${documentId}/pdf`
    );
    if (!response.ok) {
      throw new Error(`Error fetching PDF URL: ${response.status}`);
    }

    const { url } = await response.json();

    // Open the download in a new tab
    window.open(url, "_blank");
  } catch (err) {
    console.error("Failed to download PDF:", err);
    alert("Failed to download the PDF. Please try again later.");
  }
}
