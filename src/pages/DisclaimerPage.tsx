import { motion } from 'motion/react';

export default function DisclaimerPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-3xl font-serif text-[#1A1A1A] mb-8 border-b border-[#E5E5E5] pb-4">Legal Disclaimer</h1>
      <div className="prose prose-p:text-[#666666] font-sans text-sm leading-relaxed">
        <p>
          The Library of Alexander is a personal curation and review platform. The opinions expressed herein are solely those of the curator and do not represent any publisher, author, or external entity.
        </p>
        <p>
          All cover art and related imagery are property of their respective copyright holders and are used here under fair use for review and commentary purposes.
        </p>
      </div>
    </motion.div>
  );
}
