'use client'

import { useState, useEffect } from 'react';
import { Viewer, Worker } from "@react-pdf-viewer/core";
// Don't forget to import the styles
import "@react-pdf-viewer/core/lib/styles/index.css";

export default function Home() {
  // Use state to track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render the PDF viewer when component is mounted on client side
  if (!isMounted) {
    return <div>Loading PDF viewer...</div>;
  }

  return (
    <main>
      <div style={{ height: '750px' }}>
        {/* <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.min.js">
          <Viewer fileUrl="/test2.pdf" />
        </Worker> */}
        <embed src='/test2.pdf' className='w-50 h-full' />
      </div>
    </main>
  );
}