import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Phone, Trash2, Edit, UserPlus, Loader, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BottomNav } from './BottomNav';
import { emergencyContactsService, EmergencyContact, CreateContactData } from '../../services/emergency-contacts.service';

export function EmergencyContactsScreen() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newContact, setNewContact] = useState<CreateContactData>({
    name: '',
    phone: '',
    email: '',
    relationship: '',
  });

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await emergencyContactsService.getContacts();
      setContacts(data);
    } catch (err: any) {
      console.error('Failed to fetch contacts:', err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newContact.phone.length !== 10 || !/^\d+$/.test(newContact.phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const updated = await emergencyContactsService.updateContact(editingId, newContact);
        setContacts(contacts.map(c => c.id === editingId ? updated : c));
        setEditingId(null);
      } else {
        const contact = await emergencyContactsService.addContact(newContact);
        setContacts([contact, ...contacts]);
      }
      setNewContact({ name: '', phone: '', email: '', relationship: '' });
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Failed to save contact:', err);
      setError(err.response?.data?.message || 'Failed to save contact.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await emergencyContactsService.deleteContact(id);
      setContacts(contacts.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Failed to delete contact:', err);
      setError('Failed to delete contact.');
    }
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingId(contact.id);
    setNewContact({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      relationship: contact.relationship,
    });
    setShowAddForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Emergency Contacts</h1>
            <p className="text-purple-100">Manage trusted contacts</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Add Contact Button */}
        {!showAddForm && (
          <Button
            onClick={() => { setShowAddForm(true); setEditingId(null); setNewContact({ name: '', phone: '', email: '', relationship: '' }); }}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Emergency Contact
          </Button>
        )}

        {/* Add/Edit Contact Form */}
        {showAddForm && (
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <button
                onClick={() => { setShowAddForm(false); setEditingId(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <Input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Enter name"
                  className="h-12 rounded-xl"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <Input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="h-12 rounded-xl"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-gray-400 font-normal">(optional — for SOS email alerts)</span>
                </label>
                <Input
                  type="email"
                  value={newContact.email || ''}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="Enter email address"
                  className="h-12 rounded-xl"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <Input
                  type="text"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  placeholder="e.g., Sister, Friend"
                  className="h-12 rounded-xl"
                  required
                  disabled={saving}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? <Loader className="w-5 h-5 animate-spin" /> : editingId ? <><Check className="w-4 h-4 mr-1" /> Update</> : 'Add Contact'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowAddForm(false); setEditingId(null); }}
                  className="flex-1 h-12 rounded-xl"
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <Loader className="w-10 h-10 text-purple-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading contacts...</p>
          </div>
        )}

        {/* Contact List */}
        {!loading && (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{contact.name}</h3>
                    <p className="text-gray-600 text-sm">{contact.phone}</p>
                    {contact.email && <p className="text-blue-500 text-xs">{contact.email}</p>}
                    <p className="text-purple-600 text-sm">{contact.relationship}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${contact.phone}`} className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                      <Phone className="w-5 h-5 text-white" />
                    </a>
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      <Edit className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && contacts.length === 0 && !showAddForm && (
          <div className="text-center py-12">
            <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No emergency contacts added yet</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
