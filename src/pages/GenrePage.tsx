import { motion } from 'motion/react';
import { useParams, Link } from 'react-router-dom';

export default function GenrePage() {
  const { slug } = useParams();
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 py-20">
      <Link to="/" className="text-[10px] uppercase tracking-widest text-[#666666] hover:text-[#111111] font-bold mb-8 inline-block transition-colors">← Return</Link>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1A1A1A] mb-12">Genre: {slug}</h1>
      <div className="text-center py-12 bg-white border border-[#EEEEEE] shadow-sm text-[#999999] italic">
        Shelves are being sorted.
      </div>
    </motion.div>
  );
}
