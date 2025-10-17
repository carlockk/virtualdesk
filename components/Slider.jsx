'use client';
import { useEffect, useState } from 'react';

const imgs = [
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop'
];

export default function Slider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p)=> (p+1)%imgs.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      {imgs.map((src, idx)=>(
        <img key={idx} src={src} alt="slide" className={`w-full h-64 object-cover transition-opacity duration-700 ${idx===i?'opacity-100':'opacity-0 absolute inset-0'}`} />
      ))}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {imgs.map((_, idx)=>(
          <span key={idx} className={`w-2 h-2 rounded-full ${idx===i? 'bg-white':'bg-white/60'}`}></span>
        ))}
      </div>
    </div>
  );
}
