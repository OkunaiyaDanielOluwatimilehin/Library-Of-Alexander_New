import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ReactionCounts {
  like: number;
  love: number;
  fire: number;
  clap: number;
}

export default function useReactions(contentKey: string) {
  const [reactions, setReactions] = useState<ReactionCounts>({ like: 0, love: 0, fire: 0, clap: 0 });
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    if (!contentKey) return;
    const stored = localStorage.getItem(`reaction_${contentKey}`);
    if (stored) setUserReaction(stored);
    
    const storedCounts = localStorage.getItem(`counts_${contentKey}`);
    if (storedCounts) {
      try {
        setReactions(JSON.parse(storedCounts));
      } catch (e) {}
    }

    async function fetchReactions() {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('content_key', contentKey);
        
      if (!error && data) {
        const counts = { like: 0, love: 0, fire: 0, clap: 0 };
        data.forEach(r => {
          if (r.reaction_type in counts) {
            counts[r.reaction_type as keyof ReactionCounts]++;
          }
        });
        setReactions(counts);
        localStorage.setItem(`counts_${contentKey}`, JSON.stringify(counts));
      }
    }
    
    fetchReactions();
  }, [contentKey]);

  const react = async (type: string) => {
    if (!contentKey) return;
    const newCounts = { ...reactions };
    const prevReaction = userReaction;
    
    if (userReaction === type) {
      setUserReaction(null);
      localStorage.removeItem(`reaction_${contentKey}`);
      newCounts[type as keyof ReactionCounts] = Math.max(0, newCounts[type as keyof ReactionCounts] - 1);
    } else {
      if (userReaction) {
        newCounts[userReaction as keyof ReactionCounts] = Math.max(0, newCounts[userReaction as keyof ReactionCounts] - 1);
      }
      setUserReaction(type);
      localStorage.setItem(`reaction_${contentKey}`, type);
      newCounts[type as keyof ReactionCounts] = (newCounts[type as keyof ReactionCounts] || 0) + 1;
    }
    setReactions(newCounts);
    localStorage.setItem(`counts_${contentKey}`, JSON.stringify(newCounts));

    if (!supabase) return;
    const fingerprint = localStorage.getItem('anon_fingerprint') || Math.random().toString(36).substring(2);
    if (!localStorage.getItem('anon_fingerprint')) localStorage.setItem('anon_fingerprint', fingerprint);

    try {
      if (prevReaction) {
        await supabase.from('reactions').delete()
          .eq('content_key', contentKey)
          .eq('fingerprint', fingerprint);
      }
      if (userReaction !== type) {
        await supabase.from('reactions').insert({
          content_key: contentKey,
          reaction_type: type,
          fingerprint: fingerprint
        });
      }
    } catch (e) {
      console.error('Failed to sync reaction', e);
    }
  };

  return { reactions, userReaction, react };
}
