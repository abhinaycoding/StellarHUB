import { useState } from "react";
import { Book, Plus, Search, Trash2, Edit2, AlertCircle, Copy, Check, UserPlus } from "lucide-react";
import { useAddressBook, type AddressBookContact } from "@/contexts/AddressBookContext";
import { isValidAddress } from "@/services/stellar";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export function AddressBook() {
  const { contacts, addContact, updateContact, removeContact } = useAddressBook();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<AddressBookContact | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: "", address: "" });

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) return;

    if (!isValidAddress(formData.address.trim())) {
      toast.error("Invalid Stellar address");
      return;
    }

    if (editingContact) {
      updateContact({ ...editingContact, ...formData });
      toast.success("Contact updated");
    } else {
      addContact(formData);
      toast.success("Contact added");
    }

    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    setFormData({ name: "", address: "" });
  };

  const openEditModal = (contact: AddressBookContact) => {
    setEditingContact(contact);
    setFormData({ name: contact.name, address: contact.address });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      removeContact(id);
      toast.success("Contact removed");
    }
  };

  const handleCopy = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Book className="w-8 h-8 text-primary" />
            Address Book
          </h1>
          <p className="text-text-secondary mt-1">Manage your saved Stellar addresses</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </motion.button>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 bg-surface/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="divide-y divide-border min-h-[300px]">
          <AnimatePresence mode="popLayout">
            {filteredContacts.length === 0 ? (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-12 text-center flex flex-col items-center justify-center h-[300px]"
              >
                <div className="relative mb-6">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="bg-primary/10 p-6 rounded-full relative z-10"
                  >
                    <Book className="w-12 h-12 text-primary" />
                  </motion.div>
                  <motion.div 
                    animate={{ y: [0, -12, 0] }} 
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="absolute -top-4 -right-4 bg-background p-2 rounded-full border border-border z-20 shadow-lg"
                  >
                    <UserPlus className="w-5 h-5 text-text-secondary" />
                  </motion.div>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {search ? "No contacts found" : "Your address book is empty"}
                </h3>
                <p className="text-text-secondary max-w-sm text-center">
                  {search ? `We couldn't find any contacts matching "${search}".` : "Add a new Stellar address to quickly access it for sending and receiving."}
                </p>
                {!search && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 text-primary font-medium flex items-center gap-2 hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Add your first contact
                  </motion.button>
                )}
              </motion.div>
            ) : (
              filteredContacts.map((contact) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  key={contact.id} 
                  className="p-4 flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-text-primary truncate">{contact.name}</h3>
                    <p className="text-sm font-mono text-text-secondary truncate mt-1">{contact.address}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCopy(contact.address, contact.id)}
                      title="Copy Address"
                      className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {copiedId === contact.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEditModal(contact)}
                      title="Edit Contact"
                      className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(contact.id)}
                      title="Delete Contact"
                      className="p-2 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
            >
            <div className="p-6">
              <h2 className="text-xl font-bold text-text-primary mb-6">
                {editingContact ? "Edit Contact" : "Add New Contact"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alice's Wallet"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Stellar Address</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="G..."
                    className="w-full font-mono bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg mt-4">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-primary/90 leading-relaxed">
                    Always double-check Stellar addresses before saving. Incorrect addresses can lead to permanent loss of funds.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 rounded-lg font-medium bg-background hover:bg-white/5 text-text-primary border border-border transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg font-medium bg-primary hover:bg-primary/90 text-white transition-colors"
                  >
                    {editingContact ? "Save Changes" : "Add Contact"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
