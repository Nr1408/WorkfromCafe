import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Accept an object param for clarity moving forward
export function useLiveCheckIns({ placeId, cafeId, limit = 50 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadInitial = async () => {
      try {
        let query = supabase
          .from('check_ins')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (placeId) query = query.eq('place_id', placeId); else if (cafeId) query = query.eq('cafe_id', cafeId);
        const { data, error } = await query;
        if (error) throw error;
        if (isMounted) setRows(data || []);
      } catch (e) {
        if (isMounted) setError(e.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitial();

    const filter = placeId
      ? `place_id=eq.${placeId}`
      : cafeId
      ? `cafe_id=eq.${cafeId}`
      : undefined;

    const channel = supabase
      .channel('check_ins-stream')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'check_ins',
          filter,
        },
        payload => {
          // If we didn't filter (no placeId & no cafeId), accept all; else ensure match
          if (
            !filter ||
            (placeId && payload.new.place_id === placeId) ||
            (cafeId && payload.new.cafe_id === cafeId)
          ) {
            setRows(prev => [payload.new, ...prev].slice(0, limit));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [placeId, cafeId, limit]);

  return { rows, loading, error };
}
