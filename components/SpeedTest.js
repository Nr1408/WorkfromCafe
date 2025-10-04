import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import colors from '../constants/colors';
import theme from '../constants/theme';

/*
  Lightweight Wi-Fi speed test component using M-Lab ndt7 public service.
  It performs a single download test: open wss to /ndt/v7/download and measure bytes received for a fixed duration.
  Note: This is a simplified implementation for React Native (Expo). It relies on the global WebSocket.
  If captive portals or restrictive networks block websockets, it will fail gracefully.
*/

// Unified duration: user requested 10 second test for all runs
const FULL_DOWNLOAD_DURATION_MS = 12000; // increased duration
let DOWNLOAD_DURATION_MS = FULL_DOWNLOAD_DURATION_MS;
const LOCATE_TIMEOUT_MS = 3000; // Wait at most 3s for locate
const STALL_THRESHOLD_MS = 2000; // If no bytes in this time, treat as stall and switch server
const GLOBAL_TIMEOUT_MS = 14000; // Slight buffer beyond test duration
//
// We'll dynamically discover a server using M-Lab locate. Fallback to a hard-coded one if locate fails.
const FALLBACK_WS = 'wss://ndt-iupui-mlab3-ams05.measurementlab.net/ndt/v7/download';
const LOCATE_URL = 'https://locate.measurementlab.net/v2/nearest/ndt/ndt7';
// Additional geographically distributed static fallback servers (download endpoints)
const STATIC_FALLBACK_WS = [
  'wss://ndt-iupui-mlab1-nyc05.measurementlab.net/ndt/v7/download',
  'wss://ndt-iupui-mlab1-lon05.measurementlab.net/ndt/v7/download',
  'wss://ndt-iupui-mlab1-fra05.measurementlab.net/ndt/v7/download',
  'wss://ndt-iupui-mlab1-syd05.measurementlab.net/ndt/v7/download'
];

const humanMbps = (bitsPerSecond) => (bitsPerSecond / 1e6).toFixed(2);

// Cache for last good server across component instances
let LAST_SERVER = null;
let LAST_SERVER_TS = 0;
const SERVER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const SpeedTest = ({ onComplete, onCancel, autoStart = false }) => {
  const [phase, setPhase] = useState('idle'); // idle | locating | downloading | done | error
  const [downloadMbps, setDownloadMbps] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0); // still tracked (could be used later)
  const [speedWidth, setSpeedWidth] = useState(0); // 0-100 representing current vs adaptive scale
  //
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null); // diagnostics
  const [attempt, setAttempt] = useState(0);
  // Retest uses identical flow as first test (no differentiation)
  const downloadBytes = useRef(0);
  const downloadStart = useRef(0);
  const wsRef = useRef(null);
  const cancelRef = useRef(false);
  const fallbackAttemptedRef = useRef(false); // prevent multiple fallback attempts
  // serverList: array of { download:string }
  const serverListRef = useRef([]);
  const serverIdxRef = useRef(0);
  const activeServerRef = useRef(null); // {download}

  const globalTimeoutRef = useRef(null);
  const stallTimerRef = useRef(null);
  const autoCloseRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const peakBpsRef = useRef(0);
  const scaleRef = useRef(5 * 1e6); // start with 5 Mbps scale baseline
  const LOW_BYTE_THRESHOLD = 64 * 1024; // 64KB minimal meaningful download

  const triggerHttpFallback = (reasonTag) => {
    if (fallbackAttemptedRef.current) return;
    fallbackAttemptedRef.current = true;
    setInfo(prev => (prev ? prev + '\n' : '') + (reasonTag ? `${reasonTag} -> HTTP fallback` : 'HTTP fallback invoked'));
    cleanup();
    httpFallbackTest();
  };

  const clearTimers = () => {
    if (globalTimeoutRef.current) { clearTimeout(globalTimeoutRef.current); globalTimeoutRef.current = null; }
    if (stallTimerRef.current) { clearTimeout(stallTimerRef.current); stallTimerRef.current = null; }
  };

  const cleanup = () => {
    clearTimers();
    if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch(_) {}
      wsRef.current = null;
    }
  };

  const resolveServerUrls = (rawUrl) => {
    // rawUrl may already include /ndt/v7/download OR just host path.
    if (!rawUrl.startsWith('wss://')) return null;
    let download = rawUrl;
    if (!/\/ndt\/v7\/download$/.test(download)) {
      download = download.replace(/\/$/, '') + '/ndt/v7/download';
    }
  return { download };
  };

  const pickNextServer = () => {
    if (serverIdxRef.current < serverListRef.current.length) {
      const s = serverListRef.current[serverIdxRef.current];
      activeServerRef.current = s;
      serverIdxRef.current += 1;
      return { server: s, index: serverIdxRef.current, total: serverListRef.current.length };
    }
    // fallback last
    if (!activeServerRef.current) {
      const fallback = resolveServerUrls(FALLBACK_WS);
      activeServerRef.current = fallback;
      return { server: fallback, index: serverListRef.current.length + 1, total: serverListRef.current.length + 1 };
    }
    return { server: activeServerRef.current, index: serverIdxRef.current, total: serverListRef.current.length + 1 };
  };

  const scheduleStallCheck = () => {
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = setTimeout(() => {
      if (phase === 'downloading' && downloadBytes.current === 0) {
        setInfo(prev => (prev ? prev + '\n' : '') + `Stall: no data after ${STALL_THRESHOLD_MS}ms -> switching server`);
        cleanup();
        activeServerRef.current = null; // force next server
        startDownload();
      }
    }, STALL_THRESHOLD_MS);
  };

  const armGlobalTimeout = () => {
    if (globalTimeoutRef.current) clearTimeout(globalTimeoutRef.current);
    globalTimeoutRef.current = setTimeout(() => {
      if (!cancelRef.current && phase !== 'done') {
        if (!fallbackAttemptedRef.current) {
          setInfo(prev => (prev ? prev + '\n' : '') + 'Global timeout -> auto HTTP fallback');
          fallbackAttemptedRef.current = true;
          cleanup();
          httpFallbackTest();
        } else {
          setError('Global timeout exceeded');
          setPhase('error');
          cleanup();
        }
      }
    }, GLOBAL_TIMEOUT_MS);
  };

  // Removed early-stop stabilization logic to ensure consistent full-duration tests
  const finishedRef = useRef(false);

  const startDownload = useCallback(() => {
    setPhase('downloading');
    downloadBytes.current = 0;
    downloadStart.current = Date.now();
    setElapsedMs(0);
  setSpeedWidth(0);
  peakBpsRef.current = 0;
  scaleRef.current = 5 * 1e6; // reset baseline scale each test
    if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); }
    progressIntervalRef.current = setInterval(() => {
      if (downloadStart.current) {
        const e = Date.now() - downloadStart.current;
        setElapsedMs(e);
      }
    }, 200);
    // If we have a cached server and within TTL and no server list fetched yet, use it immediately.
    if (!activeServerRef.current && serverListRef.current.length === 0 && LAST_SERVER && (Date.now() - LAST_SERVER_TS) < SERVER_CACHE_TTL_MS) {
      activeServerRef.current = LAST_SERVER;
  setInfo(prev => (prev ? prev + '\n' : '') + 'Using cached server');
    }
    const picked = activeServerRef.current ? { server: activeServerRef.current, index: serverIdxRef.current, total: serverListRef.current.length + 1 } : pickNextServer();
    const server = picked?.server;
    if (!server) {
      setError('No servers available');
      setPhase('error');
      return;
    }
    setInfo(prev => (prev ? prev + '\n' : '') + `Using server (${picked.index}/${picked.total}): ${server.download}`);
    let ws;
    try { ws = new WebSocket(server.download, 'ndt7'); } catch(e) {
      // immediate retry with next server
      activeServerRef.current = null;
      startDownload();
      return;
    }
    wsRef.current = ws;
    let receivedAny = false;
    scheduleStallCheck();
    ws.onmessage = (evt) => {
      if (cancelRef.current) return;
      if (typeof evt.data === 'string') {
        // control messages ignored
        return;
      }
      // Blob or ArrayBuffer
      let size = 0;
      if (evt.data instanceof ArrayBuffer) size = evt.data.byteLength;
      else if (evt.data && typeof evt.data.size === 'number') size = evt.data.size;
      downloadBytes.current += size;
      receivedAny = true;
      scheduleStallCheck();
      const elapsed = Date.now() - downloadStart.current;
      if (elapsed > 0) {
        const bitsPerSecond = (downloadBytes.current * 8) / (elapsed / 1000);
        setDownloadMbps(humanMbps(bitsPerSecond));
        if (bitsPerSecond > peakBpsRef.current) peakBpsRef.current = bitsPerSecond;
        // Adaptive scale: enlarge if we exceed 85% of current scale.
        if (bitsPerSecond > scaleRef.current * 0.85) {
          // Grow scale towards next power-ish step.
          const target = Math.max(bitsPerSecond * 1.3, scaleRef.current * 1.5);
          scaleRef.current = Math.min(target, peakBpsRef.current * 2);
        }
        const pct = Math.min(100, (bitsPerSecond / scaleRef.current) * 100);
        setSpeedWidth(pct);
      }
    };
    ws.onerror = () => {
      const failMsg = 'WebSocket error on download';
      setInfo(prev => (prev ? prev + '\n' : '') + failMsg);
      cleanup();
      if (!cancelRef.current) {
        if (serverIdxRef.current < serverListRef.current.length) {
          activeServerRef.current = null; // move to next server
          startDownload();
        } else if (!receivedAny) {
          triggerHttpFallback('All WS servers failed (no data)');
        } else if (downloadBytes.current < LOW_BYTE_THRESHOLD) {
          triggerHttpFallback('Insufficient data (<64KB)');
        } else {
          setError('Download test failed');
          setPhase('error');
        }
      }
    };
    ws.onclose = (evt) => {
      setInfo(prev => (prev ? prev + '\n' : '') + `Socket closed code=${evt?.code} reason=${evt?.reason || ''}`);
      const elapsed = Date.now() - downloadStart.current;
      const reasonText = (evt?.reason || '').toLowerCase();
      const dnsFailure = reasonText.includes('unable to resolve host') || reasonText.includes('no address associated');
      if (autoCloseRef.current) { clearTimeout(autoCloseRef.current); autoCloseRef.current = null; }
      if (!finishedRef.current && !cancelRef.current && receivedAny && phase === 'downloading') {
        // Likely closed due to cleanup after timer
        finishedRef.current = true;
        const bitsPerSecond = (downloadBytes.current * 8) / (elapsed / 1000);
        setDownloadMbps(humanMbps(bitsPerSecond));
        if (activeServerRef.current && downloadBytes.current >= LOW_BYTE_THRESHOLD) {
          LAST_SERVER = activeServerRef.current; LAST_SERVER_TS = Date.now();
        }
        setPhase('done');
        onComplete && onComplete({ downloadMbps: humanMbps(bitsPerSecond) });
        return;        
      }
      if (!cancelRef.current && !receivedAny && elapsed < 1500 && phase === 'downloading') {
        cleanup();
        if (dnsFailure) {
          // Try adding static fallbacks if not already included
          if (serverListRef.current.length === 0) {
            serverListRef.current = STATIC_FALLBACK_WS.map(resolveServerUrls).filter(Boolean);
            serverIdxRef.current = 0;
            activeServerRef.current = null;
            setInfo(prev => (prev ? prev + '\n' : '') + 'DNS resolution failure -> injecting static fallback server list');
          }
        }
        if (serverIdxRef.current < serverListRef.current.length) {
          activeServerRef.current = null;
          startDownload();
        } else if (!fallbackAttemptedRef.current) {
          triggerHttpFallback('Early close no data');
        }
      }
    };
    ws.onopen = () => {
      armGlobalTimeout();
      // Auto close after duration
      autoCloseRef.current = setTimeout(() => {
        if (cancelRef.current) return;
        const elapsed = Date.now() - downloadStart.current;
        const bitsPerSecond = (downloadBytes.current * 8) / (elapsed / 1000);
        setDownloadMbps(humanMbps(bitsPerSecond));
        // If we barely received anything, prefer HTTP fallback path for a more robust measure
        if (downloadBytes.current < LOW_BYTE_THRESHOLD && !fallbackAttemptedRef.current) {
          triggerHttpFallback('Low data after duration');
          return;
        }
        // Store server if meaningful data gathered
        if (activeServerRef.current && downloadBytes.current >= LOW_BYTE_THRESHOLD) {
          LAST_SERVER = activeServerRef.current;
          LAST_SERVER_TS = Date.now();
        }
        finishedRef.current = true;
        cleanup();
        setPhase('done');
        onComplete && onComplete({ downloadMbps });
      }, DOWNLOAD_DURATION_MS);
    };
  }, []);


  const httpFallbackTest = async () => {
    // HTTP fallback: download-only multi-source loop.
    try {
      fallbackAttemptedRef.current = true;
      cancelRef.current = false;
      setError(null);
      setInfo(prev => (prev ? prev + '\n' : '') + 'HTTP fallback engaged');
      // DOWNLOAD PHASE
      setPhase('downloading');
      const downloadStartTime = Date.now();
      let dBytes = 0;
      const downloadSources = [
        'https://speed.hetzner.de/1MB.bin',
        'https://ipv4.download.thinkbroadband.com/1MB.zip',
        'https://proof.ovh.net/files/1Mb.dat'
      ];
      let sourceIdx = 0;
      while (!cancelRef.current && (Date.now() - downloadStartTime) < DOWNLOAD_DURATION_MS) {
        const url = downloadSources[sourceIdx % downloadSources.length];
        sourceIdx++;
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) throw new Error('bad status');
          const buf = await res.arrayBuffer();
          dBytes += buf.byteLength;
        } catch (err) {
          setInfo(prev => (prev ? prev + '\n' : '') + `HTTP dl source fail: ${url}`);
        }
        const elapsed = Date.now() - downloadStartTime;
        if (elapsed > 0 && dBytes > 0) {
          const bitsPerSecond = (dBytes * 8) / (elapsed / 1000);
          setDownloadMbps(humanMbps(bitsPerSecond));
          if (bitsPerSecond > peakBpsRef.current) peakBpsRef.current = bitsPerSecond;
          if (bitsPerSecond > scaleRef.current * 0.85) {
            const target = Math.max(bitsPerSecond * 1.3, scaleRef.current * 1.5);
            scaleRef.current = Math.min(target, peakBpsRef.current * 2);
          }
          const pct = Math.min(100, (bitsPerSecond / scaleRef.current) * 100);
          setSpeedWidth(pct);
        }
      }
      if (cancelRef.current) return; // aborted
      // Finalize download metric
      const dElapsed = Date.now() - downloadStartTime;
      if (dElapsed > 0 && dBytes > 0) {
        setDownloadMbps(humanMbps((dBytes * 8) / (dElapsed / 1000)));
      }
      if (dBytes === 0) {
        // connectivity probe to small endpoint to distinguish total outage
        try {
          const probe = await fetch('https://httpbin.org/get', { cache: 'no-store' });
          if (!probe.ok) throw new Error('probe failed');
          setInfo(prev => (prev ? prev + '\n' : '') + 'Connectivity probe succeeded but large test files blocked');
        } catch (e) {
          setInfo(prev => (prev ? prev + '\n' : '') + 'Connectivity probe failed -> network likely offline or blocked');
          setPhase('error');
          setError('All fallback sources unreachable');
          return;
        }
      }
      setPhase('done');
      onComplete && onComplete({
        downloadMbps: (dBytes > 0 ? humanMbps((dBytes * 8) / (dElapsed / 1000)) : '0')
      });
    } catch (e) {
      if (!cancelRef.current) {
        setError('Fallback failed');
        setPhase('error');
      }
    }
  };

  const locateServer = async () => {
    setPhase('locating');
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; }, LOCATE_TIMEOUT_MS);
    try {
      const res = await fetch(LOCATE_URL, { headers: { 'Accept': 'application/json' } });
      const json = await res.json();
      if (json && json.results && json.results.length > 0) {
        serverListRef.current = json.results
          .map(r => r?.urls?.wss)
          .filter(Boolean)
          .map(u => u.replace(/\/$/, ''))
          .map(resolveServerUrls)
          .filter(Boolean);
        serverIdxRef.current = 0;
        activeServerRef.current = null;
        setInfo(prev => (prev ? prev + '\n' : '') + `Locate: found ${serverListRef.current.length} server(s)`);
      } else {
        // inject static fallbacks if locate empty
        serverListRef.current = STATIC_FALLBACK_WS.map(resolveServerUrls).filter(Boolean);
        if (serverListRef.current.length > 0) {
          setInfo(prev => (prev ? prev + '\n' : '') + 'Locate returned 0 -> using static fallback server list');
        }
      }
    } catch(e) {
      // ignore, fallback
      if (serverListRef.current.length === 0) {
        serverListRef.current = STATIC_FALLBACK_WS.map(resolveServerUrls).filter(Boolean);
        if (serverListRef.current.length > 0) {
          setInfo(prev => (prev ? prev + '\n' : '') + 'Locate error -> using static fallback server list');
        }
      }
    } finally {
      clearTimeout(timer);
      if (timedOut) {
        setInfo(prev => (prev ? prev + '\n' : '') + 'Locate timed out; using fallback');
      }
    }
  };

  const start = useCallback(() => {
    // Full cleanup before starting to avoid lingering sockets/timeouts
    cleanup();
    cancelRef.current = false;
    setError(null);
    setInfo(null);
    setDownloadMbps(null);
    setElapsedMs(0);
    finishedRef.current = false;
    if (autoCloseRef.current) { clearTimeout(autoCloseRef.current); autoCloseRef.current = null; }
    if (stallTimerRef.current) { clearTimeout(stallTimerRef.current); stallTimerRef.current = null; }
    fallbackAttemptedRef.current = false;
  //
  setAttempt(a => a + 1);
  DOWNLOAD_DURATION_MS = FULL_DOWNLOAD_DURATION_MS;
    serverListRef.current = [];
    serverIdxRef.current = 0;
    activeServerRef.current = null;
    (async () => {
      // Always perform fresh locate to mimic first test experience
      await locateServer();
      startDownload();
    })();
  }, [startDownload]);

  const cancel = () => {
    cancelRef.current = true;
    cleanup();
    setPhase('idle');
    onCancel && onCancel();
  };

  useEffect(() => {
    if (autoStart) start();
    return cleanup;
  }, [autoStart, start]);

  return (
    <View style={styles.container}>
      {(phase === 'idle' || phase === 'error') && (
        <View style={styles.actionsStack}>
          <TouchableOpacity style={styles.primaryButton} onPress={start}>
            <Text style={styles.primaryButtonText}>{phase === 'error' ? 'Retry Test' : 'Test Wi-Fi Speed'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {phase === 'locating' && (
        <View style={styles.progressBox}>
          <ActivityIndicator color={colors.accentGreen} />
          <Text style={styles.statusText}>Finding nearest test server...</Text>
        </View>
      )}
      {phase === 'downloading' && (
        <View style={styles.progressBox}>
          <View style={styles.spinnerWrapper}>
            <ActivityIndicator color={colors.accentGreen} size="large" />
          </View>
          <Text style={styles.metricText}>
            Network Speed: {downloadMbps ? `${downloadMbps} Mbps` : '...'}
          </Text>
          <View style={styles.progressOuter}>
            <View style={[styles.progressInner,{width: `${speedWidth}%`}]}/>
          </View>
          <TouchableOpacity onPress={cancel} style={styles.cancelButton} activeOpacity={0.85}>
            <Text style={styles.cancelButtonText}>Cancel Test</Text>
          </TouchableOpacity>
        </View>
      )}
      {phase === 'done' && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Speed Test Results</Text>
          <Text style={styles.resultMetric}>Network Speed: {downloadMbps} Mbps</Text>
          {/* */}
          <TouchableOpacity style={[styles.primaryButton,{marginTop:theme.spacing.md}]} onPress={start}>
            <Text style={styles.primaryButtonText}>Re-test</Text>
          </TouchableOpacity>
        </View>
      )}
      {phase === 'error' && error && (
        <View style={styles.resultBox}>
          <Text style={styles.errorText}>{error}</Text>
          {info && <Text style={styles.infoText}>{info}</Text>}
          <TouchableOpacity style={styles.secondaryButton} onPress={httpFallbackTest}>
            <Text style={styles.secondaryButtonText}>Try HTTP Fallback</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton,{marginTop:theme.spacing.sm}]} onPress={start}>
            <Text style={styles.secondaryButtonText}>Retry (Next Server)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton,{marginTop:theme.spacing.sm}]} onPress={() => { onComplete && onComplete({ downloadMbps: '0' }); setPhase('idle'); }}>
            <Text style={styles.secondaryButtonText}>Set As Unknown</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: theme.spacing.md },
  primaryButton: {
    backgroundColor: colors.accentGreen,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.primaryBackground, fontWeight: '600', fontSize: theme.fontSizes.medium },
  secondaryButton: {
    backgroundColor: colors.secondaryBackground,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  secondaryButtonText: { color: colors.primaryText, fontWeight: '500' },
  progressBox: {
    backgroundColor: colors.secondaryBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
  },
  statusText: { color: colors.primaryText, marginTop: theme.spacing.sm },
  metricText: { color: colors.accentGreen, marginTop: theme.spacing.xs, fontWeight: '600' },
  progressOuter: { marginTop: theme.spacing.sm, height: 6, backgroundColor: colors.primaryBackground, borderRadius: 3, overflow: 'hidden' },
  progressInner: { height: '100%', backgroundColor: colors.accentGreen },
  spinnerWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryBackground, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: colors.secondaryBackground },
  cancelButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.error || '#ff5555', paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, borderRadius: theme.borderRadius.medium, marginTop: theme.spacing.md },
  cancelButtonText: { color: colors.primaryBackground, fontWeight: '600', fontSize: theme.fontSizes.medium },
  resultBox: {
    backgroundColor: colors.secondaryBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
  },
  resultTitle: { color: colors.primaryText, fontSize: theme.fontSizes.large, fontWeight: '600', marginBottom: theme.spacing.sm },
  resultMetric: { color: colors.primaryText, marginBottom: theme.spacing.xs },
  // actionsRow removed after simplifying buttons
  errorText: { color: colors.error || '#ff5555', marginBottom: theme.spacing.sm },
  infoText: { color: colors.secondaryText, marginTop: theme.spacing.xs, fontSize: theme.fontSizes.small },
  actionsStack: { },
  resultMeta: { color: colors.secondaryText, marginTop: theme.spacing.xs, fontSize: theme.fontSizes.small },
});

export default SpeedTest;
