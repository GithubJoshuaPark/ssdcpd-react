import { saveAs } from "file-saver";
import { useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";

interface DownloadProps<T extends object> {
  isOpen: boolean;
  onClose: () => void;
  data: T[];
  headers: { key: string; label: string }[];
  fileName?: string;
}

// Internal component that handles the modal content logic.
// This is separate so it can be conditionally rendered, ensuring state resets on re-open.
const DownloadModalContent = <T extends object>({
  onClose,
  data,
  headers,
  fileName = "data",
}: Omit<DownloadProps<T>, "isOpen">) => {
  const [title, setTitle] = useState(fileName);
  const [format, setFormat] = useState<"excel" | "csv">("excel");

  const handleDownload = () => {
    // Process data to match headers
    const processedData = data.map(item => {
      const row: Record<string, unknown> = {};
      headers.forEach(header => {
        // Handle nested properties if key contains dots (e.g., 'user.name')
        const getNestedValue = (obj: unknown, path: string): unknown => {
          return path.split(".").reduce((acc, part) => {
            if (acc && typeof acc === "object" && part in acc) {
              return (acc as Record<string, unknown>)[part];
            }
            return undefined;
          }, obj);
        };

        let value = getNestedValue(item, header.key);

        // Basic formatting for arrays or objects
        if (Array.isArray(value)) {
          value = value.join(", ");
        } else if (typeof value === "object" && value !== null) {
          try {
            value = JSON.stringify(value);
          } catch {
            value = String(value);
          }
        }

        row[header.label] = value ?? "";
      });
      return row;
    });

    const finalFileName = title.trim() || "export";

    try {
      if (format === "excel") {
        const worksheet = XLSX.utils.json_to_sheet(processedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const dataBlob = new Blob([excelBuffer], {
          type: "application/octet-stream",
        });
        saveAs(dataBlob, `${finalFileName}.xlsx`);
      } else {
        // CSV Export
        const worksheet = XLSX.utils.json_to_sheet(processedData);
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        const dataBlob = new Blob([csvOutput], {
          type: "text/csv;charset=utf-8",
        });
        saveAs(dataBlob, `${finalFileName}.csv`);
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to generate download file.");
    }

    onClose();
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#1e293b",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          width: "90%",
          maxWidth: "400px",
          color: "white",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            marginBottom: "16px",
            color: "#38bdf8",
          }}
        >
          Export Data
        </h3>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              marginBottom: "4px",
              color: "#cbd5e1",
            }}
          >
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: "100%",
              backgroundColor: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
              padding: "8px 12px",
              color: "white",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              marginBottom: "8px",
              color: "#cbd5e1",
            }}
          >
            Format
          </label>
          <div style={{ display: "flex", gap: "16px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="format"
                value="excel"
                checked={format === "excel"}
                onChange={() => setFormat("excel")}
                style={{ accentColor: "#38bdf8" }}
              />
              <span>Excel</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === "csv"}
                onChange={() => setFormat("csv")}
                style={{ accentColor: "#38bdf8" }}
              />
              <span>CSV</span>
            </label>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              backgroundColor: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              backgroundColor: "#38bdf8",
              color: "black",
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
            }}
          >
            Download
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const DownloadDataWithExcelOrCsv = <T extends object>(
  props: DownloadProps<T>
) => {
  if (!props.isOpen) return null;
  return <DownloadModalContent {...props} />;
};

export default DownloadDataWithExcelOrCsv;
