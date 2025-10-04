import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, Platform, StatusBar, ActivityIndicator } from 'react-native';
import colors from '../../constants/colors';
import theme from '../../constants/theme';
import Card from '../../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { fetchPlaceDetails } from '../../services/places';
import { on } from '../../lib/events';

// Fetch latest N check-ins with profile display name
async function fetchRecentCommunity(limit = 50) {
  const { data, error } = await supabase
    .from('check_ins')
    .select('id, created_at, place_id, cafe_id, crowd_level, wifi_speed, power_outlets, noise_level, user_id')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const placeNameCache = {};
async function resolvePlaceNames(rows) {
  const unresolved = [...new Set(rows.map(r => r.place_id).filter(Boolean))].filter(pid => !placeNameCache[pid]);
  if (!unresolved.length) return placeNameCache;
  await Promise.all(unresolved.map(async pid => {
    try { const details = await fetchPlaceDetails(pid); if (details?.name) placeNameCache[pid] = details.name; } catch(_){}
  }));
  return placeNameCache;
}

const CommunityItem = ({ item }) => {
  const displayName = item.display_name || 'Someone';
  const cafeLabel = item.place_name || item.place_id || item.cafe_id || 'Cafe';
  return (
    <Card style={styles.checkinCard}>
      <View style={styles.row}>
        <Text style={styles.cafeName}>{cafeLabel}</Text>
        <Text style={styles.time}>{formatTimeAgo(item.created_at)}</Text>
      </View>
      <Text style={styles.user}>by {displayName}</Text>
      <View style={styles.metricsRow}>
        {item.wifi_speed != null && (
          <View style={styles.metric}><Ionicons name="wifi" size={18} color={colors.accentGreen} /><Text style={styles.metricText}>{item.wifi_speed} Mbps</Text></View>) }
        {item.crowd_level && (
          <View style={styles.metric}><Ionicons name="people" size={18} color={colors.accentGreen} /><Text style={styles.metricText}>{item.crowd_level}</Text></View>) }
        {item.noise_level && (
          <View style={styles.metric}><Ionicons name="musical-notes" size={18} color={colors.accentGreen} /><Text style={styles.metricText}>{item.noise_level}</Text></View>) }
      </View>
      {item.power_outlets && <Text style={styles.notes}>Power: {item.power_outlets}</Text>}
    </Card>
  );
};

const CommunityScreen = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchRecentCommunity();
        if (!active) return;
        const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
        let profileMap = {};
        if (userIds.length) {
          const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds);
          if (!pErr && profiles) {
            profileMap = profiles.reduce((acc, p) => { acc[p.id] = p.display_name; return acc; }, {});
          }
        }
        await resolvePlaceNames(data);
        const enriched = data.map(r => ({
          ...r,
          display_name: profileMap[r.user_id] || 'Someone',
          place_name: r.place_id ? placeNameCache[r.place_id] : undefined,
        }));
        setRows(enriched);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    // Realtime subscription for new inserts (no filter -> all)
    const channel = supabase
      .channel('community-checkins')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'check_ins' }, async payload => {
        const newRow = payload.new;
        let display_name = 'Someone';
        if (newRow.user_id) {
          const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', newRow.user_id).maybeSingle();
          if (prof?.display_name) display_name = prof.display_name;
        }
        if (newRow.place_id && !placeNameCache[newRow.place_id]) {
          try { const details = await fetchPlaceDetails(newRow.place_id); if (details?.name) placeNameCache[newRow.place_id] = details.name; } catch(_){}
        }
        setRows(prev => {
          const decorated = { ...newRow, display_name, place_name: placeNameCache[newRow.place_id] };
          if (prev.find(r => r.id === decorated.id)) return prev; // avoid duplicate if optimistic already added
          return [decorated, ...prev].slice(0, 50);
        });
      })
      .subscribe();

    const offLocal = on('check_in:new', async (row) => {
      // Enrich with display name & place name if available
      let display_name = 'Someone';
      if (row.user_id) {
        const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', row.user_id).maybeSingle();
        if (prof?.display_name) display_name = prof.display_name;
      }
      if (row.place_id && !placeNameCache[row.place_id]) {
        try { const details = await fetchPlaceDetails(row.place_id); if (details?.name) placeNameCache[row.place_id] = details.name; } catch(_){}
      }
      setRows(prev => {
        const decorated = { ...row, display_name, place_name: placeNameCache[row.place_id] };
        if (decorated.id && prev.find(r => r.id === decorated.id)) return prev; // skip if already present
        return [decorated, ...prev].slice(0,50);
      });
    });

    return () => {
      active = false;
      supabase.removeChannel(channel);
      offLocal && offLocal();
    };
  }, []);

  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight ? StatusBar.currentHeight + theme.spacing.lg : theme.spacing.lg)
    : theme.spacing.lg;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPadding }]}> 
      <Text style={styles.title}>Community Check-ins</Text>
      {loading && <ActivityIndicator color={colors.accentGreen} style={{ marginTop: theme.spacing.lg }} />}
      {error && <Text style={{ color: colors.error || '#ff5555', margin: theme.spacing.md }}>{error}</Text>}
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <CommunityItem item={item} />}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBackground, paddingHorizontal: theme.spacing.lg },
  title: { fontSize: theme.fontSizes.xlarge, fontWeight: '700', color: colors.primaryText, marginBottom: theme.spacing.md },
  list: { paddingBottom: theme.spacing.xl },
  checkinCard: { marginBottom: theme.spacing.md, padding: theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cafeName: { fontSize: theme.fontSizes.large, fontWeight: '700', color: colors.primaryText, maxWidth: '70%' },
  time: { color: colors.secondaryText },
  user: { color: colors.secondaryText, marginTop: theme.spacing.xs },
  metricsRow: { flexDirection: 'row', marginTop: theme.spacing.sm, justifyContent: 'flex-start', flexWrap: 'wrap' },
  metric: { flexDirection: 'row', alignItems: 'center', marginRight: theme.spacing.md, marginBottom: theme.spacing.xs },
  metricText: { marginLeft: theme.spacing.xs, color: colors.primaryText },
  notes: { marginTop: theme.spacing.sm, color: colors.secondaryText },
});

export default CommunityScreen;
