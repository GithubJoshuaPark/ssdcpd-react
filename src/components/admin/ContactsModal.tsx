import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  deleteContact,
  getAllContacts,
  updateContactResponse,
} from "../../services/firebaseService";
import type { Contact } from "../../types_interfaces/contact";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { Toast } from "../common/Toast";

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactsModal: FC<ContactsModalProps> = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "responsed" | "pending">("all");
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>(
    {}
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [contactToDeleteId, setContactToDeleteId] = useState<string | null>(
    null
  );

  const loadAllContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllContacts();
      // Sort by creation date descending
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setContacts(sortedData);

      // Initialize response texts state
      const initialResponses: Record<string, string> = {};
      sortedData.forEach(c => {
        initialResponses[c.id!] = c.response || "";
      });
      setResponseTexts(initialResponses);
    } catch (error) {
      console.error("Error loading all contacts:", error);
      setToast({ message: "Failed to load contacts.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAllContacts();
    }
  }, [isOpen, loadAllContacts]);

  const handleResponseChange = (id: string, value: string) => {
    setResponseTexts(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveResponse = async (id: string) => {
    const responseText = responseTexts[id];
    try {
      await updateContactResponse(id, responseText);
      setToast({ message: "Response saved successfully!", type: "success" });
      loadAllContacts();
    } catch (error) {
      console.error("Error saving response:", error);
      setToast({ message: "Failed to save response.", type: "error" });
    }
  };

  const handleDeleteClick = (id: string) => {
    setContactToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!contactToDeleteId) return;
    try {
      await deleteContact(contactToDeleteId);
      setToast({ message: "Message deleted.", type: "success" });
      loadAllContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      setToast({ message: "Failed to delete message.", type: "error" });
    } finally {
      setIsConfirmOpen(false);
      setContactToDeleteId(null);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.message.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "responsed") {
      return matchesSearch && !!c.response;
    }

    if (filter === "pending") {
      return matchesSearch && !c.response;
    }

    return matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div
        className="auth-modal contact-modal-container"
        style={{ maxWidth: "900px", width: "95%", maxHeight: "90vh" }}
      >
        <button className="auth-modal-close" onClick={onClose}>
          &times;
        </button>

        <h2 className="auth-modal-title">Admin: All Contacts</h2>

        <div className="auth-form-group" style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search by name, email, subject, or message..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="auth-input"
          />
        </div>

        <div
          className="filter-group"
          style={{ marginBottom: "20px", display: "flex", gap: "10px" }}
        >
          <button
            className={`chip ${filter === "all" ? "chip-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Contacts
          </button>
          <button
            className={`chip ${filter === "responsed" ? "chip-active" : ""}`}
            onClick={() => setFilter("responsed")}
          >
            Responsed Only
          </button>
          <button
            className={`chip ${filter === "pending" ? "chip-active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Not yet
          </button>
        </div>

        <div className="contact-modal-content" style={{ overflowY: "auto" }}>
          <div className="contact-messages-list" style={{ maxHeight: "none" }}>
            {loading && contacts.length === 0 ? (
              <p>Loading contacts...</p>
            ) : filteredContacts.length === 0 ? (
              <p>
                {searchTerm
                  ? "No matching contacts found."
                  : "No contacts available."}
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {filteredContacts.map(c => (
                  <div
                    key={c.id}
                    className="card"
                    style={{
                      padding: "20px",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <div>
                        <strong style={{ color: "var(--accent)" }}>
                          {c.name}
                        </strong>
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.85rem",
                            marginLeft: "10px",
                          }}
                        >
                          ({c.email})
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <h4 style={{ margin: "0 0 5px 0", fontSize: "1rem" }}>
                        {c.subject}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.9rem",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {c.message}
                      </p>
                    </div>

                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        paddingTop: "15px",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.85rem",
                          marginBottom: "8px",
                          fontWeight: "600",
                        }}
                      >
                        Admin Response:
                      </label>
                      <textarea
                        className="auth-input"
                        style={{
                          width: "100%",
                          minHeight: "80px",
                          marginBottom: "10px",
                          fontSize: "0.9rem",
                        }}
                        value={responseTexts[c.id!] || ""}
                        onChange={e =>
                          handleResponseChange(c.id!, e.target.value)
                        }
                        placeholder="Write your response here..."
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "10px",
                        }}
                      >
                        <button
                          className="track-delete-button"
                          onClick={() => handleDeleteClick(c.id!)}
                          style={{ padding: "6px 12px" }}
                        >
                          Delete
                        </button>
                        <button
                          className="auth-button"
                          onClick={() => handleSaveResponse(c.id!)}
                          style={{ padding: "6px 20px" }}
                        >
                          Save Response
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Contact"
        message="Are you sure you want to delete this contact request? This cannot be undone."
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setContactToDeleteId(null);
        }}
      />
    </div>
  );
};
