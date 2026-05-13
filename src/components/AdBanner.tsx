import React, { useEffect } from 'react';
import { motion } from 'motion/react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdBanner() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense error:', e);
    }
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-[100px] my-6 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="w-full flex justify-center py-2">
        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-app-muted opacity-30">Publicidade</span>
      </div>
      <div className="w-full min-h-[90px] bg-app-card/30 border border-app-border/40 rounded-2xl flex items-center justify-center overflow-hidden">
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', minWidth: '300px' }}
             data-ad-client="ca-pub-9874727869323105"
             data-ad-slot="4349265541"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </motion.div>
  );
}
