import { X, Smartphone, Download } from 'lucide-react';

interface ModalsProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  showToast: boolean;
  triggerDownload: () => void;
}

export default function DownloadModals({ showModal, setShowModal, showToast, triggerDownload }: ModalsProps) {
  return (
    <>
      {/* Download Alert Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[100] glass-strong border-primary/30 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-slide-in-up max-w-sm">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Download starting...</p>
            <p className="text-slate-400 text-xs mt-0.5">Your VaultKey APK download will start in a few seconds.</p>
          </div>
        </div>
      )}

      {/* Desktop QR Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md p-10 glass-strong border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] text-center rounded-[2rem]">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8 text-primary border border-primary/20 shadow-[0_0_30px_rgba(91,141,239,0.2)]">
              <Smartphone className="w-10 h-10" />
            </div>

            <h3 className="text-3xl font-bold text-white mb-3 font-outfit">Install on Mobile</h3>
            <p className="text-slate-400 text-sm mb-8 max-w-[280px] mx-auto leading-relaxed">
              Scan this QR code with your phone's camera to download and install VaultKey directly on your Android device.
            </p>

            <div className="bg-white p-4 rounded-2xl w-fit mx-auto mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://vault-key-app.vercel.app/VaultKey.apk&bgcolor=ffffff&color=000000&margin=0" 
                alt="VaultKey Download QR" 
                className="w-48 h-48 rounded-lg"
              />
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="text-xs text-slate-500 mb-3">Or, download it to your computer anyway:</p>
              <button 
                onClick={() => {
                  setShowModal(false);
                  triggerDownload();
                }}
                className="text-primary hover:text-primary/80 font-bold text-sm transition-colors hover:underline underline-offset-4"
              >
                Download APK directly
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
