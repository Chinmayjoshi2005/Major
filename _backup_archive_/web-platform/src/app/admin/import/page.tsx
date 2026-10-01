"use client";

import { useState, useRef } from "react";
import { NeoCard } from "@/components/neo-brutal/neo-card";
import { NeoButton } from "@/components/neo-brutal/neo-button";

type CollectionType = "faculty" | "rooms" | "departments" | "navigation_nodes" | "navigation_edges";

export default function AdminImportPage() {
  const [importCollection, setImportCollection] = useState<CollectionType>("faculty");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState<Record<string, unknown>[] | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          setImportStatus({ success: false, message: "Invalid JSON format. Expected an array of records." });
          setFileContent(null);
          return;
        }
        setFileContent(json);
      } catch {
        setImportStatus({ success: false, message: "Invalid JSON file." });
        setFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!fileContent) {
      setImportStatus({ success: false, message: "Please select a valid JSON file first." });
      return;
    }

    setLoading(true);
    setImportStatus(null);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: importCollection,
          data: fileContent,
        }),
      });

      const json = await res.json();
      setLoading(false);

      if (!json.success) {
        setImportStatus({ success: false, message: json.error?.message || "Import failed." });
        return;
      }

      setImportStatus({ success: true, message: json.message });
      setFileName("");
      setFileContent(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setLoading(false);
      setImportStatus({ success: false, message: "An error occurred during import." });
    }
  };

  const handleExport = (collection: string) => {
    window.location.href = `/api/admin/export?collection=${collection}`;
  };

  return (
    <div className="e-page page-content">
      <div className="e-page-header">
        <h1 className="e-page-title">Import / Export</h1>
        <p className="e-page-subtitle">Data management</p>
      </div>

      <div className="e-grid-2 space-y-6 md:space-y-0 md:gap-6">
        <NeoCard className="e-action-card">
          <h2 className="e-card-title mb-4 text-xl font-bold uppercase">JSON Import</h2>
          <p className="e-card-text mb-4 text-sm text-gray-700">
            Upload faculty, rooms, departments, or navigation data as JSON.
            Validates against schemas before committing to the database.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-600">
                Target Collection
              </label>
              <select
                value={importCollection}
                onChange={(e) => {
                  setImportCollection(e.target.value as CollectionType);
                  setImportStatus(null);
                }}
                className="neo-border w-full bg-white px-4 py-2 font-medium outline-none focus-visible:ring-2 focus-visible:ring-neo-yellow"
              >
                <option value="faculty">Faculty</option>
                <option value="rooms">Rooms</option>
                <option value="departments">Departments</option>
                <option value="navigation_nodes">Navigation Nodes</option>
                <option value="navigation_edges">Navigation Edges</option>
              </select>
            </div>

            <div>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="json-file-picker"
              />
              <div className="flex gap-2">
                <NeoButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="whitespace-nowrap"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Select JSON File
                </NeoButton>
                <span className="flex items-center text-xs font-mono text-gray-600 truncate">
                  {fileName || "No file chosen"}
                </span>
              </div>
            </div>

            {importStatus && (
              <p className={`text-sm font-bold ${importStatus.success ? "text-teal-800" : "text-red-600"}`}>
                {importStatus.message}
              </p>
            )}

            <NeoButton
              type="button"
              className="w-full mt-2"
              onClick={handleImport}
              disabled={loading || !fileContent}
            >
              {loading ? "Importing..." : "Upload & Import"}
            </NeoButton>
          </div>
        </NeoCard>

        <NeoCard className="e-action-card">
          <h2 className="e-card-title mb-4 text-xl font-bold uppercase">JSON Export</h2>
          <p className="e-card-text mb-4 text-sm text-gray-700">
            Export current database records for backup or migration.
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex flex-wrap gap-2">
              <NeoButton size="sm" className="e-btn" onClick={() => handleExport("faculty")}>
                Faculty
              </NeoButton>
              <NeoButton size="sm" className="e-btn" onClick={() => handleExport("rooms")}>
                Rooms
              </NeoButton>
              <NeoButton size="sm" className="e-btn" onClick={() => handleExport("departments")}>
                Departments
              </NeoButton>
            </div>
            <div className="flex flex-wrap gap-2">
              <NeoButton size="sm" className="e-btn" onClick={() => handleExport("navigation_nodes")}>
                Nav Nodes
              </NeoButton>
              <NeoButton size="sm" className="e-btn" onClick={() => handleExport("navigation_edges")}>
                Nav Edges
              </NeoButton>
            </div>
          </div>
        </NeoCard>
      </div>
    </div>
  );
}
