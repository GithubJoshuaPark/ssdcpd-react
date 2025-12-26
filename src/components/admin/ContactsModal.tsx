import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteContact,
  getAllContacts,
  sendEmailByAdminFunction,
  updateContactResponse,
} from "../../services/firebaseService";
import type { Contact } from "../../types_interfaces/contact";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { RichEditor } from "../common/RichEditor";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  // Reset to page 1 when search, filter, or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, itemsPerPage]);

  const handleResponseChange = (id: string, value: string) => {
    setResponseTexts(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveResponse = async (id: string) => {
    const responseText = responseTexts[id];
    const contact = contacts.find(c => c.id === id);

    setLoading(true);
    try {
      await updateContactResponse(id, responseText);

      // 이메일 발송 추가
      if (contact && responseText) {
        try {
          // HTML에서 태그를 제거한 평문 버전 (간단한 정규식)
          const plainText = responseText.replace(/<[^>]*>/g, "");

          await sendEmailByAdminFunction(
            contact.email,
            `Response to your inquiry: ${contact.subject}`,
            `Hello ${contact.name},\n\nThank you for your contact. Here is our response:\n\n${plainText}\n\nBest regards,\nSSDCPD Admin`,
            `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <p>Hello <strong>${contact.name}</strong>,</p>
              <p>Thank you for your contact. Here is our response:</p>
              <div style="padding: 15px; background-color: #f4f4f4; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 4px;">
                ${responseText}
              </div>
              <p>Best regards,<br/><strong>SSDCPD Admin</strong></p>
            </div>`
          );
          console.log("Response email process triggered.");
        } catch (emailErr) {
          console.error(
            "Failed to send email, but response was saved:",
            emailErr
          );
        }
      }

      setToast({ message: "Response saved and email sent!", type: "success" });
      await loadAllContacts();
    } catch (error) {
      console.error("Error saving response:", error);
      setToast({ message: "Failed to save response.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setContactToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!contactToDeleteId) return;
    setLoading(true);
    try {
      await deleteContact(contactToDeleteId);
      setToast({ message: "Message deleted.", type: "success" });
      await loadAllContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      setToast({ message: "Failed to delete message.", type: "error" });
    } finally {
      setIsConfirmOpen(false);
      setContactToDeleteId(null);
      setLoading(false);
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
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
  }, [contacts, searchTerm, filter]);

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContacts, currentPage, itemsPerPage]);

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div
        className="auth-modal contact-modal-container"
        style={{
          maxWidth: "900px",
          width: "95%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button className="auth-modal-close" onClick={onClose}>
          &times;
        </button>

        <h2 className="auth-modal-title">Admin: All Contacts</h2>

        <div
          className="auth-form-group"
          style={{
            marginBottom: "16px",
            display: "flex",
            flexDirection: "row",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search by name, email, subject, or message..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="auth-input"
            style={{ flex: 1, marginBottom: 0 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              Show:
            </span>
            <select
              value={itemsPerPage}
              onChange={e => setItemsPerPage(Number(e.target.value))}
              className="auth-input"
              style={{
                width: "70px",
                padding: "6px 8px",
                marginBottom: 0,
                cursor: "pointer",
              }}
            >
              {[5, 10, 20, 30].map(val => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="filter-group"
          style={{ marginBottom: "20px", display: "flex", gap: "10px" }}
        >
          {(["all", "responsed", "pending"] as const).map(type => (
            <button
              key={type}
              className={`chip ${filter === type ? "chip-active" : ""}`}
              onClick={() => setFilter(type)}
            >
              {type === "all"
                ? "All Contacts"
                : type === "responsed"
                ? "Responsed Only"
                : "Not yet"}
            </button>
          ))}
        </div>

        <div
          className="contact-modal-content"
          style={{ overflowY: "auto", flex: 1 }}
        >
          <div className="contact-messages-list" style={{ maxHeight: "none" }}>
            {loading && contacts.length === 0 ? (
              <p>Loading contacts...</p>
            ) : paginatedContacts.length === 0 ? (
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
                  marginTop: "5px",
                }}
              >
                {paginatedContacts.map(c => (
                  <div
                    key={c.id}
                    className="card"
                    style={{
                      padding: "20px",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="contact-card-header">
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
                      <div style={{ marginTop: "8px" }}>
                        <RichEditor
                          value={c.message}
                          readOnly={true}
                          minHeight="auto"
                        />
                      </div>
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
                      <RichEditor
                        value={responseTexts[c.id!] || ""}
                        onChange={content =>
                          handleResponseChange(c.id!, content)
                        }
                        placeholder="Write your response here..."
                        minHeight="120px"
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div
            className="pagination-controls"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "15px",
              padding: "20px 0 0",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              marginTop: "10px",
            }}
          >
            <button
              className="chip"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              &larr; Prev
            </button>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Page <strong>{currentPage}</strong> of {totalPages}
            </span>
            <button
              className="chip"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {loading && <LoadingSpinner message="Processing..." />}

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
