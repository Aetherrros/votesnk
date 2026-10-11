import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Easing, Image, Linking, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';

// ---------------------------------------------------------------- réglages
const DEFAULT_PSEUDO = 'Aetherros';
const SITES = [
  { key: 'serveur-prive', label: 'Serveur-Prive.net', url: 'https://serveur-prive.net/minecraft/snkmc/vote', cooldown: 90 },
  { key: 'top-serveurs', label: 'Top-Serveurs.net', url: 'https://top-serveurs.net/minecraft/vote/snk-mc', cooldown: 120 },
];
const STORAGE_KEY = 'snkmc_state_v1';
const FLIP_MS = 320;

const TW = 46, TH = 64, HALF = 32;
const THEMES = {
  normal: { top: '#1a1a1a', bottom: '#0a0a0a', border: '#3a3a3a', line: '#000000' },
  red: { top: '#d32f2f', bottom: '#a82222', border: '#ff5252', line: '#4d0c0c' },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function scheduleVote(site, ts) {
  try {
    await Notifications.cancelScheduledNotificationAsync(site.key);
  } catch (e) {}
  const secs = Math.ceil((ts - Date.now()) / 1000);
  if (secs < 1) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: site.key,
      content: { title: 'Rappel de vote SNKMC', body: `Vote disponible sur ${site.label} !`, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secs, repeats: false },
    });
  } catch (e) {}
}

// ---------------------------------------------------------------- tuile à volet
function Half({ digit, theme, bottom }) {
  const t = THEMES[theme];
  return (
    <View
      style={{
        width: TW, height: HALF, overflow: 'hidden',
        backgroundColor: bottom ? t.bottom : t.top,
        borderColor: t.border, borderLeftWidth: 2, borderRightWidth: 2,
        ...(bottom
          ? { borderBottomWidth: 2, borderTopWidth: 1, borderTopColor: t.line, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }
          : { borderTopWidth: 2, borderBottomWidth: 1, borderBottomColor: t.line, borderTopLeftRadius: 10, borderTopRightRadius: 10 }),
      }}
    >
      <View style={{ position: 'absolute', top: bottom ? -33 : -2, left: 0, right: 0, height: TH, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={styles.digit}>{digit}</Text>
      </View>
    </View>
  );
}

function FlipTile({ digit, theme }) {
  const [shown, setShown] = useState(digit);
  const [prev, setPrev] = useState(digit);
  const [next, setNext] = useState(digit);
  const [anim, setAnim] = useState(false);
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (anim || digit === shown) return;
    setPrev(shown);
    setNext(digit);
    setAnim(true);
    p.setValue(0);
    Animated.timing(p, { toValue: 1, duration: FLIP_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      .start(() => { setShown(digit); setAnim(false); });
  }, [digit, shown, anim]);

  const topRot = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '-90deg', '-90deg'] });
  const botRot = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['90deg', '90deg', '0deg'] });
  const topOpacity = p.interpolate({ inputRange: [0, 0.499, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const botOpacity = p.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [0, 0, 1, 1] });

  return (
    <View style={{ width: TW, height: TH }}>
      <View style={{ position: 'absolute', top: 0 }}>
        <Half digit={anim ? next : shown} theme={theme} />
      </View>
      <View style={{ position: 'absolute', top: HALF }}>
        <Half bottom digit={anim ? prev : shown} theme={theme} />
      </View>
      {anim && (
        <>
          <Animated.View
            style={{ position: 'absolute', top: 0, opacity: topOpacity, transformOrigin: ['50%', '100%', 0],
              transform: [{ perspective: 500 }, { rotateX: topRot }] }}
          >
            <Half digit={prev} theme={theme} />
          </Animated.View>
          <Animated.View
            style={{ position: 'absolute', top: HALF, opacity: botOpacity, transformOrigin: ['50%', '0%', 0],
              transform: [{ perspective: 500 }, { rotateX: botRot }] }}
          >
            <Half bottom digit={next} theme={theme} />
          </Animated.View>
        </>
      )}
    </View>
  );
}

function Pair({ a, b, theme }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <FlipTile digit={a} theme={theme} />
      <FlipTile digit={b} theme={theme} />
    </View>
  );
}

// ---------------------------------------------------------------- carte d'un site
function SiteCard({ site, ts, now, onVote, onReset }) {
  const left = Math.max(0, Math.floor(((ts || 0) - now) / 1000));
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const str = `${String(Math.min(h, 99)).padStart(2, '0')}${String(m).padStart(2, '0')}${String(s).padStart(2, '0')}`;
  const red = left === 0;
  const theme = red ? 'red' : 'normal';

  return (
    <View style={styles.card}>
      <Text style={styles.siteName}>{site.label}</Text>
      <View style={styles.row}>
        <Pair a={str[0]} b={str[1]} theme={theme} />
        <Text style={styles.colon}>:</Text>
        <Pair a={str[2]} b={str[3]} theme={theme} />
        <Text style={styles.colon}>:</Text>
        <Pair a={str[4]} b={str[5]} theme={theme} />
      </View>
      <View style={styles.row2}>
        <Text style={styles.lbl}>Heures</Text>
        <View style={{ width: 16 }} />
        <Text style={styles.lbl}>Minutes</Text>
        <View style={{ width: 16 }} />
        <Text style={styles.lbl}>Secondes</Text>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, red && styles.btnRed]} onPress={onVote}>
          <Text style={styles.btnText}>Voter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn2} onPress={onReset}>
          <Text style={styles.btn2Text}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- application
export default function App() {
  const [pseudo, setPseudo] = useState(DEFAULT_PSEUDO);
  const [next, setNext] = useState({});
  const [now, setNow] = useState(Date.now());

  const persist = async (p, n) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ pseudo: p, next: n }));
    } catch (e) {}
  };

  useEffect(() => {
    (async () => {
      try { await Notifications.requestPermissionsAsync(); } catch (e) {}
      let st = {};
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) st = JSON.parse(raw);
      } catch (e) {}
      const p = st.pseudo || DEFAULT_PSEUDO;
      const n = st.next || {};
      setPseudo(p);
      setNext(n);
      for (const site of SITES) {
        if (n[site.key] && n[site.key] > Date.now()) scheduleVote(site, n[site.key]);
      }
    })();
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const startTimer = async (site) => {
    const ts = Date.now() + site.cooldown * 60000;
    const n = { ...next, [site.key]: ts };
    setNext(n);
    await persist(pseudo, n);
    await scheduleVote(site, ts);
  };

  const vote = async (site) => {
    await Clipboard.setStringAsync(pseudo);
    await startTimer(site);
    Linking.openURL(site.url);
  };

  const reset = (site) => {
    Alert.alert('Réinitialiser', `Relancer le compteur de ${site.label} au maximum ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Réinitialiser', style: 'destructive', onPress: () => startTimer(site) },
    ]);
  };

  const changePseudo = () => {
    Alert.prompt('Pseudo Minecraft', 'Entre ton pseudo :', (value) => {
      const v = (value || '').trim();
      if (v) {
        setPseudo(v);
        persist(v, next);
      }
    }, 'plain-text', pseudo);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>VOTE SNKMC</Text>

        <View style={styles.player}>
          <Image source={require('./assets/head.png')} style={styles.head} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.joueur}>Joueur</Text>
            <Text style={styles.pseudo}>{pseudo}</Text>
          </View>
          <TouchableOpacity onPress={changePseudo}>
            <Text style={styles.changer}>changer</Text>
          </TouchableOpacity>
        </View>

        {SITES.map((site) => (
          <SiteCard
            key={site.key}
            site={site}
            ts={next[site.key]}
            now={now}
            onVote={() => vote(site)}
            onReset={() => reset(site)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111111' },
  content: { paddingTop: 64, paddingBottom: 40, paddingHorizontal: 16, alignItems: 'center' },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 16 },
  player: {
    width: '100%', maxWidth: 420, backgroundColor: '#1e1e1e', borderRadius: 18,
    paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 14,
  },
  head: { width: 56, height: 54 },
  joueur: { color: '#9a9a9a', fontSize: 12 },
  pseudo: { color: '#fff', fontSize: 20, fontWeight: '700' },
  changer: { color: '#9a9a9a', fontSize: 13, textDecorationLine: 'underline' },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: '#1e1e1e', borderRadius: 22,
    paddingVertical: 18, alignItems: 'center', marginBottom: 14,
  },
  siteName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  row2: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  colon: { color: '#fff', fontSize: 26, fontWeight: '700', width: 16, textAlign: 'center' },
  lbl: { color: '#9a9a9a', fontSize: 12, width: 98, textAlign: 'center' },
  digit: { color: '#fff', fontSize: 32, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  btn: {
    width: 150, height: 42, borderRadius: 21, backgroundColor: '#2b2b2b', borderWidth: 2,
    borderColor: '#4a4a4a', alignItems: 'center', justifyContent: 'center',
  },
  btnRed: { backgroundColor: '#d32f2f', borderColor: '#ff5252' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btn2: {
    width: 130, height: 42, borderRadius: 21, backgroundColor: '#2b2b2b', borderWidth: 2,
    borderColor: '#4a4a4a', alignItems: 'center', justifyContent: 'center',
  },
  btn2Text: { color: '#9a9a9a', fontSize: 13, fontWeight: '700' },
});
