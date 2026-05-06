"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useJobs } from "@/context/JobContext";

// Type definitions for the new API flow
interface UploadResponse {
  s3_object_key: string;
  filename: string;
}

interface GriResponse {
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
  summary: {
    spdi_index: number;
  };
  id: number;
  token_usage?: {
    total_tokens_used: number;
    by_indicator: {
      [key: string]: {
        prompt_tokens: number;
        response_tokens: number;
        total_tokens: number;
      };
    };
  };
}

interface ApiResponse {
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
  summary: {
    governance: number;
    economic: number;
    social: number;
    environmental: number;
    overall: number;
    spdi_index: number;
  };
  token_usage?: {
    total_tokens_used: number;
    by_indicator: {
      [key: string]: {
        prompt_tokens: number;
        response_tokens: number;
        total_tokens: number;
      };
    };
  };
}

type GriType = "governance" | "economic" | "social" | "environmental";
const griTypes: GriType[] = [
  "governance",
  "economic",
  "social",
  "environmental",
];

// Define the indicator type
interface Indicator {
  index: string;
  score: number;
  title: string;
  explanation: string;
  type: string;
  sub_type: string;
  description: string;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const fileUrls = searchParams.getAll("files");
  const fileNames = searchParams.getAll("fileNames");
  const docTypes = searchParams.getAll("docTypes");
  const [fileIndex, setFileIndex] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pendingJobs, setPendingJobs } = useJobs();
  const [showPdf, setShowPdf] = useState(true);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<{
    current: number;
    total: number;
    currentType: string;
  } | null>(null);
  // Prevent automatic duplicate enqueues while staying on the page
  const hasEnqueuedRef = useRef(false);
  // Track whether polling is currently active (independent of apiLoading for UI)
  const isPollingRef = useRef(false);

  // New state for progressive loading
  const [allIndicators, setAllIndicators] = useState<Indicator[]>([]);
  const [spdiIndex, setSpdiIndex] = useState<number>(0);

  // At the top of ResultsContent
  const [currentGriType, setCurrentGriType] = useState<GriType | null>(null);
  const [finishedGriTypes, setFinishedGriTypes] = useState<GriType[]>([]);
  const [inProgressGriTypes, setInProgressGriTypes] = useState<GriType[]>([]);

  // Edit state for indicators
  const [editingIndicators, setEditingIndicators] = useState<Set<number>>(
    new Set(),
  );
  const [editedValues, setEditedValues] = useState<{
    [key: number]: { score: number; explanation: string };
  }>({});
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [s3Key, setS3Key] = useState<string | null>(null);

  // Process file URLs on component mount
  useEffect(() => {
    if (fileUrls.length === 0 && pendingJobs.length === 0) {
      setError("No files provided.");
    } else {
      if (JSON.stringify(fileUrls) !== JSON.stringify(files)) {
        setFiles(fileUrls);
      }
    }
    setIsLoading(false);
  }, [fileUrls]);

  // Fetch API data
  useEffect(() => {
    console.log(
      "Effect triggered for fileIndex:",
      fileIndex,
      "files:",
      files,
      "isLoading:",
      isLoading,
    );
    async function fetchEsgData() {
      try {
        // Don't try to fetch if no files are available
        if (files.length === 0 || isLoading) {
          return;
        }

        setApiLoading(true);
        setAnalysisProgress({
          current: 5,
          total: 100,
          currentType: "Uploading file...",
        });

        // Reset progressive loading state but NOT files/PDFs
        setAllIndicators([]);
        setSpdiIndex(0);
        setDocumentId(null);
        // Keep s3Key to maintain PDF visibility during polling
        // Only reset on new file uploads
        if (pendingJobs.length === 0) {
          setS3Key(null);
        }

        console.log("Starting API request for file index:", fileIndex);

        const esg_api = process.env.NEXT_PUBLIC_ESG_API;
        console.log("ESG API URL:", esg_api);

        let jobIdsToPoll = pendingJobs;

        // Only upload and enqueue if we don't already have pending jobs
        // and we haven't already enqueued during this session (prevents duplicate runs)
        if (pendingJobs.length === 0 && !hasEnqueuedRef.current) {
          // Step 1: Upload the PDF(s) to get s3_object_key(s)
          const isMultiFile = files.length > 1;
          let uploadData: UploadResponse | UploadResponse[];
          let filenameWithoutExtension: string;

          if (isMultiFile) {
            // Upload all files for multi-file analysis
            console.log("Uploading multiple files for multi-file analysis...");
            const uploadPromises = files.map(async (fileUrl, idx) => {
              const response = await fetch(fileUrl);
              const blob = await response.blob();
              const originalFilename = fileNames[idx] || `file-${idx}.pdf`;

              const uploadFormData = new FormData();
              uploadFormData.append("pdf", blob, originalFilename);

              const uploadResponse = await fetch(`${esg_api}/upload`, {
                method: "POST",
                mode: "cors",
                body: uploadFormData,
              });

              if (!uploadResponse.ok) {
                throw new Error(
                  `Upload failed for file ${idx + 1} with status: ${
                    uploadResponse.status
                  }`,
                );
              }

              return await uploadResponse.json();
            });

            uploadData = await Promise.all(uploadPromises);
            console.log("All files uploaded successfully:", uploadData);
          } else {
            // Single file upload (existing logic)
            const response = await fetch(files[fileIndex]);
            const blob = await response.blob();
            console.log("PDF blob retrieved:", blob.size, "bytes");

            const uploadFormData = new FormData();
            const originalFilename =
              fileNames[fileIndex] || `file-${fileIndex}.pdf`;

            // Remove .pdf extension from filename for API
            filenameWithoutExtension = originalFilename.replace(/\.pdf$/i, "");

            uploadFormData.append("pdf", blob, originalFilename);

            console.log("Uploading file to get s3_object_key...");
            const uploadResponse = await fetch(`${esg_api}/upload`, {
              method: "POST",
              mode: "cors",
              body: uploadFormData,
            });

            if (!uploadResponse.ok) {
              throw new Error(
                `Upload failed with status: ${uploadResponse.status}`,
              );
            }

            uploadData = await uploadResponse.json();
            console.log(
              "Upload successful, s3_object_key:",
              (uploadData as UploadResponse).s3_object_key,
            );
          }

          setAnalysisProgress({
            current: 10,
            total: 100,
            currentType: "Queuing analysis job...",
          });

          // Prepare payload
          let evaluatePayload;
          if (isMultiFile) {
            evaluatePayload = {
              s3_object_keys: (uploadData as UploadResponse[]).map(
                (upload) => upload.s3_object_key,
              ),
              filenames: files.map((fileUrl, idx) =>
                (fileNames[idx] || `file-${idx}.pdf`).replace(/\.pdf$/i, ""),
              ),
              document_types: files.map(
                (fileUrl, idx) => docTypes[idx] || "sustainability_report",
              ),
            };
          } else {
            evaluatePayload = {
              s3_object_keys: [(uploadData as UploadResponse).s3_object_key],
              filenames: [filenameWithoutExtension!],
              document_types: [docTypes[fileIndex] || "sustainability_report"],
            };
          }

          console.log("Enqueuing job...", evaluatePayload);
          const enqueueResponse = await fetch("/api/evaluate/enqueue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evaluatePayload),
          });

          if (!enqueueResponse.ok) {
            throw new Error(
              `Failed to enqueue job: ${await enqueueResponse.text()}`,
            );
          }

          const { jobIds } = await enqueueResponse.json();
          console.log(`Jobs queued successfully. Job IDs:`, jobIds);

          // mark that we've enqueued during this session
          hasEnqueuedRef.current = true;

          setPendingJobs(jobIds);
          jobIdsToPoll = jobIds;
        }

        setAnalysisProgress(null); // Clear progress bar since we use dots now

        // Poll for status of multiple jobs
        let localPendingJobs = [...jobIdsToPoll];
        let totalSpdiIndex = 0;
        let accumulatedIndicators: any[] = [];
        let firstDocumentId: number | null = null;

        setFinishedGriTypes([]);
        setInProgressGriTypes([
          "governance",
          "economic",
          "social",
          "environmental",
        ]);
        isPollingRef.current = true;

        console.log(
          "Starting job polling loop with pending jobs:",
          jobIdsToPoll,
        );
        while (localPendingJobs.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 3000));

          for (const jobId of [...localPendingJobs]) {
            try {
              const statusResponse = await fetch(
                `/api/evaluate/status?jobId=${jobId}`,
              );
              if (!statusResponse.ok) continue;

              const statusData = await statusResponse.json();

              if (statusData.status === "completed") {
                const finalData = statusData.results;
                const completedType = finalData.gri_type;

                console.log(
                  `Job ${jobId} completed. GRI Type: ${completedType}`,
                  {
                    indicatorCount: Object.keys(finalData.indicators || {})
                      .length,
                    hasId: !!finalData.id,
                    id: finalData.id,
                    summary: finalData.summary,
                  },
                );

                // Capture documentId from first job result
                if (!firstDocumentId && finalData.id) {
                  firstDocumentId = finalData.id;
                  console.log("Captured documentId:", firstDocumentId);
                  setDocumentId(firstDocumentId);
                }
                if (!s3Key && statusData.data?.s3_object_keys?.length > 0) {
                  setS3Key(statusData.data.s3_object_keys[0]);
                }

                totalSpdiIndex += finalData.summary?.spdi_index || 0;

                const newIndicators = Object.entries(finalData.indicators).map(
                  ([key, value]: [string, any]) => ({
                    index: key,
                    score: value.score,
                    title: value.title,
                    explanation: value.reasoning,
                    type: value.type,
                    sub_type: value.sub_type,
                    description: value.description,
                  }),
                );

                console.log(
                  `Adding ${newIndicators.length} indicators for ${completedType}:`,
                  newIndicators.map((i) => i.index),
                );
                accumulatedIndicators.push(...newIndicators);
                setSpdiIndex(totalSpdiIndex);
                setAllIndicators([...accumulatedIndicators]);
                console.log(
                  "Total accumulated indicators:",
                  accumulatedIndicators.length,
                  "from",
                  finishedGriTypes.length + 1,
                  "GRI types",
                );

                // Mark this type as finished to update UI
                if (completedType) {
                  setFinishedGriTypes((prev) => [...prev, completedType]);
                  setInProgressGriTypes((prev) =>
                    prev.filter((t) => t !== completedType),
                  );
                }

                // Remove from pending queue
                localPendingJobs = localPendingJobs.filter(
                  (id) => id !== jobId,
                );
                console.log("Remaining pending jobs:", localPendingJobs);

                // Keep global context synced so the header widget updates accurately
                setPendingJobs((prev) => prev.filter((id) => id !== jobId));
              } else if (statusData.status === "failed") {
                localPendingJobs = localPendingJobs.filter(
                  (id) => id !== jobId,
                );
                setPendingJobs((prev) => prev.filter((id) => id !== jobId));
                console.error(`Job failed: ${statusData.error}`);
                // Don't throw, just warn, so other jobs can finish
                setApiError(`Warning: A job failed: ${statusData.error}`);
              } else if (statusData.status === "not_found") {
                console.warn(`Job ${jobId} not found. Removing from queue.`);
                localPendingJobs = localPendingJobs.filter(
                  (id) => id !== jobId,
                );
                setPendingJobs((prev) => prev.filter((id) => id !== jobId));
              } else {
                console.log(
                  `Job ${jobId} still in progress. Status: ${statusData.status}`,
                );
                if (!s3Key && statusData.data?.s3_object_keys?.length > 0) {
                  setS3Key(statusData.data.s3_object_keys[0]);
                }
              }
            } catch (err) {
              console.error("Error polling job", jobId, err);
            }
          }
        }

        console.log("All analysis jobs complete");
        console.log(
          "Final state: accumulated indicators:",
          accumulatedIndicators.length,
          "documentId:",
          firstDocumentId,
          "finishedGriTypes:",
          finishedGriTypes,
        );
        isPollingRef.current = false;
        setPendingJobs([]);
        setFinishedGriTypes((prev) =>
          prev.length > 0
            ? prev
            : ["governance", "economic", "social", "environmental"],
        );
        setInProgressGriTypes([]);
        setApiLoading(false);
      } catch (err) {
        console.error("API request failed:", err);
        setApiError(
          err instanceof Error ? err.message : "Failed to fetch ESG data",
        );
        setPendingJobs([]);
        setApiLoading(false);
        setAnalysisProgress(null);
      }
    }

    // Run when files are loaded OR when we have pending jobs to resume
    if ((files.length > 0 && !isLoading) || pendingJobs.length > 0) {
      fetchEsgData();
    }
  }, [files, fileIndex, isLoading, pendingJobs.length]);

  // Transform API data into array format for rendering
  const esgResults = apiData
    ? Object.entries(apiData.indicators).map(([key, value]) => ({
        index: key,
        score: value.score,
        explanation: value.reasoning,
      }))
    : [];

  // Group indicators by type for display
  const groupedIndicators = allIndicators.reduce(
    (acc, indicator) => {
      const type = indicator.type || "other";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(indicator);
      return acc;
    },
    {} as Record<string, Indicator[]>,
  );

  // Get type display names and colors
  const getTypeDisplayName = (type: string) => {
    const typeNames: Record<string, string> = {
      governance: "Governance",
      economic: "Economic",
      social: "Social",
      environmental: "Environmental",
      other: "Other",
    };
    return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      governance: "border-purple-500",
      economic: "border-yellow-500",
      social: "border-blue-500",
      environmental: "border-emerald-500",
      other: "border-gray-500",
    };
    return typeColors[type] || "border-gray-500";
  };

  // Sort grouped indicators by the standard GRI order
  const sortedGroupedIndicators = Object.entries(groupedIndicators).sort(
    ([a], [b]) => {
      const order = [
        "governance",
        "economic",
        "social",
        "environmental",
        "other",
      ];
      return order.indexOf(a) - order.indexOf(b);
    },
  );

  const handleNextFile = () => {
    if (fileIndex < files.length - 1) {
      setShowPdf(false);

      setTimeout(() => {
        setFileIndex(fileIndex + 1);

        setTimeout(() => {
          setShowPdf(true);
        }, 50);
      }, 50);
    }
  };

  const handlePrevFile = () => {
    if (fileIndex > 0) {
      setShowPdf(false);

      setTimeout(() => {
        setFileIndex(fileIndex - 1);

        setTimeout(() => {
          setShowPdf(true);
        }, 50);
      }, 50);
    }
  };

  // Edit functions
  const handleEditIndicator = (
    index: number,
    currentScore: number,
    currentExplanation: string,
  ) => {
    setEditingIndicators((prev) => new Set(prev).add(index));
    setEditedValues((prev) => ({
      ...prev,
      [index]: { score: currentScore, explanation: currentExplanation },
    }));
  };

  const handleCancelEdit = (index: number) => {
    setEditingIndicators((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setEditedValues((prev) => {
      const newValues = { ...prev };
      delete newValues[index];
      return newValues;
    });
  };

  const handleSaveIndicator = async (index: number) => {
    const editedValue = editedValues[index];
    if (!editedValue) return;

    if (!documentId) {
      alert("Document ID not available. Please try again.");
      return;
    }

    try {
      const indicatorCode = allIndicators[index].index;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ESG_API}/documents/${documentId}/indicator/${indicatorCode}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score: editedValue.score,
            reasoning: editedValue.explanation,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to update indicator: ${response.status}`);
      }

      const result = await response.json();

      // Update local state
      setAllIndicators((prev) =>
        prev.map((indicator, i) =>
          i === index
            ? {
                ...indicator,
                score: editedValue.score,
                explanation: editedValue.explanation,
              }
            : indicator,
        ),
      );

      // Update SPDI index if provided
      if (result.updated_spdi_index !== undefined) {
        setSpdiIndex(result.updated_spdi_index);
      }

      // Exit edit mode
      handleCancelEdit(index);

      console.log("Indicator updated successfully:", result);
    } catch (error) {
      console.error("Error updating indicator:", error);
      alert("Failed to update indicator. Please try again.");
    }
  };

  const handleScoreChange = (index: number, newScore: number) => {
    setEditedValues((prev) => ({
      ...prev,
      [index]: { ...prev[index], score: newScore },
    }));
  };

  const handleExplanationChange = (index: number, newExplanation: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [index]: { ...prev[index], explanation: newExplanation },
    }));
  };

  return (
    <div className="flex h-screen bg-black text-white p-6">
      {/* Left: File Preview */}
      <div className="w-1/2 bg-gray-900 p-4 rounded-lg flex flex-col items-center">
        {isLoading ? (
          <p>Loading PDF...</p>
        ) : error && !s3Key ? (
          <p className="text-red-500">{error}</p>
        ) : files.length > 0 || s3Key ? (
          <>
            {showPdf && (
              <embed
                key={`pdf-embed-${fileIndex}`}
                src={
                  s3Key
                    ? `${process.env.NEXT_PUBLIC_ESG_API}/pdf/${s3Key}`
                    : files[fileIndex]
                }
                className="w-full h-full border border-gray-700 rounded"
                type="application/pdf"
              />
            )}
            <div className="flex justify-between w-full mb-2 mt-4">
              <button
                onClick={handlePrevFile}
                disabled={fileIndex === 0}
                className="p-2 bg-gray-700 rounded disabled:opacity-50"
              >
                <ChevronLeft />
              </button>
              <p>
                File {fileIndex + 1} of {files.length}
              </p>
              <button
                onClick={handleNextFile}
                disabled={fileIndex === files.length - 1}
                className="p-2 bg-gray-700 rounded disabled:opacity-50"
              >
                <ChevronRight />
              </button>
            </div>
          </>
        ) : (
          <p>No files available.</p>
        )}
      </div>

      {/* Right: Analysis Results */}
      <div className="w-1/2 ml-4 bg-gray-900 rounded-lg flex flex-col h-full">
        <h2 className="text-xl font-bold p-4 border-b border-gray-700">
          SPDI Analysis Results
        </h2>

        {/* GRI Analysis Status */}
        {apiLoading && (
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <h3 className="text-md font-semibold text-gray-300 mb-3">
              Analysis Progress
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {griTypes.map((griType) => {
                let colorClass = "bg-gray-600";
                if (finishedGriTypes.includes(griType)) {
                  colorClass = "bg-green-500";
                } else if (inProgressGriTypes.includes(griType)) {
                  colorClass = "bg-blue-500 animate-pulse";
                }
                return (
                  <div key={griType} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                    <span
                      className={`text-sm ${
                        finishedGriTypes.includes(griType)
                          ? "text-green-400"
                          : inProgressGriTypes.includes(griType)
                            ? "text-blue-400"
                            : "text-gray-500"
                      }`}
                    >
                      {griType.charAt(0).toUpperCase() + griType.slice(1)}
                      {finishedGriTypes.includes(griType) && " ✓"}
                      {inProgressGriTypes.includes(griType) && " ..."}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add response time info */}
        {allIndicators.length > 0 && inProgressGriTypes.length === 0 && (
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-semibold text-gray-300">
                Analysis Summary
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-3">
              <div className="bg-gray-700 p-2 rounded-md">
                <p className="text-sm text-gray-400">
                  SPDI Index Score out of 33 Indicators
                </p>
                <p className="text-md font-bold text-green-400">
                  {spdiIndex > 0 ? spdiIndex : "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {apiLoading && allIndicators.length === 0 ? (
            <div className="py-4 space-y-6">
              {analysisProgress && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">
                    {analysisProgress.currentType}
                  </h3>
                  <div className="w-full bg-gray-900 rounded-full h-3 mb-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${(analysisProgress.current / analysisProgress.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Skeleton Cards */}
              <div className="space-y-4 opacity-70">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-800 p-6 rounded-lg shadow-md animate-pulse border border-gray-700"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-6 bg-gray-700 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-700 rounded w-1/6"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-700 rounded w-full mb-3"></div>
                      <div className="h-4 bg-gray-700 rounded w-5/6 mb-3"></div>
                      <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : apiError ? (
            <p className="text-red-500 text-center py-8">{apiError}</p>
          ) : allIndicators.length > 0 ? (
            <div className="space-y-6">
              {/* Show partial results notice if still loading */}
              {inProgressGriTypes.length > 0 && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-4">
                  <p className="text-blue-300 text-sm">
                    ⚡ Showing partial results while remaining analyses
                    complete...
                  </p>
                </div>
              )}
              <div></div>
              {sortedGroupedIndicators.map(([type, indicators]) => (
                <div key={type} className="space-y-4">
                  {/* GRI Type Header */}
                  <div
                    className={`bg-gray-700 p-4 rounded-lg border-l-4 ${getTypeColor(
                      type,
                    )}`}
                  >
                    <h2 className="text-xl font-bold text-white">
                      {getTypeDisplayName(type)} Indicators
                    </h2>
                  </div>

                  {/* Indicators for this type */}
                  {indicators.map((result, index: number) => {
                    // Calculate the global index for this indicator
                    const globalIndex = allIndicators.findIndex(
                      (ind) => ind.index === result.index,
                    );
                    return (
                      <div
                        key={result.index}
                        className="bg-gray-800 p-6 rounded-lg shadow-md ml-4"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-white">
                            {result.index}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {editingIndicators.has(globalIndex) ? (
                              <>
                                <input
                                  type="number"
                                  min="0"
                                  max="4"
                                  value={
                                    editedValues[globalIndex]?.score ??
                                    result.score
                                  }
                                  onChange={(e) =>
                                    handleScoreChange(
                                      globalIndex,
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="w-16 bg-gray-700 text-white px-2 py-1 rounded text-center"
                                />
                                <span className="text-gray-400">/ 4</span>
                              </>
                            ) : (
                              <p
                                className={`text-lg font-bold ${
                                  result.score < 2
                                    ? "text-red-400"
                                    : result.score == 2
                                      ? "text-blue-400"
                                      : "text-green-400"
                                }`}
                              >
                                Score: {result.score} / 4
                              </p>
                            )}

                            {/* Edit/Save buttons - show when all jobs finished and documentId is available */}
                            {(() => {
                              const isComplete =
                                inProgressGriTypes.length === 0 && documentId;
                              console.log(
                                "Edit button render check for indicator",
                                result.index,
                                ":",
                                {
                                  inProgressCount: inProgressGriTypes.length,
                                  hasDocId: !!documentId,
                                  isComplete,
                                },
                              );
                              return isComplete ? (
                                editingIndicators.has(globalIndex) ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() =>
                                        handleSaveIndicator(globalIndex)
                                      }
                                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleCancelEdit(globalIndex)
                                      }
                                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleEditIndicator(
                                        globalIndex,
                                        result.score,
                                        result.explanation,
                                      )
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                                  >
                                    Edit
                                  </button>
                                )
                              ) : null;
                            })()}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-md font-semibold text-gray-300 mb-2">
                            Explanation
                          </h4>
                          {editingIndicators.has(globalIndex) ? (
                            <textarea
                              value={
                                editedValues[globalIndex]?.explanation ??
                                result.explanation
                              }
                              onChange={(e) =>
                                handleExplanationChange(
                                  globalIndex,
                                  e.target.value,
                                )
                              }
                              className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical min-h-24"
                              rows={4}
                            />
                          ) : (
                            <p
                              className={`text-base leading-relaxed whitespace-pre-wrap ${!result.explanation || result.explanation.trim() === "" ? "text-gray-500 italic" : "text-gray-300"}`}
                            >
                              {result.explanation &&
                              result.explanation.trim() !== ""
                                ? result.explanation
                                : "No explanation provided."}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8">No ESG data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-black text-white p-6 items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
