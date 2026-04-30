import { useEffect, useRef, useState } from 'react';
import {
  getMusicMuted,
  getMusicVolume,
  getSfxMuted,
  getSfxVolume,
  playSfx,
  primeAudio,
  setMusicMuted,
  setMusicVolume,
  setSfxMuted,
  setSfxVolume,
  subscribeAudio,
} from '../utils/audio';

interface AudioControlsProps {
  onAbout: () => void;
  /**
   * Optional. When set, a "Leave Room" ghost button appears at the bottom
   * of the dropdown. Used on the room / playing / gameOver screens to
   * replace the old dev-corner shortcut.
   */
  onLeaveRoom?: () => void;
}

export function AudioControls({ onAbout, onLeaveRoom }: AudioControlsProps) {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => subscribeAudio(() => force(n => n + 1)), []);

  // Click-outside + Esc to close.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const el = wrapperRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const sfxMuted = getSfxMuted();
  const sfxVolume = getSfxVolume();
  const musicMuted = getMusicMuted();
  const musicVolume = getMusicVolume();

  const toggle = () => {
    primeAudio();
    setOpen(o => !o);
  };

  const onSfxMuteToggle = () => {
    primeAudio();
    setSfxMuted(!sfxMuted);
    if (sfxMuted) playSfx('button');
  };

  const onMusicMuteToggle = () => {
    primeAudio();
    setMusicMuted(!musicMuted);
  };

  const onSfxVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    primeAudio();
    setSfxVolume(Number(e.target.value));
  };

  const onSfxVolumeCommit = () => {
    if (!sfxMuted) playSfx('button');
  };

  const onMusicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    primeAudio();
    setMusicVolume(Number(e.target.value));
  };

  // Live label for the speaker icon.
  const allMuted = sfxMuted && musicMuted;

  return (
    <div className="audio-controls" ref={wrapperRef}>
      <button
        type="button"
        className="audio-controls__toggle"
        onClick={toggle}
        aria-label="Audio settings"
        aria-expanded={open}
      >
        <span aria-hidden>{allMuted ? '\u{1F507}' : '\u{1F50A}'}</span>
      </button>

      {open && (
        <div className="audio-controls__panel" role="dialog" aria-label="Audio settings">
          <div className="audio-controls__row">
            <button
              type="button"
              className="audio-controls__mute"
              onClick={onSfxMuteToggle}
              aria-pressed={sfxMuted}
              aria-label={sfxMuted ? 'Unmute SFX' : 'Mute SFX'}
            >
              {sfxMuted ? '\u{1F507}' : '\u{1F50A}'}
            </button>
            <div className="audio-controls__row-meta">
              <div className="audio-controls__label">SFX</div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={sfxVolume}
                onChange={onSfxVolume}
                onMouseUp={onSfxVolumeCommit}
                onKeyUp={onSfxVolumeCommit}
                disabled={sfxMuted}
                aria-label="SFX volume"
              />
            </div>
          </div>

          <div className="audio-controls__row">
            <button
              type="button"
              className="audio-controls__mute"
              onClick={onMusicMuteToggle}
              aria-pressed={musicMuted}
              aria-label={musicMuted ? 'Unmute music' : 'Mute music'}
            >
              {musicMuted ? '\u{1F507}' : '\u{1F3B5}'}
            </button>
            <div className="audio-controls__row-meta">
              <div className="audio-controls__label">Music</div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={musicVolume}
                onChange={onMusicVolume}
                disabled={musicMuted}
                aria-label="Music volume"
              />
            </div>
          </div>

          <div className="audio-controls__divider" />

          <button
            type="button"
            className="btn btn--ghost audio-controls__about"
            onClick={() => {
              setOpen(false);
              onAbout();
            }}
          >
            About
          </button>

          {onLeaveRoom && (
            <button
              type="button"
              className="btn btn--ghost audio-controls__leave"
              onClick={() => {
                setOpen(false);
                onLeaveRoom();
              }}
            >
              Leave Room
            </button>
          )}
        </div>
      )}
    </div>
  );
}
