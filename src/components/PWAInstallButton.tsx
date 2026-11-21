import React, {useState} from 'react';
import {Check, Copy, Download, Share, Smartphone, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({compact = false}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      // ignore
    }
  };

  if (isInstalled && compact) return null;

  if (compact) {
    if (isInstallable) {
      return (
        <button
          type="button"
          onClick={install}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F6B4E] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#0B543D] dark:bg-[#2D8A68] dark:hover:bg-[#247255] transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Install</span>
        </button>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={() => setShowMobileGuide(true)}
          aria-label="Install on mobile"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8CEB6] dark:border-[#2C3732] px-2.5 py-1.5 text-xs font-medium text-[#1A1916] dark:text-[#EDE8DC] hover:bg-[#EFE9DA] dark:hover:bg-[#1E2623] transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0 text-[#0F6B4E] dark:text-[#D4AF37]" />
          <span className="hidden sm:inline">Get App</span>
        </button>

        {showMobileGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF8] dark:bg-[#141917] border border-[#E6DEC8] dark:border-[#252E2A] p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-[#1A1916] dark:text-[#EDE8DC]">
                  Install Noor Mushaf on Mobile
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMobileGuide(false)}
                  aria-label="Close"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#5E5A4F] dark:text-[#A5A092] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-[#4E4A40] dark:text-[#C5BFB0]">
                <div className="rounded-xl bg-[#FAF7F0] dark:bg-[#0E1311] border border-[#E6DEC8] dark:border-[#252E2A] p-3">
                  <div className="font-semibold text-[#0F6B4E] dark:text-[#D4AF37] mb-1">Android (Chrome / Edge)</div>
                  <p>
                    1. Open this app directly in <strong>Chrome</strong> on Android (not inside a preview frame).
                    <br />
                    2. Tap the <strong>⋮ Menu</strong> (top-right) and choose <strong>Install app</strong> or{' '}
                    <strong>Add to Home screen</strong>.
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF7F0] dark:bg-[#0E1311] border border-[#E6DEC8] dark:border-[#252E2A] p-3">
                  <div className="font-semibold text-[#0F6B4E] dark:text-[#D4AF37] mb-1">iPhone / iPad (Safari)</div>
                  <p>
                    1. Tap the <strong>Share</strong> icon in Safari.
                    <br />
                    2. Tap <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex-1 min-h-[42px] rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] text-xs font-medium inline-flex items-center justify-center gap-1.5 text-[#1A1916] dark:text-[#EDE8DC]"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#0F6B4E]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Link Copied' : 'Copy App URL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileGuide(false)}
                  className="min-h-[42px] px-4 rounded-xl bg-[#0F6B4E] text-white text-xs font-medium hover:bg-[#0B543D]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Full card inside SettingsSyncSheet
  return (
    <div className="rounded-xl bg-[#FFFDF8] dark:bg-[#141917] border border-[#E6DEC8] dark:border-[#252E2A] p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#0F6B4E] dark:text-[#D4AF37]" />
          <span className="text-sm font-medium text-[#1A1916] dark:text-[#EDE8DC]">
            {isInstalled ? 'Installed on Device' : 'Install on Android / Mobile'}
          </span>
        </div>
      </div>

      {!isInstalled && isInstallable && (
        <button
          type="button"
          onClick={install}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F6B4E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0B543D] dark:bg-[#2D8A68] transition-colors min-h-[44px]"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Install App Now</span>
        </button>
      )}

      {!isInstalled && !isInstallable && (
        <div className="text-xs leading-relaxed text-[#5E5A4F] dark:text-[#A8A395] space-y-1.5">
          {isIOS ? (
            <p>
              In Safari, tap <Share className="w-3.5 h-3.5 inline mx-0.5" /> <strong>Share</strong> →{' '}
              <strong>Add to Home Screen</strong> for full-screen offline reading.
            </p>
          ) : (
            <p>
              Open the app link in <strong>Android Chrome</strong>, tap <strong>⋮ Menu</strong> →{' '}
              <strong>Install app</strong> (or <strong>Add to Home screen</strong>). It installs as a standalone
              offline Quran app.
            </p>
          )}
          <button
            type="button"
            onClick={handleCopyUrl}
            className="min-h-[36px] px-3 rounded-lg border border-[#DFD4B8] dark:border-[#2C3631] text-xs font-medium inline-flex items-center gap-1.5 text-[#1A1916] dark:text-[#EDE8DC] hover:bg-black/5 dark:hover:bg-white/5"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#0F6B4E]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'Link Copied' : 'Copy App URL for Phone'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
