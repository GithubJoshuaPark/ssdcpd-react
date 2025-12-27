// src/components/admin/TrackFormModal.tsx
import type { FC, FormEvent } from "react";
import { useEffect, useState } from "react";
import { createTrack, updateTrack } from "../../services/firebaseService";
import type {
  Track,
  TrackCategory,
  TrackStatus,
} from "../../types_interfaces/track";
import { RichEditor } from "../common/RichEditor";
import { Toast } from "../common/Toast";

interface TrackFormModalProps {
  isOpen: boolean;
  onClose: (shouldReload?: boolean) => void;
  track?: Track | null;
}

export const TrackFormModal: FC<TrackFormModalProps> = ({
  isOpen,
  onClose,
  track,
}) => {
  const isEditMode = !!track;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TrackCategory>("systems");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState<TrackStatus>("Active");
  const [short, setShort] = useState("");
  const [shortKo, setShortKo] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with track data when editing
  useEffect(() => {
    if (isOpen && track) {
      setTitle(track.title || "");
      setCategory(track.category || "systems");
      setLevel(track.level || "");
      setStatus(track.status || "Active");
      setShort(track.short || "");
      setShortKo(track.short_ko || "");
      setUrl(track.url || "");
      setTags(track.tags?.join(", ") || "");
    } else if (isOpen && !track) {
      // Reset form for new track
      setTitle("");
      setCategory("systems");
      setLevel("");
      setStatus("Active");
      setShort("");
      setShortKo("");
      setUrl("");
      setTags("");
    }
  }, [isOpen, track]);

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();
      const trackData: Omit<Track, "id"> = {
        title: title.trim(),
        category,
        level: level.trim() || undefined,
        status,
        short: short.trim() || undefined,
        short_ko: shortKo.trim() || undefined,
        url: url.trim() || undefined,
        tags: tags.trim()
          ? tags
              .split(",")
              .map(t => t.trim())
              .filter(Boolean)
          : undefined,
        updatedAt: now,
        // If editing, keep original createdAt if it exists, otherwise use now
        createdAt: isEditMode ? track?.createdAt || now : now,
      };

      if (isEditMode && track?.id) {
        await updateTrack(track.id, trackData);
      } else {
        await createTrack(trackData);
      }

      onClose(true); // Close and reload
    } catch (err) {
      console.error("Error saving track:", err);
      setError(`Failed to ${isEditMode ? "update" : "create"} track`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categories: TrackCategory[] = [
    "systems",
    "scripting",
    "backend",
    "lowlevel",
    "c/c++",
    "frontend",
  ];
  const statuses: TrackStatus[] = ["Active", "Planned", "Deprecated"];

  return (
    <>
      <div className="auth-modal-overlay" onClick={() => onClose()}>
        <div className="track-form-modal" onClick={e => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={() => onClose()}>
            ✕
          </button>

          <h2 className="track-form-title">
            {isEditMode ? "Edit Track" : "Add New Track"}
          </h2>

          <form
            className="track-form"
            onSubmit={handleSubmit}
            style={{ maxWidth: "100%", overflowX: "hidden" }}
          >
            {/* Title */}
            <div className="auth-form-group">
              <label htmlFor="track-title">Title *</label>
              <input
                id="track-title"
                type="text"
                className="auth-input"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Category and Level */}
            <div className="track-form-row" style={{ flexWrap: "wrap" }}>
              <div className="auth-form-group">
                <label htmlFor="track-category">Category *</label>
                <select
                  id="track-category"
                  className="auth-input"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                  value={category}
                  onChange={e => setCategory(e.target.value as TrackCategory)}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="auth-form-group">
                <label htmlFor="track-level">Level</label>
                <input
                  id="track-level"
                  type="text"
                  className="auth-input"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  placeholder="e.g., Beginner, Advanced"
                />
              </div>
            </div>

            {/* Status */}
            <div className="auth-form-group">
              <label htmlFor="track-status">Status</label>
              <select
                id="track-status"
                className="auth-input"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
                value={status}
                onChange={e => setStatus(e.target.value as TrackStatus)}
              >
                {statuses.map(stat => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description (EN) */}
            <div className="auth-form-group">
              <label htmlFor="track-short">Description (English)</label>
              <RichEditor
                value={short}
                onChange={setShort}
                placeholder="Brief description in English"
                minHeight="120px"
              />
            </div>

            {/* Description (KO) */}
            <div className="auth-form-group">
              <label htmlFor="track-short-ko">Description (Korean)</label>
              <RichEditor
                value={shortKo}
                onChange={setShortKo}
                placeholder="간단한 설명 (한국어)"
                minHeight="120px"
              />
            </div>

            {/* URL */}
            <div className="auth-form-group">
              <label htmlFor="track-url">Repository URL</label>
              <input
                id="track-url"
                type="url"
                className="auth-input"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>

            {/* Tags */}
            <div className="auth-form-group">
              <label htmlFor="track-tags">Tags (comma-separated)</label>
              <input
                id="track-tags"
                type="text"
                className="auth-input"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="python, docker, linux"
              />
            </div>

            {/* Buttons */}
            <div className="track-form-buttons">
              <button
                type="button"
                className="track-cancel-button"
                onClick={() => onClose()}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="auth-button" disabled={loading}>
                {loading
                  ? "Saving..."
                  : isEditMode
                  ? "Update Track"
                  : "Create Track"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}
    </>
  );
};
