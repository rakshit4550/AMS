import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FaTimes } from "react-icons/fa";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// pdf.js worker — renders PDF pages on canvas (works on mobile, unlike iframe)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfPreviewModal = ({ open, url, onClose, onDownload }) => {
  const containerRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) {
      setNumPages(null);
      setLoadError("");
      setLoading(true);
      return;
    }

    const el = containerRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      const next = Math.max(Math.floor(el.clientWidth - 16), 280);
      setPageWidth(next);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  if (!open || !url) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-[min(95dvh,900px)] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-3 sm:px-5">
          <div>
            <h2 className="text-base font-bold text-gray-800 sm:text-lg">
              PDF Preview
            </h2>
            <p className="text-xs text-slate-500">
              Review before downloading
              {numPages ? ` · ${numPages} page${numPages > 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            <FaTimes className="h-3.5 w-3.5" aria-hidden />
            Cancel
          </button>
        </div>

        <div
          ref={containerRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-200/90 px-2 py-3 sm:px-4"
        >
          {loading && !loadError && (
            <p className="py-10 text-center text-sm text-slate-500">
              Loading preview…
            </p>
          )}

          {loadError && (
            <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {loadError}
              <p className="mt-2 text-xs text-red-600/80">
                You can still download the PDF below.
              </p>
            </div>
          )}

          <Document
            file={url}
            loading=""
            onLoadSuccess={({ numPages: pages }) => {
              setNumPages(pages);
              setLoading(false);
              setLoadError("");
            }}
            onLoadError={() => {
              setLoading(false);
              setLoadError("Could not render PDF preview on this device.");
            }}
            className="flex flex-col items-center gap-3"
          >
            {numPages &&
              pageWidth > 0 &&
              Array.from({ length: numPages }, (_, i) => (
                <Page
                  key={`page_${i + 1}`}
                  pageNumber={i + 1}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="overflow-hidden rounded-md bg-white shadow-md"
                />
              ))}
          </Document>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
