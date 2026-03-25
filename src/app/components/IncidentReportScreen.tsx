import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, Send, AlertTriangle, Loader, ShieldCheck, X,
  Mic, Square, Play, Pause, Trash2, Camera, ImageIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { BottomNav } from './BottomNav';
import { incidentService, IncidentReportData } from '../../services/incident.service';
import { emergencyContactsService } from '../../services/emergency-contacts.service';
import { sendEmergencySms } from '../../services/sms.service';

/* ─── Voice Recorder Hook ─────────────────────────────────────────────────── */
// Detect the best supported audio MIME type for this platform
function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mp4;codecs=aac',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return ''; // Let browser decide
}

function useVoiceRecorder() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);          // seconds recorded
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick the best supported MIME type for this platform
      const mimeType = getSupportedMimeType();
      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        // Use the recorder's actual mimeType (may differ from requested)
        const actualMime = mr.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecordingState('recorded');
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      setDuration(0);
      setRecordingState('recording');

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone permissions and try again.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  }, []);

  const deleteRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    setRecordingState('idle');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [audioUrl]);

  const togglePlayback = useCallback(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.ontimeupdate = () => setPlaybackTime(audio.currentTime);
      audio.onended = () => { setIsPlaying(false); setPlaybackTime(0); };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    recordingState, audioUrl, audioBlob, duration,
    playbackTime, isPlaying, error,
    startRecording, stopRecording, deleteRecording, togglePlayback,
  };
}


/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ─── Waveform Animation ──────────────────────────────────────────────────── */
function WaveformBars({ active }: { active: boolean }) {
  const bars = [3, 5, 8, 6, 4, 7, 5, 9, 6, 4, 7, 5, 8, 4, 6];
  return (
    <div className="flex items-center gap-0.5 h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${active ? 'bg-red-400' : 'bg-purple-300'}`}
          style={{
            height: active ? `${h * 3}px` : '4px',
            animationDuration: active ? `${0.5 + i * 0.07}s` : undefined,
            animation: active ? 'voicePulse 0.8s ease-in-out infinite alternate' : undefined,
            animationDelay: active ? `${i * 0.05}s` : undefined,
          }}
        />
      ))}
      <style>{`
        @keyframes voicePulse {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
}

export function IncidentReportScreen() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Voice note recorder
  const voice = useVoiceRecorder();

  // Photo upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPhotoPreviews((prev) => [...prev, url]);
    });
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Insurance popup state (shown only after ACCIDENT submit)
  const [showInsurancePopup, setShowInsurancePopup] = useState(false);
  const [pendingAccident, setPendingAccident] = useState<{
    incidentId?: string;
    description: string;
    location: { latitude: number; longitude: number };
    timestamp: string;
  } | null>(null);

  const incidentTypes = [
    { id: 'HARASSMENT', label: 'Harassment', color: 'from-red-500 to-red-600', icon: '⚠️' },
    { id: 'ACCIDENT', label: 'Accident', color: 'from-orange-500 to-orange-600', icon: '🚗' },
    { id: 'THEFT', label: 'Theft', color: 'from-yellow-500 to-yellow-600', icon: '🔒' },
    { id: 'UNSAFE_AREA', label: 'Unsafe Area', color: 'from-purple-500 to-purple-600', icon: '📍' },
  ];

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Default location if geolocation fails
          setLocation({ latitude: 28.6139, longitude: 77.2090 });
        }
      );
    } else {
      setLocation({ latitude: 28.6139, longitude: 77.2090 });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      setError('Unable to get your location. Please enable location services.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data: IncidentReportData = {
        type: selectedType as IncidentReportData['type'],
        description,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      const response = await incidentService.createIncident(data, voice.audioBlob, photos.length ? photos : undefined);
      const incidentId = response?.id;

      if (selectedType === 'ACCIDENT') {
        // Save the incident data and show the insurance popup
        setPendingAccident({
          incidentId,
          description,
          location,
          timestamp: new Date().toISOString(),
        });
        setShowInsurancePopup(true);
      } else {
        // Send SMS to emergency contacts from device
        try {
          const contacts = await emergencyContactsService.getContacts();
          if (contacts && contacts.length > 0) {
            const phoneNumbers = contacts.map(c => c.phone);
            const addressText = location.latitude.toFixed(4) + ', ' + location.longitude.toFixed(4);
            const message = `🚨 EMERGENCY: I've reported a ${selectedType} incident.\nLocation: ${addressText}\nTime: ${new Date().toLocaleString()}`;
            await sendEmergencySms(phoneNumbers, message);
          }
        } catch (err) {
          console.error('Failed to send device SMS:', err);
        }

        setSubmitted(true);
        setTimeout(() => navigate('/home'), 2000);
      }
    } catch (err: any) {
      console.error('Failed to submit incident:', err);
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToInsurance = () => {
    setShowInsurancePopup(false);
    navigate('/insurance-contact', { state: pendingAccident });
  };

  const handleSkipInsurance = () => {
    setShowInsurancePopup(false);
    setSubmitted(true);
    setTimeout(() => navigate('/home'), 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Send className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Report Submitted</h2>
          <p className="text-gray-600">Thank you for reporting. Authorities have been notified.</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Report Incident</h1>
            <p className="text-purple-100">Help us keep everyone safe</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Incident Type Selection */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            Select Incident Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {incidentTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-2xl border-2 transition-all ${selectedType === type.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center text-2xl mb-2 mx-auto`}>
                  {type.icon}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Describe the Incident
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide details about what happened (at least 10 characters)..."
            className="min-h-32 rounded-2xl resize-none"
            required
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Add Photos <span className="text-sm font-normal text-gray-400">(Optional, up to 5)</span>
          </label>

          {/* Hidden file input */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            multiple
            className="hidden"
            onChange={handlePhotoChange}
          />

          {/* Preview grid */}
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {photoPreviews.map((url, i) => (
                <div key={i} className="relative aspect-square">
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {photoPreviews.length < 5 && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-purple-300 rounded-xl flex flex-col items-center justify-center gap-1 text-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>
          )}

          {/* Drop-zone (shown when no photos yet) */}
          {photoPreviews.length === 0 && (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors bg-white"
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Tap to upload photos</p>
              <p className="text-sm text-gray-400 mt-1">JPG, PNG up to 10MB each</p>
            </button>
          )}
        </div>

        {/* Voice Note */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Voice Note <span className="text-sm font-normal text-gray-400">(Optional)</span>
          </label>

          {voice.error && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{voice.error}</p>
            </div>
          )}

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 space-y-4">

            {/* Idle – no recording yet */}
            {voice.recordingState === 'idle' && (
              <button
                type="button"
                onClick={voice.startRecording}
                className="w-full flex flex-col items-center gap-3 py-4 text-gray-500 hover:text-purple-600 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 group-hover:from-purple-200 group-hover:to-blue-200 flex items-center justify-center shadow-sm transition-all">
                  <Mic className="w-8 h-8 text-purple-600" />
                </div>
                <span className="font-medium text-sm">Tap to record voice note</span>
              </button>
            )}

            {/* Recording */}
            {voice.recordingState === 'recording' && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-600 font-semibold text-lg tabular-nums">
                    {formatTime(voice.duration)}
                  </span>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Recording…</span>
                </div>

                <WaveformBars active />

                <button
                  type="button"
                  onClick={voice.stopRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold shadow-md transition-colors"
                >
                  <Square className="w-5 h-5 fill-white" />
                  Stop Recording
                </button>
              </div>
            )}

            {/* Recorded – playback controls */}
            {voice.recordingState === 'recorded' && (
              <div className="space-y-3">
                {/* Waveform row */}
                <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
                  <button
                    type="button"
                    onClick={voice.togglePlayback}
                    className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white shadow flex-shrink-0 transition-colors"
                  >
                    {voice.isPlaying
                      ? <Pause className="w-5 h-5" />
                      : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <div className="flex-1">
                    <WaveformBars active={voice.isPlaying} />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{formatTime(voice.playbackTime)}</span>
                      <span>{formatTime(voice.duration)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={voice.deleteRecording}
                    className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-colors flex-shrink-0"
                    title="Delete voice note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-center text-gray-400">
                  🎙 Voice note attached · {formatTime(voice.duration)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Your current location will be shared with authorities to help respond quickly.</p>
            {location && (
              <p className="mt-1 text-blue-700">📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!selectedType || !description || description.length < 10 || loading}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white text-lg shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <><Loader className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="w-5 h-5 mr-2" /> Submit Report</>
          )}
        </Button>
      </form>

      <BottomNav />

      {/* ── Insurance Agent Popup ── */}
      {showInsurancePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleSkipInsurance}
          />

          {/* Modal card */}
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full">
            {/* Close icon */}
            <button
              onClick={handleSkipInsurance}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>

            {/* Text */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Contact Insurance Agent?
            </h3>
            <p className="text-gray-600 text-center text-sm mb-6 leading-relaxed">
              Your accident report has been submitted to authorities. Would you like to connect
              with an insurance agent to start your claim?
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleGoToInsurance}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-semibold"
              >
                <ShieldCheck className="w-5 h-5 mr-2" />
                Yes, Contact Agent
              </Button>
              <Button
                onClick={handleSkipInsurance}
                className="w-full h-12 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-2xl font-semibold"
              >
                No, Go Home
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
