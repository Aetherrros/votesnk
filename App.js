import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Easing, Image, Linking, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View, useColorScheme,
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
const SOUND_NAMES = ["Ding classique", "Ding grave", "Ding dong", "Dong ding", "Carillon trois", "Carillon descendant", "Arpege majeur", "Arpege mineur", "Pop bulle", "Pop double", "Blip retro", "Blip double", "Pickup coin", "Level up", "Power up", "Power down", "Laser", "Sonar", "Sonar double", "Goutte", "Xylophone", "Harpe", "Pizzicato", "Clochette", "Cloche eglise", "Gong doux", "Triangle", "Marimba", "Celeste", "Fanfare courte", "Alerte douce", "Alerte urgente", "Alarme", "Sirene", "Bip simple", "Bip triple", "Tic toc", "Clic", "Snap", "Whoosh", "Tada", "Succes", "Accord mineur", "Quinte", "Oiseau", "Grillon", "Zen", "Wah", "Coucou", "Minecraft xp"];
const SOUND_FILES = [
  require('./assets/sounds/01_ding_classique.wav'),
  require('./assets/sounds/02_ding_grave.wav'),
  require('./assets/sounds/03_ding_dong.wav'),
  require('./assets/sounds/04_dong_ding.wav'),
  require('./assets/sounds/05_carillon_trois.wav'),
  require('./assets/sounds/06_carillon_descendant.wav'),
  require('./assets/sounds/07_arpege_majeur.wav'),
  require('./assets/sounds/08_arpege_mineur.wav'),
  require('./assets/sounds/09_pop_bulle.wav'),
  require('./assets/sounds/10_pop_double.wav'),
  require('./assets/sounds/11_blip_retro.wav'),
  require('./assets/sounds/12_blip_double.wav'),
  require('./assets/sounds/13_pickup_coin.wav'),
  require('./assets/sounds/14_level_up.wav'),
  require('./assets/sounds/15_power_up.wav'),
  require('./assets/sounds/16_power_down.wav'),
  require('./assets/sounds/17_laser.wav'),
  require('./assets/sounds/18_sonar.wav'),
  require('./assets/sounds/19_sonar_double.wav'),
  require('./assets/sounds/20_goutte.wav'),
  require('./assets/sounds/21_xylophone.wav'),
  require('./assets/sounds/22_harpe.wav'),
  require('./assets/sounds/23_pizzicato.wav'),
  require('./assets/sounds/24_clochette.wav'),
  require('./assets/sounds/25_cloche_eglise.wav'),
  require('./assets/sounds/26_gong_doux.wav'),
  require('./assets/sounds/27_triangle.wav'),
  require('./assets/sounds/28_marimba.wav'),
  require('./assets/sounds/29_celeste.wav'),
  require('./assets/sounds/30_fanfare_courte.wav'),
  require('./assets/sounds/31_alerte_douce.wav'),
  require('./assets/sounds/32_alerte_urgente.wav'),
  require('./assets/sounds/33_alarme.wav'),
  require('./assets/sounds/34_sirene.wav'),
  require('./assets/sounds/35_bip_simple.wav'),
  require('./assets/sounds/36_bip_triple.wav'),
  require('./assets/sounds/37_tic_toc.wav'),
  require('./assets/sounds/38_clic.wav'),
  require('./assets/sounds/39_snap.wav'),
  require('./assets/sounds/40_whoosh.wav'),
  require('./assets/sounds/41_tada.wav'),
  require('./assets/sounds/42_succes.wav'),
  require('./assets/sounds/43_accord_mineur.wav'),
  require('./assets/sounds/44_quinte.wav'),
  require('./assets/sounds/45_oiseau.wav'),
  require('./assets/sounds/46_grillon.wav'),
  require('./assets/sounds/47_zen.wav'),
  require('./assets/sounds/48_wah.wav'),
  require('./assets/sounds/49_coucou.wav'),
  require('./assets/sounds/50_minecraft_xp.wav')
];
const SOUND_IDS = SOUND_NAMES.map((name, i) => ({ name, id: ["01_ding_classique.wav", "02_ding_grave.wav", "03_ding_dong.wav", "04_dong_ding.wav", "05_carillon_trois.wav", "06_carillon_descendant.wav", "07_arpege_majeur.wav", "08_arpege_mineur.wav", "09_pop_bulle.wav", "10_pop_double.wav", "11_blip_retro.wav", "12_blip_double.wav", "13_pickup_coin.wav", "14_level_up.wav", "15_power_up.wav", "16_power_down.wav", "17_laser.wav", "18_sonar.wav", "19_sonar_double.wav", "20_goutte.wav", "21_xylophone.wav", "22_harpe.wav", "23_pizzicato.wav", "24_clochette.wav", "25_cloche_eglise.wav", "26_gong_doux.wav", "27_triangle.wav", "28_marimba.wav", "29_celeste.wav", "30_fanfare_courte.wav", "31_alerte_douce.wav", "32_alerte_urgente.wav", "33_alarme.wav", "34_sirene.wav", "35_bip_simple.wav", "36_bip_triple.wav", "37_tic_toc.wav", "38_clic.wav", "39_snap.wav", "40_whoosh.wav", "41_tada.wav", "42_succes.wav", "43_accord_mineur.wav", "44_quinte.wav", "45_oiseau.wav", "46_grillon.wav", "47_zen.wav", "48_wah.wav", "49_coucou.wav", "50_minecraft_xp.wav"][i], file: SOUND_FILES[i] }));
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
function Half({ digit, theme, bottom, light }) {
  const t = light && theme !== 'red' ? { top: '#fafafa', bottom: '#f1f2f5', border: '#dfe1e7', line: '#d1d3da' } : THEMES[theme];
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
        <Text style={[styles.digit, light && theme !== 'red' && { color: '#151515' }]}>{digit}</Text>
      </View>
    </View>
  );
}

function FlipTile({ digit, theme, light }) {
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
        <Half digit={anim ? next : shown} theme={theme} light={light} />
      </View>
      <View style={{ position: 'absolute', top: HALF }}>
        <Half bottom digit={anim ? prev : shown} theme={theme} light={light} />
      </View>
      {anim && (
        <>
          <Animated.View
            style={{ position: 'absolute', top: 0, opacity: topOpacity, transformOrigin: ['50%', '100%', 0],
              transform: [{ perspective: 500 }, { rotateX: topRot }] }}
          >
            <Half digit={prev} theme={theme} light={light} />
          </Animated.View>
          <Animated.View
            style={{ position: 'absolute', top: HALF, opacity: botOpacity, transformOrigin: ['50%', '0%', 0],
              transform: [{ perspective: 500 }, { rotateX: botRot }] }}
          >
            <Half bottom digit={next} theme={theme} light={light} />
          </Animated.View>
        </>
      )}
    </View>
  );
}

function Pair({ a, b, theme, light }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <FlipTile digit={a} theme={theme} light={light} />
      <FlipTile digit={b} theme={theme} light={light} />
    </View>
  );
}

// ---------------------------------------------------------------- carte d'un site
function SiteCard({ site, ts, now, onVote, onReset, light }) {
  const left = Math.max(0, Math.floor(((ts || 0) - now) / 1000));
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const str = `${String(Math.min(h, 99)).padStart(2, '0')}${String(m).padStart(2, '0')}${String(s).padStart(2, '0')}`;
  const red = left === 0;
  const theme = red ? 'red' : 'normal';

  return (
    <View style={[styles.card, light && lightStyles.card]}>
      <Text style={[styles.siteName, light && lightStyles.text]}>{site.label}</Text>
      <View style={styles.row}>
        <Pair a={str[0]} b={str[1]} theme={theme} light={light} />
        <Text style={[styles.colon, light && lightStyles.text]}>:</Text>
        <Pair a={str[2]} b={str[3]} theme={theme} light={light} />
        <Text style={[styles.colon, light && lightStyles.text]}>:</Text>
        <Pair a={str[4]} b={str[5]} theme={theme} light={light} />
      </View>
      <View style={styles.row2}>
        <Text style={[styles.lbl, light && lightStyles.muted]}>Heures</Text>
        <View style={{ width: 16 }} />
        <Text style={[styles.lbl, light && lightStyles.muted]}>Minutes</Text>
        <View style={{ width: 16 }} />
        <Text style={[styles.lbl, light && lightStyles.muted]}>Secondes</Text>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, red && styles.btnRed, light && !red && lightStyles.voteButton]} onPress={onVote}>
          <Text style={styles.btnText}>Voter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn2, light && lightStyles.secondaryButton]} onPress={onReset}>
          <Text style={[styles.btn2Text, light && lightStyles.text]}>Réinitialiser</Text>
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
  const [settingsTab, setSettingsTab] = useState('appearance');
  const [appearance, setAppearance] = useState('system');
  const systemTheme = useColorScheme();
  const light = appearance === 'light' || (appearance === 'system' && systemTheme === 'light');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newMinutes, setNewMinutes] = useState('');
  const previewRef = useRef(null);

  const persistSettings = async (list, selected) => {
    try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ sites: list, sound: selected, appearance })); } catch (e) {}
  };

  const chooseAppearance = async (value) => {
    setAppearance(value);
    try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ sites, sound, appearance: value })); } catch (e) {}
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
      const loadedSites = Array.isArray(cfg.sites) ? cfg.sites : DEFAULT_SITES;
      const selectedSound = SOUND_IDS.some(x => x.id === cfg.sound) ? cfg.sound : DEFAULT_SOUND;
      setSites(loadedSites);
      setSound(selectedSound);
      setAppearance(['light', 'dark', 'system'].includes(cfg.appearance) ? cfg.appearance : 'dark');
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
    <View style={[styles.screen, light && lightStyles.screen]}>
      <StatusBar barStyle={light ? "dark-content" : "light-content"} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, light && lightStyles.text]}>{settings ? 'PARAMÈTRES' : 'VOTE SNKMC'}</Text>
        {settings ? (
          <View style={[styles.settingsWrap, light && lightStyles.card]}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSettings(false)}><Text style={[styles.backText, light && lightStyles.text]}>← Retour aux minuteurs</Text></TouchableOpacity>
            <View style={styles.tabBar}>
              {[['appearance','Apparence'], ['sounds','Sons'], ['timers','Minuteurs']].map(([id,label]) => (
                <TouchableOpacity key={id} style={[styles.tab, settingsTab === id && styles.activeTab, light && lightStyles.tab, light && settingsTab === id && lightStyles.activeTab]} onPress={() => setSettingsTab(id)}>
                  <Text style={[styles.tabText, settingsTab === id && styles.activeTabText, light && lightStyles.text]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {settingsTab === 'appearance' ? (
              <>
                <Text style={[styles.sectionTitle, light && lightStyles.text]}>Thème de l'application</Text>
                {[['light','☀  Clair'], ['dark','☾  Sombre'], ['system','▣  Identique au système']].map(([id,label]) => (
                  <TouchableOpacity key={id} style={[styles.managedRow, light && lightStyles.divider]} onPress={() => chooseAppearance(id)}>
                    <Text style={[styles.soundText, light && lightStyles.text]}>{appearance === id ? '◉' : '○'}   {label}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : settingsTab === 'sounds' ? (
              <>
                <Text style={[styles.sectionTitle, light && lightStyles.text]}>Son des notifications</Text>
                <Text style={[styles.hint, light && lightStyles.muted]}>Choisis un son et touche ▶ pour l'écouter. Le choix sera utilisé pour les rappels reprogrammés.</Text>
                {SOUND_IDS.map(item => (
                  <View key={item.id} style={[styles.soundRow, light && lightStyles.divider]}>
                    <TouchableOpacity style={styles.soundSelect} onPress={() => chooseSound(item)}>
                      <Text style={[styles.soundText, light && lightStyles.text]}>{sound === item.id ? '◉' : '○'}  {item.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.previewButton, light && lightStyles.secondaryButton]} onPress={() => previewSound(item)}><Text style={[styles.soundText, light && lightStyles.text]}>▶</Text></TouchableOpacity>
                  </View>
                ))}
              </>
            ) : (
              <>
                <Text style={[styles.sectionTitle, light && lightStyles.text]}>Ajouter un minuteur</Text>
                <TextInput style={[styles.field, light && lightStyles.field]} placeholder="Nom du site" placeholderTextColor={light ? '#777' : '#aaa'} value={newName} onChangeText={setNewName} />
                <TextInput style={[styles.field, light && lightStyles.field]} placeholder="https://exemple.fr/vote" placeholderTextColor={light ? '#777' : '#aaa'} autoCapitalize="none" keyboardType="url" value={newUrl} onChangeText={setNewUrl} />
                <TextInput style={[styles.field, light && lightStyles.field]} placeholder="Durée en minutes (ex. 90)" placeholderTextColor={light ? '#777' : '#aaa'} keyboardType="numeric" value={newMinutes} onChangeText={setNewMinutes} />
                <TouchableOpacity style={styles.addButton} onPress={addSite}><Text style={styles.addText}>+ Ajouter le site</Text></TouchableOpacity>
                <Text style={[styles.sectionTitle, light && lightStyles.text]}>Mes sites</Text>
                {sites.map(site => (
                  <View key={site.key} style={[styles.managedRow, light && lightStyles.divider]}>
                    <View style={{ flex: 1 }}><Text style={[styles.soundText, light && lightStyles.text]}>{site.label}</Text><Text style={[styles.hint, light && lightStyles.muted]}>{site.cooldown} minutes</Text></View>
                    {site.key.startsWith('custom-') && <TouchableOpacity onPress={() => removeSite(site)}><Text style={styles.deleteText}>Supprimer</Text></TouchableOpacity>}
                  </View>
                ))}
              </>
            )}
          </View>
        ) : (<>


        <View style={[styles.player, light && lightStyles.card]}>
          <Image source={require('./assets/head.png')} style={styles.head} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.joueur, light && lightStyles.muted]}>Joueur</Text>
            <Text style={[styles.pseudo, light && lightStyles.text]}>{pseudo}</Text>
          </View>
          <TouchableOpacity onPress={changePseudo}>
            <Text style={[styles.changer, light && lightStyles.muted]}>changer</Text>
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
            light={light}
          />
        ))}
        <View style={styles.settingsButtonRow}>
          <TouchableOpacity accessibilityLabel="Paramètres" style={[styles.settingsButton, light && lightStyles.settingsButton]} onPress={() => setSettings(true)}>
            <Text style={[styles.settingsIcon, light && lightStyles.text]}>⚙</Text>
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
  settingsButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { color: '#bcbcbc', fontSize: 29, fontWeight: '300' },
  tabBar: { flexDirection: 'row', gap: 5, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 11, alignItems: 'center', backgroundColor: '#292929' },
  activeTab: { backgroundColor: '#4a4a4a' },
  tabText: { color: '#bbb', fontSize: 12, fontWeight: '700' },
  activeTabText: { color: '#fff' },
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

const lightStyles = StyleSheet.create({
  screen: { backgroundColor: '#f7f8fb' },
  card: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e8e9ef' },
  text: { color: '#16171b' },
  muted: { color: '#777b86' },
  voteButton: { backgroundColor: '#35363b', borderColor: '#35363b' },
  secondaryButton: { backgroundColor: '#eff0f4', borderColor: '#e1e3e9' },
  settingsButton: { backgroundColor: '#fff', borderColor: '#e1e3e9' },
  divider: { borderBottomColor: '#e7e8ed' },
  field: { backgroundColor: '#f4f5f8', borderColor: '#dfe1e7', color: '#16171b' },
  tab: { backgroundColor: '#f2f3f7' },
  activeTab: { backgroundColor: '#dce0e9' },
});
