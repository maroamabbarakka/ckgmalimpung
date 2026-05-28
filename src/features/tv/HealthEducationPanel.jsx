import { useEffect, useState } from 'react';
import { HEALTH_MESSAGES } from './tvService';

export function HealthEducationPanel({ messages = HEALTH_MESSAGES }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((value) => (value + 1) % messages.length), 15000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <section className="rounded-3xl bg-slate-900 p-5 text-white xl:p-6">
      <p className="text-[11px] font-black uppercase tracking-wide text-teal-300 xl:text-xs">Edukasi Kesehatan</p>
      <p className="mt-3 text-xl font-black leading-snug xl:text-2xl">{messages[index]}</p>
    </section>
  );
}
