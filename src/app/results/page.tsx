"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

function ResultsContent() {
  const searchParams = useSearchParams();
  const fileUrls = searchParams.getAll("files");
  const fileNames = searchParams.getAll("fileNames");
  const docTypes = searchParams.getAll("docTypes");
  const [fileIndex, setFileIndex] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(true);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<{
    current: number;
    total: number;
    currentType: string;
  } | null>(null);

  // New state for progressive loading
  const [allIndicators, setAllIndicators] = useState<any[]>([]);
  const [spdiIndex, setSpdiIndex] = useState<number>(0);

  // At the top of ResultsContent
  const [currentGriType, setCurrentGriType] = useState<GriType | null>(null);
  const [finishedGriTypes, setFinishedGriTypes] = useState<GriType[]>([]);
  const [inProgressGriTypes, setInProgressGriTypes] = useState<GriType[]>([]);

  // Edit state for indicators
  const [editingIndicators, setEditingIndicators] = useState<Set<number>>(
    new Set()
  );
  const [editedValues, setEditedValues] = useState<{
    [key: number]: { score: number; explanation: string };
  }>({});
  const [documentId, setDocumentId] = useState<number | null>(null);

  // Process file URLs on component mount
  useEffect(() => {
    if (fileUrls.length === 0) {
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
      isLoading
    );
    async function fetchEsgData() {
      try {
        // Don't try to fetch if no files are available
        if (files.length === 0 || isLoading) {
          return;
        }

        setApiLoading(true);
        setAnalysisProgress({
          current: 0,
          total: 5,
          currentType: "Uploading file...",
        });

        // Reset progressive loading state
        setAllIndicators([]);
        setSpdiIndex(0);
        setDocumentId(null);

        console.log("Starting API request for file index:", fileIndex);

        const esg_api = process.env.NEXT_PUBLIC_ESG_API;
        console.log("ESG API URL:", esg_api);

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
                }`
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
              `Upload failed with status: ${uploadResponse.status}`
            );
          }

          uploadData = await uploadResponse.json();
          console.log(
            "Upload successful, s3_object_key:",
            (uploadData as UploadResponse).s3_object_key
          );
        }

        setAnalysisProgress({
          current: 1,
          total: 5,
          currentType: "Starting analysis...",
        });

        // Step 2: Make 4 separate requests for each GRI type in parallel
        const griTypes = [
          "governance",
          "economic",
          "social",
          "environmental",
        ] as const;

        let totalSpdiIndex = 0;
        let allIndicators: any[] = [];

        setCurrentGriType(null);
        setFinishedGriTypes([]);
        setInProgressGriTypes([]);

        // Set all GRI types as in-progress immediately since they'll run in parallel
        setInProgressGriTypes([...griTypes]);

        // Helper function to make individual GRI requests with retry logic
        const makeGriRequest = async (
          griType: GriType,
          retryCount = 0
        ): Promise<{ griType: GriType; griData: GriResponse }> => {
          const maxRetries = 3;
          const baseDelay = 2000; // 2 seconds base delay

          try {
            console.log(
              `Making request for ${griType}${
                retryCount > 0 ? ` (retry ${retryCount})` : ""
              }...`
            );

            // Determine which endpoint to use based on number of files
            const isMultiFile = files.length > 1;
            const endpoint = isMultiFile
              ? `${esg_api}/evaluate-multi`
              : `${esg_api}/evaluate`;

            // Prepare payload based on endpoint
            let evaluatePayload;
            if (isMultiFile) {
              // For multi-file, include all file information as separate arrays
              evaluatePayload = {
                s3_object_keys: (uploadData as UploadResponse[]).map(
                  (upload) => upload.s3_object_key
                ),
                filenames: files.map((fileUrl, idx) =>
                  (fileNames[idx] || `file-${idx}.pdf`).replace(/\.pdf$/i, "")
                ),
                document_types: files.map(
                  (fileUrl, idx) => docTypes[idx] || "sustainability_report"
                ),
              };
            } else {
              // For single file, use existing payload structure
              evaluatePayload = {
                s3_object_key: (uploadData as UploadResponse).s3_object_key,
                filename: filenameWithoutExtension,
              };
            }

            // Log the request details
            console.log(
              `=== ${
                isMultiFile ? "/evaluate-multi" : "/evaluate"
              } Request for ${griType} ===`
            );
            console.log("Endpoint:", endpoint);
            console.log("Payload:", evaluatePayload);

            const evaluateResponse = await fetch(
              `${endpoint}?gri_type=${griType}&document_type=${
                docTypes[fileIndex] || "sustainability_report"
              }`,
              {
                method: "POST",
                mode: "cors",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(evaluatePayload),
              }
            );

            console.log(
              `=== ${
                isMultiFile ? "/evaluate-multi" : "/evaluate"
              } Response for ${griType} ===`
            );
            console.log("Status:", evaluateResponse.status);
            console.log("Status Text:", evaluateResponse.statusText);
            console.log(
              "Headers:",
              Object.fromEntries(evaluateResponse.headers.entries())
            );

            if (!evaluateResponse.ok) {
              // Log error response body
              const errorText = await evaluateResponse.text();
              console.error(`Error response body for ${griType}:`, errorText);

              // Check if this is a retryable error
              const isRetryableError =
                evaluateResponse.status === 500 ||
                evaluateResponse.status === 502 ||
                evaluateResponse.status === 503 ||
                evaluateResponse.status === 504 ||
                errorText.includes("timeout") ||
                errorText.includes("Read timeout");

              if (isRetryableError && retryCount < maxRetries) {
                const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
                console.log(
                  `Retryable error for ${griType}. Retrying in ${delay}ms... (attempt ${
                    retryCount + 1
                  }/${maxRetries})`
                );

                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, delay));

                // Retry the request
                return makeGriRequest(griType, retryCount + 1);
              }

              throw new Error(
                `${griType} evaluation failed with status: ${evaluateResponse.status} - ${errorText}`
              );
            }

            const griData: GriResponse = await evaluateResponse.json();
            console.log(`Response for ${griType}:`, griData);
            console.log(
              `${griType} analysis completed${
                retryCount > 0 ? ` after ${retryCount} retries` : ""
              }`
            );

            return { griType, griData };
          } catch (error) {
            // Handle network errors or other exceptions
            if (retryCount < maxRetries) {
              const delay = baseDelay * Math.pow(2, retryCount);
              console.log(
                `Network error for ${griType}. Retrying in ${delay}ms... (attempt ${
                  retryCount + 1
                }/${maxRetries})`
              );

              // Wait before retrying
              await new Promise((resolve) => setTimeout(resolve, delay));

              // Retry the request
              return makeGriRequest(griType, retryCount + 1);
            }

            // If we've exhausted all retries, throw the error
            throw error;
          }
        };

        // Run all GRI requests in parallel and handle results as they complete
        const promises = griTypes.map(async (griType) => {
          try {
            const result = await makeGriRequest(griType);

            // Process result immediately when it completes
            const { griData } = result;

            // Get document_id from the first response (all responses have the same document_id)
            if (!documentId && griData.id) {
              console.log(
                "Setting documentId from evaluate response:",
                griData.id
              );
              setDocumentId(griData.id);
            }

            // Update totals immediately
            totalSpdiIndex += griData.summary.spdi_index ?? 0;

            // Add indicators to the flat list immediately
            const newIndicators = Object.entries(griData.indicators).map(
              ([key, value]) => ({
                index: key,
                score: value.score,
                title: value.title,
                explanation: value.reasoning,
              })
            );

            allIndicators.push(...newIndicators);

            // Update state immediately after each response
            setSpdiIndex(totalSpdiIndex);
            setAllIndicators([...allIndicators]);

            setFinishedGriTypes((prev) => [...prev, griType]);
            setInProgressGriTypes((prev) =>
              prev.filter((type) => type !== griType)
            );

            return result;
          } catch (error) {
            console.error(`Error analyzing ${griType}:`, error);
            setInProgressGriTypes((prev) =>
              prev.filter((type) => type !== griType)
            );

            // Don't throw the error, just return null to indicate failure
            // This allows other requests to continue
            return null;
          }
        });

        // Wait for all promises to complete (but results are already processed)
        const results = await Promise.allSettled(promises);

        // Check if any requests failed
        const failedRequests = results.filter(
          (result) =>
            result.status === "rejected" ||
            (result.status === "fulfilled" && result.value === null)
        );

        if (failedRequests.length > 0) {
          console.warn(
            `${failedRequests.length} GRI analysis requests failed, but continuing with partial results`
          );

          // Show a warning to the user about partial results
          if (failedRequests.length === griTypes.length) {
            // All requests failed
            throw new Error(
              "All GRI analysis requests failed. Please try again later."
            );
          } else {
            // Some requests failed, show warning but continue
            setApiError(
              `Warning: ${failedRequests.length} out of ${griTypes.length} GRI analyses failed. Showing partial results.`
            );
          }
        }

        setCurrentGriType(null);

        setApiLoading(false);
        setAnalysisProgress(null);
      } catch (err) {
        console.error("API request failed:", err);
        setApiError(
          err instanceof Error ? err.message : "Failed to fetch ESG data"
        );
        setApiLoading(false);
        setAnalysisProgress(null);
      }
    }

    // Only run when files are loaded or when file index changes
    if (files.length > 0 && !isLoading) {
      fetchEsgData();
    }
  }, [files, fileIndex, isLoading]);

  // Transform API data into array format for rendering
  const esgResults = apiData
    ? Object.entries(apiData.indicators).map(([key, value]) => ({
        index: key,
        score: value.score,
        explanation: value.reasoning,
      }))
    : [];

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
    currentExplanation: string
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
        }
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
            : indicator
        )
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
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : files.length > 0 ? (
          <>
            {showPdf && (
              <embed
                key={`pdf-embed-${fileIndex}`}
                src={`${files[fileIndex]}#${new Date().getTime()}`}
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
          ESG Analysis Results
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
                  SPDI Index Score out of 33 Index
                </p>
                <p className="text-md font-bold text-green-400">
                  {spdiIndex || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {apiLoading && allIndicators.length === 0 ? (
            <div className="text-center py-8">
              {analysisProgress ? (
                <div className="space-y-4">
                  <p className="text-lg font-semibold text-white">
                    {analysisProgress.currentType}
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (analysisProgress.current / analysisProgress.total) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Step {analysisProgress.current} of {analysisProgress.total}
                  </p>
                </div>
              ) : (
                <p>Loading ESG analysis results...</p>
              )}
            </div>
          ) : apiError ? (
            <p className="text-red-500 text-center py-8">{apiError}</p>
          ) : allIndicators.length > 0 ? (
            <div className="space-y-6">
              {/* Show partial results notice if still loading */}
              {apiLoading && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-4">
                  <p className="text-blue-300 text-sm">
                    ⚡ Showing partial results while remaining analyses
                    complete...
                  </p>
                </div>
              )}

              {allIndicators.map((result, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-6 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {result.index}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {editingIndicators.has(index) ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            max="4"
                            value={editedValues[index]?.score ?? result.score}
                            onChange={(e) =>
                              handleScoreChange(
                                index,
                                parseInt(e.target.value) || 0
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

                      {/* Edit/Save buttons - only show when all requests finished */}
                      {(() => {
                        console.log("Edit button condition check:", {
                          inProgressGriTypesLength: inProgressGriTypes.length,
                          documentId: documentId,
                          shouldShow:
                            inProgressGriTypes.length === 0 && documentId,
                        });
                        return (
                          inProgressGriTypes.length === 0 &&
                          documentId &&
                          (editingIndicators.has(index) ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSaveIndicator(index)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => handleCancelEdit(index)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                handleEditIndicator(
                                  index,
                                  result.score,
                                  result.explanation
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                            >
                              Edit
                            </button>
                          ))
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-gray-300 mb-2">
                      Explanation
                    </h4>
                    {editingIndicators.has(index) ? (
                      <textarea
                        value={
                          editedValues[index]?.explanation ?? result.explanation
                        }
                        onChange={(e) =>
                          handleExplanationChange(index, e.target.value)
                        }
                        className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical min-h-24"
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {result.explanation}
                      </p>
                    )}
                  </div>
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
