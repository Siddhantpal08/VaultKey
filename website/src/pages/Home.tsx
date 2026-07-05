import React, { useState } from 'react';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import Security from '../components/home/Security';
import HowItWorks from '../components/home/HowItWorks';
import Contact from '../components/home/Contact';
import DownloadModals from '../components/home/DownloadModals';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isDesktop) {
      setShowModal(true);
    } else {
      triggerDownload();
    }
  };

  const triggerDownload = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4500);

    const link = document.createElement('a');
    link.href = '/VaultKey.apk';
    link.download = 'VaultKey.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col flex-1 noise-overlay">
      <Hero onDownloadClick={handleDownloadClick} />
      <Features />
      <Security />
      <HowItWorks />
      <Contact />
      <DownloadModals 
        showModal={showModal} 
        setShowModal={setShowModal} 
        showToast={showToast} 
        triggerDownload={triggerDownload} 
      />
    </div>
  );
}
