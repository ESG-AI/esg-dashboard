"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  File,
  Calendar,
  FileText,
  HelpCircle,
  Filter,
  Grid,
  List,
  Tag,
  Type,
  Edit3,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";

interface DocumentDetail {
  id: string;
  name: string;
  uploadDate: string;
  fileSize: number;
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

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [editingIndicators, setEditingIndicators] = useState<Set<string>>(
    new Set()
  );
  const [editedValues, setEditedValues] = useState<{
    [key: string]: { score: number; reasoning: string };
  }>({});

  useEffect(() => {
    async function fetchDocumentDetails() {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_ESG_API}/documents/${params.id}`
        );

        if (!response.ok) {
          throw new Error(`Error fetching document: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        // Transform API response to match our internal model
        const documentDetail: DocumentDetail = {
          id: data.id.toString(),
          name: data.filename,
          uploadDate: data.upload_date,
          fileSize: data.file_size,
          indicators: data.indicators,
          spdiIndex: data.summary.spdi_index,
        };

        setDocument(documentDetail);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch document details:", err);
        setError("Failed to load document details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchDocumentDetails();
  }, [params.id]);

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper function for score color classes
  const getScoreColorClass = (score: number): string => {
    if (score >= 4) return "bg-green-900/50 text-green-400";
    if (score >= 3) return "bg-blue-900/50 text-blue-400";
    if (score >= 2) return "bg-yellow-900/50 text-yellow-400";
    if (score >= 1) return "bg-orange-900/50 text-orange-400";
    return "bg-red-900/50 text-red-400";
  };

  // Helper function for formatting dates
  const formatDate = (dateString: string): string => {
    if (!dateString) return "Unknown date";

    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Unknown date";
    }
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (!document) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ESG_API}/documents/${document.id}/pdf`
      );
      if (!response.ok) {
        throw new Error(`Error fetching PDF URL: ${response.status}`);
      }

      const { url } = await response.json();
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert("Failed to download the PDF. Please try again later.");
    }
  };

  // Function to get all categories from indicators
  const getCategories = () => {
    if (!document) return {};

    const categories: Record<string, number> = {};

    Object.values(document.indicators).forEach((indicator) => {
      const category = indicator.type;
      categories[category] = (categories[category] || 0) + 1;
    });

    return categories;
  };

  // Filter indicators by category
  const getFilteredIndicators = () => {
    if (!document) return [];

    const entries = Object.entries(document.indicators);

    if (activeCategory === "all") {
      return entries;
    }

    return entries.filter(
      ([_, indicator]) => indicator.type === activeCategory
    );
  };

  const categoryCounts = getCategories();
  const filteredIndicators = getFilteredIndicators();

  // Edit functions
  const handleEditIndicator = (
    indicatorKey: string,
    currentScore: number,
    currentReasoning: string
  ) => {
    setEditingIndicators((prev) => new Set(prev).add(indicatorKey));
    setEditedValues((prev) => ({
      ...prev,
      [indicatorKey]: { score: currentScore, reasoning: currentReasoning },
    }));
  };

  const handleCancelEdit = (indicatorKey: string) => {
    setEditingIndicators((prev) => {
      const newSet = new Set(prev);
      newSet.delete(indicatorKey);
      return newSet;
    });
    setEditedValues((prev) => {
      const newValues = { ...prev };
      delete newValues[indicatorKey];
      return newValues;
    });
  };

  const handleSaveIndicator = async (indicatorKey: string) => {
    if (!document) return;
    const editedValue = editedValues[indicatorKey];
    if (!editedValue) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ESG_API}/documents/${document.id}/indicator/${indicatorKey}`,
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
      setDocument((prev) =>
        prev
          ? {
              ...prev,
              indicators: {
                ...prev.indicators,
                [indicatorKey]: {
                  ...prev.indicators[indicatorKey],
                  score: editedValue.score,
                  reasoning: editedValue.reasoning,
                },
              },
              spdiIndex: result.updated_spdi_index ?? prev.spdiIndex,
            }
          : prev
      );
      handleCancelEdit(indicatorKey);
    } catch (error) {
      console.error("Error updating indicator:", error);
      alert("Failed to update indicator. Please try again.");
    }
  };

  const handleScoreChange = (indicatorKey: string, newScore: number) => {
    setEditedValues((prev) => ({
      ...prev,
      [indicatorKey]: { ...prev[indicatorKey], score: newScore },
    }));
  };

  const handleReasoningChange = (
    indicatorKey: string,
    newReasoning: string
  ) => {
    setEditedValues((prev) => ({
      ...prev,
      [indicatorKey]: { ...prev[indicatorKey], reasoning: newReasoning },
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-200 p-4 md:p-6">
      {/* Header with navigation and actions */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to History
        </button>

        {document && (
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-md transition ${
                  viewMode === "card"
                    ? "bg-gray-700 text-blue-400"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Card View"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-md transition ${
                  viewMode === "table"
                    ? "bg-gray-700 text-blue-400"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Table View"
              >
                <List size={18} />
              </button>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition text-green-400"
              title="Download PDF"
            >
              <Download size={18} className="mr-2" />
              Download
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Back to History
          </button>
        </div>
      ) : document ? (
        <>
          {/* Document overview card */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <div className="flex-shrink-0">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <File size={32} className="text-blue-400" />
                </div>
              </div>

              <div className="flex-grow">
                <h1 className="text-2xl font-bold mb-2 break-words">
                  {document.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    <span>{formatDate(document.uploadDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText size={16} className="mr-2" />
                    <span>{formatFileSize(document.fileSize)}</span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="flex flex-col items-center">
                  <span
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-xl font-bold ${
                      document.spdiIndex != null && !isNaN(document.spdiIndex)
                        ? getScoreColorClass(document.spdiIndex)
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {document.spdiIndex != null && !isNaN(document.spdiIndex)
                      ? Number.isInteger(document.spdiIndex)
                        ? document.spdiIndex
                        : document.spdiIndex.toFixed(2)
                      : "N/A"}
                  </span>
                  <span className="mt-2 text-xs text-gray-400">SPDI INDEX</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter and Category navigation */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold">
                Indicators ({Object.keys(document.indicators).length})
              </h2>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center ${
                    activeCategory === "all"
                      ? "bg-blue-900/50 text-blue-300"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  } transition`}
                >
                  <Tag size={14} className="mr-2" />
                  All ({Object.keys(document.indicators).length})
                </button>

                {Object.entries(categoryCounts).map(([category, count]) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center ${
                      activeCategory === category
                        ? "bg-blue-900/50 text-blue-300"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    } transition`}
                  >
                    <Type size={14} className="mr-2" />
                    {category.charAt(0).toUpperCase() + category.slice(1)} (
                    {count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Indicators content */}
          {filteredIndicators.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">
                No indicators found in this category.
              </p>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredIndicators.map(([key, indicator]) => (
                <div
                  key={key}
                  className="bg-gray-800 rounded-lg p-5 border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-white text-lg">{key}</h3>
                      <p className="text-sm text-gray-300">{indicator.title}</p>
                    </div>
                    {editingIndicators.has(key) ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="4"
                          value={editedValues[key]?.score ?? indicator.score}
                          onChange={(e) =>
                            handleScoreChange(
                              key,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 bg-gray-700 text-white px-2 py-1 rounded text-center"
                        />
                        <span className="text-gray-400">/ 4</span>
                        <button
                          onClick={() => handleSaveIndicator(key)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                          title="Save"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => handleCancelEdit(key)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColorClass(
                            indicator.score
                          )}`}
                        >
                          {indicator.score}
                        </span>
                        <button
                          onClick={() =>
                            handleEditIndicator(
                              key,
                              indicator.score,
                              indicator.reasoning
                            )
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-750/50 p-2 rounded">
                      <h4 className="text-xs text-gray-400">Type</h4>
                      <p className="text-sm capitalize">{indicator.type}</p>
                    </div>
                    <div className="bg-gray-750/50 p-2 rounded">
                      <h4 className="text-xs text-gray-400">Subtype</h4>
                      <p className="text-sm capitalize">{indicator.subtype}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <h4 className="text-xs text-gray-400 mb-1">Description</h4>
                    <p className="text-sm text-gray-300 bg-gray-750/30 p-2 rounded">
                      {indicator.description}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs text-gray-400 mb-1">Reasoning</h4>
                    {editingIndicators.has(key) ? (
                      <textarea
                        value={
                          editedValues[key]?.reasoning ?? indicator.reasoning
                        }
                        onChange={(e) =>
                          handleReasoningChange(key, e.target.value)
                        }
                        className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical min-h-24"
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm text-gray-300 bg-gray-750/30 p-2 rounded">
                        {indicator.reasoning}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Indicator
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Subtype
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Reasoning
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredIndicators.map(([key, indicator]) => (
                    <tr key={key} className="hover:bg-gray-750 transition">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-white">{key}</div>
                          <div className="text-sm text-gray-300">
                            {indicator.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {editingIndicators.has(key) ? (
                          <input
                            type="number"
                            min="0"
                            max="4"
                            value={editedValues[key]?.score ?? indicator.score}
                            onChange={(e) =>
                              handleScoreChange(
                                key,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-16 bg-gray-700 text-white px-2 py-1 rounded text-center"
                          />
                        ) : (
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColorClass(
                              indicator.score
                            )}`}
                          >
                            {indicator.score}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm capitalize">
                        {indicator.type}
                      </td>
                      <td className="px-4 py-4 text-sm capitalize">
                        {indicator.subtype}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-300">
                        <div className="max-w-md">
                          <div className="truncate">
                            {indicator.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-300">
                        {editingIndicators.has(key) ? (
                          <textarea
                            value={
                              editedValues[key]?.reasoning ??
                              indicator.reasoning
                            }
                            onChange={(e) =>
                              handleReasoningChange(key, e.target.value)
                            }
                            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical min-h-12"
                            rows={2}
                          />
                        ) : (
                          <div className="truncate">{indicator.reasoning}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {editingIndicators.has(key) ? (
                          <div className="flex space-x-2 justify-center">
                            <button
                              onClick={() => handleSaveIndicator(key)}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => handleCancelEdit(key)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              handleEditIndicator(
                                key,
                                indicator.score,
                                indicator.reasoning
                              )
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg">Document not found.</p>
        </div>
      )}
    </div>
  );
}
