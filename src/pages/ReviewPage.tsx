import { motion } from 'motion/react';
import { useParams, Link } from 'react-router-dom';

export default function ReviewPage() {
  const { slug } = useParams();
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-20">
      <Link to="/" className="text-[10px] uppercase tracking-widest text-[#666666] hover:text-[#111111] font-bold mb-8 inline-block transition-colors">← Return</Link>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1A1A1A] mb-6">Review: {slug}</h1>
      <div className="bg-white p-8 border border-[#EEEEEE] shadow-sm">
        <p className="text-[#666666] text-sm">Scholarly review content will be loaded here from the CMS.</p>
      </div>
    </motion.div>
  );
}
