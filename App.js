import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Easing, Image, Linking, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { createAudioPlayer } from 'expo-audio';

// ---------------------------------------------------------------- réglages
const DEFAULT_PSEUDO = 'Aetherros';
const DEFAULT_SITES = [
  { key: 'serveur-prive', label: 'Serveur-Prive.net', url: 'https://serveur-prive.net/minecraft/snkmc/vote', cooldown: 90 },
  { key: 'top-serveurs', label: 'Top-Serveurs.net', url: 'https://top-serveurs.net/minecraft/vote/snk-mc', cooldown: 120 },
];
const STORAGE_KEY = 'snkmc_state_v1';
const FLIP_MS = 320;
const SOUND_NAMES = ['Clair', 'Cristal', 'Étoile', 'Carillon', 'Doux', 'Bip', 'Double bip', 'Triple bip', 'Radar', 'Digital', 'Pixel', 'Arcade', 'Rétro', 'Laser', 'Cosmos', 'Alerte', 'Signal', 'Cloche', 'Goutte', 'Écho', 'Montée', 'Descente', 'Victoire', 'Mystère', 'Titan'];
const SOUND_FILES = [
  require('./assets/sounds/son_01.wav'),
  require('./assets/sounds/son_02.wav'),
  require('./assets/sounds/son_03.wav'),
  require('./assets/sounds/son_04.wav'),
  require('./assets/sounds/son_05.wav'),
  require('./assets/sounds/son_06.wav'),
  require('./assets/sounds/son_07.wav'),
  require('./assets/sounds/son_08.wav'),
  require('./assets/sounds/son_09.wav'),
  require('./assets/sounds/son_10.wav'),
  require('./assets/sounds/son_11.wav'),
  require('./assets/sounds/son_12.wav'),
  require('./assets/sounds/son_13.wav'),
  require('./assets/sounds/son_14.wav'),
  require('./assets/sounds/son_15.wav'),
  require('./assets/sounds/son_16.wav'),
  require('./assets/sounds/son_17.wav'),
  require('./assets/sounds/son_18.wav'),
  require('./assets/sounds/son_19.wav'),
  require('./assets/sounds/son_20.wav'),
  require('./assets/sounds/son_21.wav'),
  require('./assets/sounds/son_22.wav'),
  require('./assets/sounds/son_23.wav'),
  require('./assets/sounds/son_24.wav'),
  require('./assets/sounds/son_25.wav')
];
const SOUND_IDS = SOUND_NAMES.map((name, i) => ({ name, id: `son_${String(i+1).padStart(2,'0')}.wav`, file: SOUND_FILES[i] }));
const DEFAULT_SOUND = SOUND_IDS[0].id;
const SETTINGS_KEY = 'snkmc_settings_v1';


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

async function scheduleVote(site, ts, sound = DEFAULT_SOUND) {
  try {
    await Notifications.cancelScheduledNotificationAsync(site.key);
  } catch (e) {}
  const secs = Math.ceil((ts - Date.now()) / 1000);
  if (secs < 1) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: site.key,
      content: { title: 'Rappel de vote SNKMC', body: `Vote disponible sur ${site.label} !`, sound },
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
  const [sites, setSites] = useState(DEFAULT_SITES);
  const [sound, setSound] = useState(DEFAULT_SOUND);
  const [settings, setSettings] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newMinutes, setNewMinutes] = useState('');
  const previewRef = useRef(null);

  const persistSettings = async (list, selected) => {
    try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ sites: list, sound: selected })); } catch (e) {}
  };

  const chooseSound = async (item) => {
    setSound(item.id);
    await persistSettings(sites, item.id);
    // Les notifications déjà planifiées doivent être remplacées pour utiliser le nouveau son.
    for (const site of sites) {
      if (next[site.key] > Date.now()) await scheduleVote(site, next[site.key], item.id);
    }
  };

  const previewSound = (item) => {
    try {
      if (previewRef.current) { previewRef.current.remove(); previewRef.current = null; }
      const player = createAudioPlayer(item.file);
      previewRef.current = player;
      player.play();
    } catch (e) { Alert.alert('Préécoute indisponible', 'Impossible de lire ce son.'); }
  };

  const addSite = async () => {
    const label = newName.trim();
    const url = newUrl.trim();
    const cooldown = Number(newMinutes.replace(',', '.'));
    if (!label || !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url) || !Number.isFinite(cooldown) || cooldown <= 0 || cooldown > 10080) {
      Alert.alert('Informations incorrectes', 'Indique un nom, une URL https:// valide et une durée entre 1 et 10080 minutes.');
      return;
    }
    const key = `custom-${Date.now()}`;
    const list = [...sites, { key, label, url, cooldown }];
    setSites(list);
    await persistSettings(list, sound);
    setNewName(''); setNewUrl(''); setNewMinutes('');
    Alert.alert('Site ajouté', `${label} apparaît maintenant sur l’accueil.`);
  };

  const removeSite = (site) => {
    Alert.alert('Supprimer ce site ?', site.label, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await Notifications.cancelScheduledNotificationAsync(site.key).catch(() => {});
        const list = sites.filter(s => s.key !== site.key);
        const n = { ...next }; delete n[site.key];
        setSites(list); setNext(n);
        await persist(pseudo, n); await persistSettings(list, sound);
      } },
    ]);
  };


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
      let cfg = {};
      try { const raw = await AsyncStorage.getItem(SETTINGS_KEY); if (raw) cfg = JSON.parse(raw); } catch (e) {}
      const loadedSites = Array.isArray(cfg.sites) && cfg.sites.length ? cfg.sites : DEFAULT_SITES;
      const selectedSound = SOUND_IDS.some(x => x.id === cfg.sound) ? cfg.sound : DEFAULT_SOUND;
      setSites(loadedSites);
      setSound(selectedSound);
      const p = st.pseudo || DEFAULT_PSEUDO;
      const n = st.next || {};
      setPseudo(p);
      setNext(n);
      for (const site of loadedSites) {
        if (n[site.key] && n[site.key] > Date.now()) scheduleVote(site, n[site.key], selectedSound);
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
    await scheduleVote(site, ts, sound);
  };

  const vote = async (site) => {
    await Clipboard.setStringAsync(pseudo);
    await startTimer(site);
    Linking.openURL(site.url).catch(() => Alert.alert('Lien inaccessible', site.url));
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
        <Text style={styles.title}>{settings ? 'PARAMÈTRES' : 'VOTE SNKMC'}</Text>
        {settings ? (
          <View style={styles.settingsWrap}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSettings(false)}><Text style={styles.backText}>← Retour aux minuteurs</Text></TouchableOpacity>
            <Text style={styles.sectionTitle}>Son des notifications</Text>
            <Text style={styles.hint}>Choisis un son et touche ▶ pour l’écouter. Le son sélectionné sera utilisé pour les prochains rappels.</Text>
            {SOUND_IDS.map(item => (
              <View key={item.id} style={styles.soundRow}>
                <TouchableOpacity style={styles.soundSelect} onPress={() => chooseSound(item)}>
                  <Text style={styles.soundText}>{sound === item.id ? '◉' : '○'}  {item.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.previewButton} onPress={() => previewSound(item)}><Text style={styles.soundText}>▶</Text></TouchableOpacity>
              </View>
            ))}
            <Text style={styles.sectionTitle}>Ajouter un minuteur</Text>
            <TextInput style={styles.field} placeholder="Nom du site" placeholderTextColor="#777" value={newName} onChangeText={setNewName} />
            <TextInput style={styles.field} placeholder="https://exemple.fr/vote" placeholderTextColor="#777" autoCapitalize="none" keyboardType="url" value={newUrl} onChangeText={setNewUrl} />
            <TextInput style={styles.field} placeholder="Durée en minutes (ex. 90)" placeholderTextColor="#777" keyboardType="numeric" value={newMinutes} onChangeText={setNewMinutes} />
            <TouchableOpacity style={styles.addButton} onPress={addSite}><Text style={styles.addText}>+ Ajouter le site</Text></TouchableOpacity>
            <Text style={styles.sectionTitle}>Mes sites</Text>
            {sites.map(site => (
              <View key={site.key} style={styles.managedRow}>
                <View style={{ flex: 1 }}><Text style={styles.soundText}>{site.label}</Text><Text style={styles.hint}>{site.cooldown} minutes</Text></View>
                {site.key.startsWith('custom-') && <TouchableOpacity onPress={() => removeSite(site)}><Text style={styles.deleteText}>Supprimer</Text></TouchableOpacity>}
              </View>
            ))}
          </View>
        ) : (<>


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

        {sites.map((site) => (
          <SiteCard
            key={site.key}
            site={site}
            ts={next[site.key]}
            now={now}
            onVote={() => vote(site)}
            onReset={() => reset(site)}
          />
        ))}
        <View style={styles.settingsButtonRow}>
          <TouchableOpacity accessibilityLabel="Paramètres" style={styles.settingsButton} onPress={() => setSettings(true)}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
        </>)}
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
  settingsButtonRow: { width: '100%', maxWidth: 420, alignItems: 'flex-end', paddingTop: 4 },
  settingsButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#555', borderWidth: 2, borderColor: '#777', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { color: '#fff', fontSize: 29 },
  settingsWrap: { width: '100%', maxWidth: 420, backgroundColor: '#1e1e1e', borderRadius: 18, padding: 16 },
  backButton: { paddingVertical: 12, marginBottom: 8 },
  backText: { color: '#ccc', fontWeight: '700', fontSize: 15 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 20, marginBottom: 12 },
  hint: { color: '#999', fontSize: 13, marginBottom: 8 },
  soundRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333', minHeight: 46 },
  soundSelect: { flex: 1, paddingVertical: 12 },
  soundText: { color: '#eee', fontSize: 15 },
  previewButton: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#333', borderRadius: 12 },
  field: { color: '#fff', backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#555', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 15 },
  addButton: { backgroundColor: '#555', borderRadius: 14, alignItems: 'center', padding: 14 },
  addText: { color: '#fff', fontWeight: '800' },
  managedRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 12 },
  deleteText: { color: '#ff7777', padding: 8 },
});
