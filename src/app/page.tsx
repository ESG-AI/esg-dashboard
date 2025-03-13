"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2 } from "lucide-react";
import { url } from "inspector";

export default function Home() {
  const [files, setFiles] = useState< File[]>([]);
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
  }
  
  const handleStartAnalysis = () => {
    if (files.length === 0) return;

    const fileUrls = files.map((file) => URL.createObjectURL(file));

    router.push(`/results?${fileUrls.map((url) => `files=${encodeURIComponent(url)}`).join("&")}`);
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <div
        className="border-2 border-gray-600 border-dashed rounded-2xl p-10 flex flex-col items-center w-96 cursor-pointer hover:border-gray-400 transition"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <label className="cursor-pointer flex flex-col items-center">
          <Upload size={40} className="text-gray-400 mb-4" />
          <p className="text-gray-400">Drag & drop or click to upload</p>
          <input 
            type="file" 
            accept=".pdf, .docx" 
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
      {files.length > 0 && (
        <div className="mt-4 w-96 max-h-40 overflow-y-auto">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-gray-800 p-2 rounded-lg mb-2"
            >
              <span className="text-gray-300 text-sm truncate w-72">{file.name}</span>
              <button onClick={() => handleRemoveFile(index)}>
                <Trash2 size={16} className="text-red-500 hover:text-red-600"/>
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={handleStartAnalysis}
        disabled={files.length === 0}
        className={`mt-6 px-4 py-2 rounded-lg text-white transition ${
          files.length > 0 ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500 cursor-not-allowed"
        }`}
      >
        Start Analysis
      </button>
    </div>
  );
}
