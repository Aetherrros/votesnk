import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Easing, Image, ImageBackground, Linking, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View, useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { createAudioPlayer } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

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

const WALLPAPERS = [
  require('./assets/backgrounds/fond_mc_01_jour.png'),
  require('./assets/backgrounds/fond_mc_02_coucher_de_soleil.png'),
  require('./assets/backgrounds/fond_mc_03_nuit.png'),
  require('./assets/backgrounds/fond_mc_04_neige.png'),
  require('./assets/backgrounds/fond_mc_05_portail_du_nether.png'),
  require('./assets/backgrounds/fond_mc_06_desert.png'),
];
const WALLPAPER_NAMES = ['Jour', 'Coucher de soleil', 'Nuit', 'Neige', 'Portail du Nether', 'Désert'];

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

// Verre natif Apple sur iOS 26+, avec repli flouté sur les systèmes incompatibles.
// Le matériau doit être dessiné sous le contenu, sans opacité sur son parent.
const CAN_USE_NATIVE_GLASS = (() => {
  try { return isGlassEffectAPIAvailable() && isLiquidGlassAvailable(); }
  catch (_) { return false; }
})();

function GlassLayer({ radius = 26, intensity = 80 }) {
  if (CAN_USE_NATIVE_GLASS) {
    return (
      <GlassView
        pointerEvents="none"
        glassEffectStyle="regular"
        colorScheme="dark"
        tintColor="#27416c"
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
      />
    );
  }
  return (
    <BlurView pointerEvents="none" tint="dark" intensity={intensity}
      style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]} />
  );
}

// Rouage vectoriel dessiné avec du texte monochrome (pas l'emoji métallique iOS).
function GearGlyph({ close = false }) {
  return (
    <Text style={{ fontSize: close ? 28 : 31, fontWeight: '500', color: '#ffffff',
      textAlign: 'center', includeFontPadding: false, lineHeight: 36 }}>
      {close ? '×' : '⚙︎'}
    </Text>
  );
}

// ---------------------------------------------------------------- carte Liquid Glass d'un minuteur
function SiteCard({ site, ts, now, onVote, onReset, onEdit, light, glass }) {
  const remaining = Math.max(0, Math.ceil(((ts || 0) - now) / 1000));
  const total = Math.max(1, site.cooldown * 60);
  const elapsed = Math.min(1, Math.max(0, (total - remaining) / total));
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const sec = remaining % 60;
  const ready = remaining === 0;
  const tint = ready ? '#37a88e' : '#5578e9';
  return (
    <View style={[styles.glassTimerCard, glass ? styles.glassPanel : light ? styles.lightPanel : styles.darkPanel]}>
      {glass && <GlassLayer radius={28} />}
      <View style={styles.timerTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.timerTitle, { color: glass ? '#ffffff' : light ? '#24304a' : '#f7f8ff' }]} numberOfLines={1}>{site.label}</Text>
          <Text style={[styles.timerSubtitle, { color: glass ? '#d8e5ff' : light ? '#66738a' : '#bac5d9' }]} numberOfLines={1}>
            {ready ? 'Prêt à voter' : `Toutes les ${site.cooldown} min`}
          </Text>
        </View>
        <TouchableOpacity accessibilityLabel={'Modifier ' + site.label} onPress={onEdit} style={styles.flatMenu}>
          <Text style={{ color: glass ? '#fff' : light ? '#485773' : '#fff', fontSize: 24, lineHeight: 26 }}>···</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.timerCenter}>
        <View style={[styles.timerCircle, { borderColor: ready ? '#a7e9d8' : '#b9c7f9' }]}>
          <View style={[styles.timerRingInner, { borderTopColor: tint, borderRightColor: tint, transform: [{ rotate: `${Math.round(elapsed * 270)}deg` }] }]} />
          <Text style={[styles.timerClock, { color: glass ? '#fff' : light ? '#26334f' : '#fff' }]}>
            {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(sec).padStart(2,'0')}
          </Text>
          <Text style={[styles.timerState, { color: glass ? '#c5d9ff' : tint }]}>{ready ? 'Disponible' : 'En attente'}</Text>
        </View>
      </View>
      <View style={styles.timerButtons}>
        <TouchableOpacity onPress={onVote} style={styles.voteGlassButton}>
          <Text style={styles.voteGlassText}>↗  Voter</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onReset} style={styles.resetGlassButton}>
          <Text style={styles.resetGlassText}>↻  Réinitialiser</Text>
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
  const [page, setPage] = useState('home');
  const [editingKey, setEditingKey] = useState(null);
  const [settingsTab, setSettingsTab] = useState('appearance');
  const [appearance, setAppearance] = useState('system');
  const [wallpaper, setWallpaper] = useState('0');
  const systemTheme = useColorScheme();
  const glass = appearance === 'glass';
  const light = glass || appearance === 'light' || (appearance === 'system' && systemTheme === 'light');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newMinutes, setNewMinutes] = useState('');
  const previewRef = useRef(null);

  const persistSettings = async (list, selected) => {
    try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ sites: list, sound: selected, appearance, wallpaper })); } catch (e) {}
  };

  const chooseAppearance = async (value) => {
    setAppearance(value);
    try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ sites, sound, appearance: value, wallpaper })); } catch (e) {}
  };

  const chooseWallpaper = async (value) => {
    setWallpaper(value);
    try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ sites, sound, appearance, wallpaper: value })); } catch (e) {}
  };

  const chooseCustomWallpaper = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert('Autorisation nécessaire', 'Autorise l’accès aux photos pour choisir ton fond.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [9, 16], quality: 0.85 });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const folder = FileSystem.documentDirectory + 'snkvote/';
      await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      const target = folder + 'fond-personnalise.jpg';
      // Utiliser un nom distinct à chaque choix évite le cache des images iOS.
      const uniqueTarget = folder + 'fond-' + Date.now() + '.jpg';
      await FileSystem.copyAsync({ from: result.assets[0].uri, to: uniqueTarget });
      await chooseWallpaper(uniqueTarget);
    } catch (e) { Alert.alert('Image indisponible', 'Impossible de charger cette image.'); }
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

  const editSite = (site) => {
    setEditingKey(site.key);
    setNewName(site.label);
    setNewUrl(site.url);
    setNewMinutes(String(site.cooldown));
    setSettingsTab('timers');
    setPage('settings');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setNewName(''); setNewUrl(''); setNewMinutes('');
  };

  const addSite = async () => {
    const label = newName.trim();
    const url = newUrl.trim();
    const cooldown = Number(newMinutes.replace(',', '.'));
    if (!label || !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url) || !Number.isFinite(cooldown) || cooldown <= 0 || cooldown > 10080) {
      Alert.alert('Informations incorrectes', 'Indique un nom, une URL https:// valide et une durée entre 1 et 10080 minutes.');
      return;
    }
    const key = editingKey || `custom-${Date.now()}`;
    const updated = { key, label, url, cooldown };
    const list = editingKey ? sites.map(site => site.key === editingKey ? updated : site) : [...sites, updated];
    setSites(list);
    await persistSettings(list, sound);
    if (editingKey && next[key] > Date.now()) await scheduleVote(updated, next[key], sound);
    cancelEdit();
    Alert.alert(editingKey ? 'Site modifié' : 'Site ajouté', `${label} est enregistré.`);
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
      // Respecte exactement la liste sauvegardée, même si les sites initiaux ont été supprimés.
      const loadedSites = Array.isArray(cfg.sites) ? cfg.sites : DEFAULT_SITES;
      const selectedSound = SOUND_IDS.some(x => x.id === cfg.sound) ? cfg.sound : DEFAULT_SOUND;
      setSites(loadedSites);
      setSound(selectedSound);
      setAppearance(['light', 'dark', 'system', 'glass'].includes(cfg.appearance) ? cfg.appearance : 'dark');
      setWallpaper(typeof cfg.wallpaper === 'string' ? cfg.wallpaper : '0');
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

  const openPage = (target) => {
    setPage(target);
    setSettings(target === 'settings');
  };

  return (
    <ImageBackground
      key={wallpaper}
      source={/^(file:\/\/|content:\/\/|ph:\/\/|assets-library:\/\/)/i.test(wallpaper)
        ? { uri: wallpaper }
        : WALLPAPERS[Math.max(0, Math.min(WALLPAPERS.length - 1, Number(wallpaper) || 0))]}
      resizeMode="cover"
      style={[styles.screen, { backgroundColor: '#e7efff' }]}
      imageStyle={{ width: '100%', height: '100%' }}
    >
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {
        backgroundColor: glass ? 'rgba(4,10,31,0.18)' : light ? 'rgba(255,255,255,0.16)' : 'rgba(7,15,36,0.24)',
      }]} />
      <StatusBar barStyle={glass ? 'light-content' : light ? 'dark-content' : 'light-content'} />
      <ScrollView key={page} contentContainerStyle={[styles.content, { paddingBottom: 112 }]}>
        <View style={styles.topHeading}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, light && lightStyles.text]}>
              {settings ? 'Réglages' : page === 'sites' ? 'Mes sites' : <><Text>Noti</Text><Text style={{ color: '#617af4' }}>Rappel</Text></>}
            </Text>
            {!settings && <Text style={[styles.headerCaption, { color: glass ? '#ffffff' : light ? '#65738e' : '#c4cee0' }]}>Tes rappels de vote, au bon moment</Text>}
          </View>
          <TouchableOpacity accessibilityLabel="Ouvrir les réglages" onPress={() => openPage(settings ? 'home' : 'settings')} style={[styles.gearButton, glass ? styles.glassPanel : light ? styles.lightPanel : styles.darkPanel]}>
            {glass && <GlassLayer radius={24} />}
            {glass ? <GearGlyph close={settings} /> : <Text style={{ fontSize: 25, color: light ? '#465877' : '#fff' }}>{settings ? '×' : '⚙︎'}</Text>}
          </TouchableOpacity>
        </View>
        {settings ? (
          <View style={[styles.settingsWrap, light && lightStyles.card, glass && glassStyles.card]}>
            {glass && <GlassLayer radius={18} intensity={65} />}
            <TouchableOpacity style={styles.backButton} onPress={() => openPage('home')}><Text style={[styles.backText, light && lightStyles.text, glass && styles.glassText]}>← Retour aux minuteurs</Text></TouchableOpacity>
            <View style={styles.tabBar}>
              {[['appearance','Apparence'], ['sounds','Sons'], ['timers','Minuteurs']].map(([id,label]) => (
                <TouchableOpacity key={id} style={[styles.tab, settingsTab === id && styles.activeTab, light && lightStyles.tab, light && settingsTab === id && lightStyles.activeTab, glass && styles.glassTab]} onPress={() => setSettingsTab(id)}>
                  <Text style={[styles.tabText, settingsTab === id && styles.activeTabText, light && lightStyles.text, glass && styles.glassTabText]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {settingsTab === 'appearance' ? (
              <>
                <Text style={[styles.sectionTitle, light && lightStyles.text, glass && styles.glassText]}>Thème de l'application</Text>
                {[['light','☀  Clair'], ['dark','☾  Sombre'], ['system','▣  Identique au système'], ['glass','✦  Liquid Glass']].map(([id,label]) => (
                  <TouchableOpacity key={id} style={[styles.managedRow, light && lightStyles.divider]} onPress={() => chooseAppearance(id)}>
                    <Text style={[styles.soundText, light && lightStyles.text, glass && styles.glassText]}>{appearance === id ? '◉' : '○'}   {label}</Text>
                  </TouchableOpacity>
                ))}
                {<>
                  <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Fonds d'écran Minecraft</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {WALLPAPERS.map((source, index) => (
                      <TouchableOpacity key={index} onPress={() => chooseWallpaper(String(index))} style={{ width: '31%', marginBottom: 12 }}>
                        <Image source={source} style={{ width: '100%', height: 130, borderRadius: 12, borderWidth: wallpaper === String(index) ? 3 : 1, borderColor: wallpaper === String(index) ? '#55b8ff' : '#ffffff77' }} />
                        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 5 }}>{WALLPAPER_NAMES[index]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={chooseCustomWallpaper} style={[styles.addButton, { backgroundColor: '#2161a8', marginTop: 6 }]}>
                    <Text style={styles.addText}>＋ Choisir une photo sur mon iPhone</Text>
                  </TouchableOpacity>
                  {(/^(file:\/\/|content:\/\/|ph:\/\/|assets-library:\/\/)/i.test(wallpaper)) && <Text style={[styles.hint, { color: '#fff', marginTop: 8 }]}>✓ Fond personnalisé sélectionné</Text>}
                </>}
              </>
            ) : settingsTab === 'sounds' ? (
              <>
                <Text style={[styles.sectionTitle, light && lightStyles.text, glass && styles.glassText]}>Son des notifications</Text>
                <Text style={[styles.hint, light && lightStyles.muted, glass && styles.glassMuted]}>Choisis un son et touche ▶ pour l'écouter. Le choix sera utilisé pour les rappels reprogrammés.</Text>
                {SOUND_IDS.map(item => (
                  <View key={item.id} style={[styles.soundRow, light && lightStyles.divider]}>
                    <TouchableOpacity style={styles.soundSelect} onPress={() => chooseSound(item)}>
                      <Text style={[styles.soundText, light && lightStyles.text, glass && styles.glassText]}>{sound === item.id ? '◉' : '○'}  {item.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.previewButton, light && lightStyles.secondaryButton]} onPress={() => previewSound(item)}><Text style={[styles.soundText, light && lightStyles.text, glass && styles.glassText]}>▶</Text></TouchableOpacity>
                  </View>
                ))}
              </>
            ) : (
              <>
                <Text style={[styles.sectionTitle, light && lightStyles.text, glass && styles.glassText]}>{editingKey ? 'Modifier le minuteur' : 'Ajouter un minuteur'}</Text>
                <TextInput style={[styles.field, light && lightStyles.field, glass && styles.glassField]} placeholder="Nom du site" placeholderTextColor={light ? '#777' : '#aaa'} value={newName} onChangeText={setNewName} />
                <TextInput style={[styles.field, light && lightStyles.field, glass && styles.glassField]} placeholder="https://exemple.fr/vote" placeholderTextColor={light ? '#777' : '#aaa'} autoCapitalize="none" keyboardType="url" value={newUrl} onChangeText={setNewUrl} />
                <TextInput style={[styles.field, light && lightStyles.field, glass && styles.glassField]} placeholder="Durée en minutes (ex. 90)" placeholderTextColor={light ? '#777' : '#aaa'} keyboardType="numeric" value={newMinutes} onChangeText={setNewMinutes} />
                <TouchableOpacity style={styles.addButton} onPress={addSite}><Text style={styles.addText}>{editingKey ? '✓ Enregistrer les modifications' : '+ Ajouter le site'}</Text></TouchableOpacity>
                {editingKey && <TouchableOpacity onPress={cancelEdit} style={{ padding: 12, alignItems: 'center' }}><Text style={[styles.soundText, light && lightStyles.text, glass && styles.glassText]}>Annuler la modification</Text></TouchableOpacity>}
                <Text style={[styles.sectionTitle, light && lightStyles.text, glass && styles.glassText]}>Mes sites</Text>
                {sites.map(site => (
                  <View key={site.key} style={[styles.managedRow, light && lightStyles.divider]}>
                    <View style={{ flex: 1 }}><Text style={[styles.soundText, light && lightStyles.text, glass && styles.glassText]}>{site.label}</Text><Text style={[styles.hint, light && lightStyles.muted, glass && styles.glassMuted]}>{site.cooldown} minutes</Text></View>
                    <TouchableOpacity onPress={() => editSite(site)}><Text style={[styles.editText, light && lightStyles.text]}>Modifier</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => removeSite(site)}><Text style={styles.deleteText}>Supprimer</Text></TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        ) : page === 'sites' ? (
          <View style={[styles.settingsWrap, light && lightStyles.card, glass && glassStyles.card]}>
            {glass && <GlassLayer radius={18} />}
            <Text style={[styles.sectionTitle, light && lightStyles.text, glass && styles.glassText]}>Sites de vote</Text>
            {sites.map(site => (
              <View key={site.key} style={[styles.managedRow, light && lightStyles.divider]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.soundText, light && lightStyles.text, glass && styles.glassText]}>{site.label}</Text>
                  <Text style={[styles.hint, light && lightStyles.muted, glass && styles.glassMuted]}>{site.cooldown} minutes</Text>
                </View>
                <TouchableOpacity onPress={() => editSite(site)}><Text style={[styles.editText, light && lightStyles.text]}>Modifier</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => removeSite(site)}><Text style={styles.deleteText}>Supprimer</Text></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={() => { cancelEdit(); setSettingsTab('timers'); openPage('settings'); }}><Text style={styles.addText}>+ Ajouter un site</Text></TouchableOpacity>
          </View>
        ) : (<>


        <View style={[styles.player, light && lightStyles.card, glass && glassStyles.card]}>
          {glass && <GlassLayer radius={18} />}
          <Image source={require('./assets/head.png')} style={styles.head} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.joueur, light && lightStyles.muted, glass && styles.glassMuted]}>Joueur</Text>
            <Text style={[styles.pseudo, light && lightStyles.text, glass && styles.glassText]}>{pseudo}</Text>
          </View>
          <TouchableOpacity onPress={changePseudo}>
            <Text style={[styles.changer, light && lightStyles.muted, glass && styles.glassMuted]}>changer</Text>
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
            glass={glass}
            onEdit={() => editSite(site)}
          />
        ))}
        <TouchableOpacity style={[styles.wallpaperCard, glass ? styles.glassPanel : light ? styles.lightPanel : styles.darkPanel]} onPress={() => { setSettingsTab('appearance'); openPage('settings'); }}>
          {glass && <GlassLayer radius={24} />}
          <View style={{ flex: 1 }}>
            <Text style={[styles.wallpaperHeading, { color: glass ? '#fff' : light ? '#29364f' : '#fff' }]}>✦  Fond d'écran</Text>
            <Text style={{ color: glass ? '#d8e5ff' : light ? '#65738e' : '#cbd6ed', marginTop: 5 }}>Personnaliser l'ambiance</Text>
          </View>
          <Text style={{ fontSize: 24, color: light ? '#65738e' : '#fff' }}>›</Text>
        </TouchableOpacity>
        </>)}
      </ScrollView>
      <View style={[styles.bottomNav, light && lightStyles.bottomNav, glass && glassStyles.nav]}>
        {glass && <GlassLayer radius={30} />}
        {[['home','⌂','Accueil'],['sites','☷','Sites']].map(([id, icon, label]) => (
          <TouchableOpacity key={id} accessibilityLabel={label} onPress={() => openPage(id)}
            style={[styles.navItem, page === id && styles.navActive]}>
            <Text style={[styles.navIcon, { color: page === id ? '#ffffff' : (glass ? '#e2eaff' : light ? '#333' : '#d7e0f5') }]}>{icon}</Text>
            <Text style={[styles.navLabel, { color: page === id ? '#ffffff' : (glass ? '#e2eaff' : light ? '#333' : '#d7e0f5') }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  glassText: { color: '#ffffff' },
  glassMuted: { color: '#d1def7' },
  glassTabText: { color: '#203453' },
  glassTab: { backgroundColor: 'rgba(231,239,255,0.92)' },
  glassField: { backgroundColor: 'rgba(235,242,255,0.92)', color: '#172b4a', borderColor: 'rgba(255,255,255,0.75)' },

  topHeading: { width: '100%', maxWidth: 420, flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  headerCaption: { fontSize: 13, marginTop: -9, marginBottom: 8 },
  gearButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' },
  glassPanel: { backgroundColor: 'transparent', borderColor: 'rgba(220,235,255,0.75)', borderWidth: 1, overflow: 'hidden' },
  lightPanel: { backgroundColor: 'rgba(255,255,255,0.90)', borderColor: 'rgba(210,222,244,0.8)', borderWidth: 1 },
  darkPanel: { backgroundColor: 'rgba(27,35,57,0.90)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 },
  glassTimerCard: { width: '100%', maxWidth: 420, borderRadius: 28, padding: 18, marginBottom: 15, overflow: 'hidden', shadowColor: '#667eac', shadowOpacity: 0.13, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  timerTop: { flexDirection: 'row', alignItems: 'center' },
  timerTitle: { fontSize: 19, fontWeight: '800' },
  timerSubtitle: { fontSize: 12, marginTop: 4 },
  flatMenu: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  timerCenter: { alignItems: 'center', marginVertical: 15 },
  timerCircle: { width: 174, height: 174, borderRadius: 87, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  timerRingInner: { position: 'absolute', width: 174, height: 174, borderRadius: 87, borderWidth: 7, borderLeftColor: 'transparent', borderBottomColor: 'transparent' },
  timerClock: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timerState: { fontSize: 12, fontWeight: '700', marginTop: 5 },
  timerButtons: { flexDirection: 'row', gap: 10 },
  voteGlassButton: { flex: 1, paddingVertical: 13, backgroundColor: '#6378eb', borderRadius: 17, alignItems: 'center' },
  voteGlassText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  resetGlassButton: { flex: 1, paddingVertical: 13, backgroundColor: 'rgba(216,225,247,0.78)', borderRadius: 17, alignItems: 'center' },
  resetGlassText: { color: '#465778', fontWeight: '800', fontSize: 13 },
  wallpaperCard: { width: '100%', maxWidth: 420, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  wallpaperHeading: { fontSize: 17, fontWeight: '800' },

  screen: { flex: 1, backgroundColor: '#111111' },
  content: { paddingTop: 64, paddingBottom: 40, paddingHorizontal: 16, alignItems: 'center' },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 16 },
  player: {
    overflow: 'hidden', width: '100%', maxWidth: 420, backgroundColor: '#1e1e1e', borderRadius: 18,
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
  settingsWrap: { width: '100%', maxWidth: 420, backgroundColor: '#1e1e1e', borderRadius: 18, padding: 16, overflow: 'hidden' },
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
  editText: { color: '#83bfff', padding: 8, fontWeight: '700' },
  bottomNav: { overflow: 'hidden', position: 'absolute', bottom: 18, left: 20, right: 20, flexDirection: 'row', padding: 6, backgroundColor: 'rgba(30,35,46,0.94)', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7, borderRadius: 24 },
  navActive: { backgroundColor: '#237eff' },
  navIcon: { fontSize: 22, fontWeight: '700' },
  navLabel: { fontSize: 11, marginTop: 2, fontWeight: '600' },
});

// Interface inspirée de la maquette Liquid Glass (transparence simulée sans module natif).
const liquidStyles = StyleSheet.create({});
const lightStyles = StyleSheet.create({
  screen: { backgroundColor: '#f7f8fb' },
  bottomNav: { backgroundColor: 'rgba(245,246,250,0.96)', borderColor: '#dce0e9' },
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

const glassStyles = StyleSheet.create({ nav: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.55)' }, card: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(215,230,255,0.55)' } });
