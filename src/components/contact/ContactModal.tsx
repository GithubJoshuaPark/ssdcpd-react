import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import {
  createContact,
  deleteContact,
  getContactsByUid,
  updateContact,
} from "../../services/firebaseService";
import type { Contact } from "../../types_interfaces/contact";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { RichEditor } from "../common/RichEditor";
import { Toast } from "../common/Toast";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "responsed" | "pending">("all");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [contactToDeleteId, setContactToDeleteId] = useState<string | null>(
    null
  );

  const loadContacts = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getContactsByUid(currentUser.uid);
      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadContacts();
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName || "",
        email: currentUser.email || "",
      }));
    }
  }, [isOpen, currentUser, loadContacts]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      if (editingContact) {
        await updateContact(editingContact.id!, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
        setToast({ message: "Message updated successfully!", type: "success" });
      } else {
        await createContact({
          ...formData,
          uid: currentUser.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setToast({ message: "Message sent successfully!", type: "success" });
      }
      setFormData({
        name: currentUser.displayName || "",
        email: currentUser.email || "",
        subject: "",
        message: "",
      });
      setEditingContact(null);
      await loadContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
      setToast({ message: "Failed to save message.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
    });
  };

  const handleDelete = (id: string) => {
    setContactToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!contactToDeleteId) return;

    try {
      await deleteContact(contactToDeleteId);
      setToast({ message: "Message deleted.", type: "success" });
      loadContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      setToast({ message: "Failed to delete message.", type: "error" });
    } finally {
      setIsConfirmOpen(false);
      setContactToDeleteId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setFormData({
      name: currentUser?.displayName || "",
      email: currentUser?.email || "",
      subject: "",
      message: "",
    });
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch =
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
        style={{ maxWidth: "550px", width: "95%", maxHeight: "95vh" }}
      >
        <button className="auth-modal-close" onClick={onClose}>
          &times;
        </button>

        <h2 className="auth-modal-title">
          {editingContact ? "Edit Message" : "Contact Me"}
        </h2>

        <div className="contact-modal-content">
          {/* Form Section */}
          <div className="contact-form-side">
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-group">
                <label style={{ textAlign: "left", display: "block" }}>
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="auth-input"
                  required
                />
              </div>
              <div className="auth-form-group">
                <label style={{ textAlign: "left", display: "block" }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="auth-input"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--text-muted)",
                    cursor: "not-allowed",
                    opacity: 0.7,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                />
              </div>
              <div className="auth-form-group">
                <label style={{ textAlign: "left", display: "block" }}>
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="auth-input"
                  required
                />
              </div>
              <div className="auth-form-group">
                <label style={{ textAlign: "left", display: "block" }}>
                  Message
                </label>
                <RichEditor
                  value={formData.message}
                  onChange={val =>
                    setFormData(prev => ({ ...prev, message: val }))
                  }
                  placeholder="Type your message here..."
                  minHeight="120px"
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {editingContact ? "Update Message" : "Send Message"}
                </button>
                {editingContact && (
                  <button
                    type="button"
                    className="track-cancel-button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Section */}
          <div className="contact-list-side">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>
              My Requests
            </h3>

            <div className="auth-form-group" style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="auth-input"
                style={{ fontSize: "0.85rem", padding: "8px 12px" }}
              />
            </div>

            <div
              className="filter-group"
              style={{ marginBottom: "16px", display: "flex", gap: "8px" }}
            >
              <button
                className={`chip ${filter === "all" ? "chip-active" : ""}`}
                onClick={() => setFilter("all")}
                style={{ fontSize: "0.75rem", padding: "4px 12px" }}
              >
                All
              </button>
              <button
                className={`chip ${
                  filter === "responsed" ? "chip-active" : ""
                }`}
                onClick={() => setFilter("responsed")}
                style={{ fontSize: "0.75rem", padding: "4px 12px" }}
              >
                Responsed
              </button>
              <button
                className={`chip ${filter === "pending" ? "chip-active" : ""}`}
                onClick={() => setFilter("pending")}
                style={{ fontSize: "0.75rem", padding: "4px 12px" }}
              >
                Not yet
              </button>
            </div>

            <div className="contact-messages-list">
              {loading && contacts.length === 0 ? (
                <p>Loading...</p>
              ) : filteredContacts.length === 0 ? (
                <p>
                  {searchTerm ? "No matching messages." : "No messages yet."}
                </p>
              ) : (
                filteredContacts.map(c => (
                  <div
                    key={c.id}
                    className="user-mobile-card"
                    style={{ marginBottom: "12px", padding: "12px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <h4 style={{ fontSize: "0.95rem", margin: 0 }}>
                        {c.subject}
                      </h4>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="track-edit-button"
                          style={{ padding: "2px 6px" }}
                          onClick={() => handleEdit(c)}
                        >
                          E
                        </button>
                        <button
                          className="track-delete-button"
                          style={{ padding: "2px 6px" }}
                          onClick={() => handleDelete(c.id!)}
                        >
                          D
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <RichEditor
                        value={c.message}
                        readOnly={true}
                        minHeight="auto"
                      />
                    </div>
                    <span
                      style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                    >
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>

                    {c.response && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px",
                          background: "rgba(56, 189, 248, 0.1)",
                          borderLeft: "3px solid var(--accent)",
                          borderRadius: "4px",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--accent)",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Response from Admin:
                        </strong>
                        <RichEditor value={c.response} readOnly={true} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
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
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
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
