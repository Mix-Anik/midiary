import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileMusic, FileAudio, X, CheckCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { sessionsApi } from '../api/client';
import { useSessionsStore } from '../store/sessions';
import { toDatetimeLocalValue } from '../utils/format';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

type UploadPhase = 'form' | 'uploading' | 'done';

interface FileDropZoneProps {
  accept: string;
  label: string;
  icon: React.ReactNode;
  file: File | null;
  onFile: (f: File) => void;
  error?: string;
}

function FileDropZone({ accept, label, icon, file, onFile, error }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  }, [onFile]);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          'relative w-full rounded-lg border-2 border-dashed transition-all duration-150 text-sm',
          'flex flex-col items-center justify-center gap-2 py-4 px-3',
          file
            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
            : dragging
            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
            : error
            ? 'border-[var(--danger)] bg-[var(--danger-soft)]'
            : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-elevated)]',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />

        {file ? (
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <CheckCircle size={16} />
            <span className="font-medium truncate max-w-[200px]">{file.name}</span>
          </div>
        ) : (
          <>
            <span className="text-[var(--text-muted)]">{icon}</span>
            <span className="text-[var(--text-secondary)]">{label}</span>
            <span className="text-xs text-[var(--text-muted)]">Drag & drop or click to browse</span>
          </>
        )}
      </button>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

export function UploadModal({ open, onClose }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordedAt, setRecordedAt] = useState(toDatetimeLocalValue(new Date().toISOString()));
  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<UploadPhase>('form');
  const [progress, setProgress] = useState(0);

  const fetchSessions = useSessionsStore((s) => s.fetchSessions);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e['title'] = 'Title is required';
    if (!recordedAt) e['recordedAt'] = 'Date is required';
    if (!midiFile) e['midi'] = 'MIDI file is required';
    if (!audioFile) e['audio'] = 'Audio file is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpload = async () => {
    if (!validate() || !midiFile || !audioFile) return;

    setPhase('uploading');
    // Fake progress for UX
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 12, 85));
    }, 180);

    try {
      await sessionsApi.create(
        { title: title.trim(), description: description.trim() || undefined, recordedAt: new Date(recordedAt).toISOString() },
        midiFile,
        audioFile,
      );
      clearInterval(interval);
      setProgress(100);
      setPhase('done');
      await fetchSessions();
      setTimeout(() => {
        handleClose();
      }, 900);
    } catch (err) {
      clearInterval(interval);
      setPhase('form');
      setErrors({ submit: (err as Error).message });
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setRecordedAt(toDatetimeLocalValue(new Date().toISOString()));
    setMidiFile(null);
    setAudioFile(null);
    setErrors({});
    setPhase('form');
    setProgress(0);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="New session" description="Upload a MIDI file and audio recording." width="md">
      {phase === 'done' ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle size={40} className="text-[var(--success)]" />
          <p className="text-sm text-[var(--text-secondary)]">Session uploaded successfully</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); handleUpload(); }}
          className="space-y-4"
        >
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Morning scales practice"
            error={errors['title']}
            autoFocus
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--text-secondary)] tracking-wide">Date</label>
            <input
              type="datetime-local"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className={[
                'w-full h-9 px-3 rounded-md text-sm bg-[var(--bg-elevated)] border border-[var(--border)]',
                'text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
                errors['recordedAt'] ? 'border-[var(--danger)]' : '',
              ].join(' ')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--text-secondary)] tracking-wide">Description <span className="text-[var(--text-muted)]">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What did you work on today?"
              className="w-full px-3 py-2 rounded-md text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FileDropZone
              accept=".mid,.midi"
              label="MIDI file (.mid)"
              icon={<FileMusic size={20} />}
              file={midiFile}
              onFile={setMidiFile}
              error={errors['midi']}
            />
            <FileDropZone
              accept=".wav,.mp3,.ogg,.flac,.m4a"
              label="Audio file"
              icon={<FileAudio size={20} />}
              file={audioFile}
              onFile={setAudioFile}
              error={errors['audio']}
            />
          </div>

          {errors['submit'] && (
            <p className="text-xs text-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2 rounded-md">
              {errors['submit']}
            </p>
          )}

          {/* Progress bar (uploading state) */}
          {phase === 'uploading' && (
            <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={phase === 'uploading'}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={phase === 'uploading'}
            >
              <UploadCloud size={15} />
              Upload session
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
