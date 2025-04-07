"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export default function Results() {
  const searchParams = useSearchParams();
  const fileUrls = searchParams.getAll("files");
  const [fileIndex, setFileIndex] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(true);

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
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {esgResults.map((result, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold">{result.index}</h3>
                <p className="text-gray-300">Score: {result.score}</p>
                <p className="text-gray-500">{result.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
