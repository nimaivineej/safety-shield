import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { supportService } from '../../services/support.service';

const faqs = [
  {
    q: 'How does the SOS button work?',
    a: 'When you press the SOS button, the app immediately sends your live location to all your emergency contacts and nearby registered volunteers. Authorities are also notified automatically.',
  },
  {
    q: 'Can I use the app without internet?',
    a: 'Core SOS features require internet for notifications. However, your location is stored locally and synced when connectivity returns.',
  },
  {
    q: 'How do I add emergency contacts?',
    a: 'Go to Profile → Emergency Contacts (or use the Quick Action on the Home screen). Tap the + button to add a contact by name, phone, and relationship.',
  },
  {
    q: 'What is a Volunteer?',
    a: 'Volunteers are verified community members who can respond to nearby incidents and SOS alerts to provide assistance before authorities arrive.',
  },
  {
    q: 'How is my location data protected?',
    a: 'Your location is only shared during active SOS or reported incidents. It is encrypted in transit and never sold to third parties.',
  },
  {
    q: 'How do I report incorrect information on the map?',
    a: 'Tap any map marker and use the "Report Issue" option, or contact us via the support form below.',
  },
];

export function HelpSupportScreen() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      await supportService.createTicket(message);
      setSent(true);
      setMessage('');
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error('Failed to send support message', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Help & Support</h1>
            <p className="text-purple-100">We're here to help you</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Quick Contact */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Phone, label: 'Call Us', color: 'from-green-500 to-green-600', action: () => window.location.href = 'tel:1800001234' },
            { icon: Mail, label: 'Email Us', color: 'from-blue-500 to-blue-600', action: () => window.location.href = 'mailto:support@safetysheild.app' },
            { icon: MessageCircle, label: 'Live Chat', color: 'from-purple-500 to-purple-600', action: () => alert('Live chat coming soon!') },
          ].map(({ icon: Icon, label, color, action }) => (
            <button
              key={label}
              onClick={action}
              className={`bg-gradient-to-br ${color} text-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-md hover:shadow-lg transition-shadow`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" /> Frequently Asked Questions
            </h2>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} className="border-t border-gray-100 first:border-t-0">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="w-5 h-5 text-purple-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed bg-purple-50 border-t border-purple-100">
                  <p className="pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-3xl shadow-md p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600" /> Send us a message
          </h2>
          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="font-semibold text-green-700">Message sent!</p>
              <p className="text-sm text-gray-500 mt-1">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question..."
                rows={4}
                className="w-full p-3 rounded-2xl border border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isSending}
                className="w-full mt-3 h-12 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:opacity-50 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} 
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
            </>
          )}
        </div>

        {/* App Version */}
        <div className="bg-purple-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-purple-900 font-medium">SafetyShield v1.0.0</p>
          <p className="text-xs text-purple-600 mt-1">Your Safety, Our Priority</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
