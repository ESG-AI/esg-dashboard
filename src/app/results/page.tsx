"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dotenv from "dotenv";

dotenv.config();

const esgResults = [
  { index: "2-9-b", score: 80, explanation: "Explanation for 2-9-b" },
  {
    index: "2-16-a (structure)",
    score: 85,
    explanation: "Explanation for 2-16-a (structure)",
  },
  { index: "2-9-c", score: 78, explanation: "Explanation for 2-9-c" },
  {
    index: "2-29 (structure)",
    score: 82,
    explanation: "Explanation for 2-29 (structure)",
  },
  { index: "3-2-a", score: 90, explanation: "Explanation for 3-2-a" },
  { index: "2-5", score: 88, explanation: "Explanation for 2-5" },
  {
    index: "2-16-a (stakeholder engagement)",
    score: 84,
    explanation: "Explanation for 2-16-a (stakeholder engagement)",
  },
  { index: "2-30-a", score: 76, explanation: "Explanation for 2-30-a" },
  { index: "2-29", score: 81, explanation: "Explanation for 2-29" },
  { index: "301-2", score: 79, explanation: "Explanation for 301-2" },
  { index: "301-1", score: 77, explanation: "Explanation for 301-1" },
  { index: "301-3", score: 80, explanation: "Explanation for 301-3" },
  { index: "204-1", score: 83, explanation: "Explanation for 204-1" },
  { index: "308-1", score: 86, explanation: "Explanation for 308-1" },
  { index: "308-2", score: 89, explanation: "Explanation for 308-2" },
  { index: "414-1", score: 87, explanation: "Explanation for 414-1" },
  { index: "414-2", score: 85, explanation: "Explanation for 414-2" },
  { index: "306-2", score: 88, explanation: "Explanation for 306-2" },
  { index: "409-1", score: 84, explanation: "Explanation for 409-1" },
  { index: "407-1", score: 82, explanation: "Explanation for 407-1" },
  { index: "403-1", score: 81, explanation: "Explanation for 403-1" },
  { index: "417-1", score: 79, explanation: "Explanation for 417-1" },
  { index: "417-2", score: 78, explanation: "Explanation for 417-2" },
  { index: "417-3", score: 80, explanation: "Explanation for 417-3" },
  { index: "2-27", score: 83, explanation: "Explanation for 2-27" },
  { index: "306-5", score: 85, explanation: "Explanation for 306-5" },
  { index: "303-4", score: 87, explanation: "Explanation for 303-4" },
  { index: "305-1", score: 89, explanation: "Explanation for 305-1" },
  { index: "305-2", score: 88, explanation: "Explanation for 305-2" },
  { index: "305-3", score: 86, explanation: "Explanation for 305-3" },
  { index: "302-1", score: 84, explanation: "Explanation for 302-1" },
  { index: "302-2", score: 82, explanation: "Explanation for 302-2" },
  { index: "302-3", score: 81, explanation: "Explanation for 302-3" },
];

// Response type definition based on the JSON structure
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

export default function Results() {
  const searchParams = useSearchParams();
  const fileUrls = searchParams.getAll("files");
  const [fileIndex, setFileIndex] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(true);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

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
    async function fetchEsgData() {
      try {
        // Don't try to fetch if no files are available
        if (files.length === 0 || isLoading) {
          return;
        }

        setApiLoading(true);
        console.log("Starting API request for file index:", fileIndex);

        // Record start time
        const startTime = new Date().getTime();

        // Get current PDF file from blob URL
        const response = await fetch(files[fileIndex]);
        const blob = await response.blob();
        console.log("PDF blob retrieved:", blob.size, "bytes");

        // Create FormData and append the PDF
        const formData = new FormData();

        // Change the field name to "pdf" as required by the backend
        formData.append("pdf", blob, `file-${fileIndex}.pdf`);
        // Keep any additional metadata that might be needed
        formData.append("document_type", "sustainability_report");

        const esg_api = process.env.ESG_API;
        console.log("ESG API URL:", esg_api);

        const endpoint = files.length > 1 ?
          `${esg_api}/evaluate-multi` :
          `${esg_api}/evaluate`;
        
        console.log("Sending API request to:", endpoint);

        // Add mode: 'cors' to explicitly handle CORS
        const apiResponse = await fetch(endpoint, {
          method: "POST",
          mode: "cors",
          body: formData,
        });

        console.log("API response status:", apiResponse.status);

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error("Error response:", errorText);
          throw new Error(`API responded with status: ${apiResponse.status}`);
        }

        const data: ApiResponse = await apiResponse.json();

        // Calculate response time in seconds
        const endTime = new Date().getTime();
        const responseTimeSeconds = (endTime - startTime) / 1000;
        setResponseTime(responseTimeSeconds);

        console.log("API data received:", data);
        setApiData(data);
        setApiLoading(false);
      } catch (err) {
        console.error("API request failed:", err);
        setApiError(
          err instanceof Error ? err.message : "Failed to fetch ESG data"
        );
        setApiLoading(false);
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

        {/* Add token usage and response time info */}
        {!apiLoading && !apiError && apiData && (
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-semibold text-gray-300">
                Analysis Summary
              </h3>
              {responseTime && (
                <span className="text-sm text-gray-400">
                  Response time: {responseTime.toFixed(2)}s
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="bg-gray-700 p-2 rounded-md">
                <p className="text-sm text-gray-400">Total tokens used</p>
                <p className="text-md font-bold text-blue-400">
                  {apiData.token_usage?.total_tokens_used?.toLocaleString() ||
                    "N/A"}
                </p>
              </div>

              <div className="bg-gray-700 p-2 rounded-md">
                <p className="text-sm text-gray-400">Overall ESG Score</p>
                <p className="text-md font-bold text-green-400">
                  {apiData.summary?.overall || "N/A"}
                </p>
              </div>

              <div className="bg-gray-700 p-2 rounded-md">
                <p className="text-sm text-gray-400">SPDI Index Score</p>
                <p className="text-md font-bold text-green-400">
                  {apiData.summary?.spdi_index || "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="bg-gray-700 p-2 rounded-md">
                <p className="text-xs text-gray-400">Governance</p>
                <p className="text-md font-bold text-green-400">
                  {apiData.summary?.governance || "N/A"}
                </p>
              </div>
              <div className="bg-gray-700 p-2 rounded-md">
                <p className="text-xs text-gray-400">Economic</p>
                <p className="text-md font-bold text-green-400">
                  {apiData.summary?.economic || "N/A"}
                </p>
              </div>
              <div className="bg-gray-700 p-2 rounded-md">
                <p className="text-xs text-gray-400">Social</p>
                <p className="text-md font-bold text-green-400">
                  {apiData.summary?.social || "N/A"}
                </p>
              </div>
              <div className="bg-gray-700 p-2 rounded-md">
                <p className="text-xs text-gray-400">Environmental</p>
                <p className="text-md font-bold text-green-400">
                  {apiData.summary?.environmental || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {apiLoading ? (
            <p className="text-center py-8">Loading ESG analysis results...</p>
          ) : apiError ? (
            <p className="text-red-500 text-center py-8">{apiError}</p>
          ) : esgResults.length > 0 ? (
            <div className="space-y-6">
              {esgResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-6 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {result.index}
                    </h3>
                    <p className="text-2xl font-bold text-green-400">
                      {result.score}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-gray-300 mb-2">
                      Explanation
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>

                  {/* Add token usage for each indicator */}
                  {apiData?.token_usage?.by_indicator?.[result.index] && (
                    <div className="mt-4 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500">
                        Tokens:{" "}
                        {apiData.token_usage.by_indicator[
                          result.index
                        ].total_tokens.toLocaleString()}
                        (Prompt:{" "}
                        {apiData.token_usage.by_indicator[
                          result.index
                        ].prompt_tokens.toLocaleString()}
                        , Response:{" "}
                        {apiData.token_usage.by_indicator[
                          result.index
                        ].response_tokens.toLocaleString()}
                        )
                      </p>
                    </div>
                  )}
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
