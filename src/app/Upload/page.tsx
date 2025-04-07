"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, FileText } from "lucide-react";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles([...files, ...Array.from(event.target.files)]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      setFiles([...files, ...Array.from(event.dataTransfer.files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = () => {
    if (files.length === 0) return;

    const fileUrls = files.map((file) => URL.createObjectURL(file));
    router.push(
      `/results?${fileUrls
        .map((url) => `files=${encodeURIComponent(url)}`)
        .join("&")}`
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-200">
      {/* Header Section */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">Upload Your Files</h1>
        <p className="mt-2 text-gray-400">
          Upload your Sustainability Report in PDF or DOCX format to start the
          ESG analysis.
        </p>
      </header>

      {/* Drag-and-Drop Area */}
      <div
        className="border-2 border-gray-600 border-dashed rounded-2xl p-10 flex flex-col items-center w-96 cursor-pointer hover:border-gray-400 transition bg-gray-800"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <label className="cursor-pointer flex flex-col items-center">
          <Upload size={48} className="text-blue-500 mb-4" />
          <p className="text-gray-300 font-medium">
            Drag & drop or click to upload
          </p>
          <input
            type="file"
            accept=".pdf, .docx"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* File List */}
      {files.length > 0 ? (
        <div className="mt-6 w-96 max-h-40 overflow-y-auto bg-gray-800 p-4 rounded-lg">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 mb-2 w-full h-12" // Fixed height for consistent alignment
            >
              <div className="flex items-center gap-3 w-full overflow-hidden">
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm truncate">
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => handleRemoveFile(index)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-gray-600"
                style={{ width: "32px", height: "32px" }} // Fixed size for the button
              >
                <Trash2 size={16} className="text-red-500 hover:text-red-600" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-gray-500">No files uploaded yet.</p>
      )}

      {/* Start Analysis Button */}
      <button
        onClick={handleStartAnalysis}
        disabled={files.length === 0}
        className={`mt-6 px-6 py-3 rounded-full text-white font-semibold transition ${
          files.length > 0
            ? "bg-gradient-to-r from-green-400 to-blue-500 hover:opacity-90"
            : "bg-gray-600 cursor-not-allowed"
        }`}
      >
        Start Analysis
      </button>
    </div>
  );
}
