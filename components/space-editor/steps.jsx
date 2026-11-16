import { useMemo, useState } from 'react';
import { View, Text, Pressable, Image, Alert, ActivityIndicator, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../constants/theme';
import { mobileApi } from '../../lib/api';
import {
  WEEKDAYS, NEARBY, DURATION_LABELS, TIME_OPTIONS, sameTime,
} from '../../lib/spaceForm';
import {
  TextField, ToggleRow, ChoiceChips, PickerField, SingleImageField, Group, Row, Col, Label,
  IMAGE_MEDIA_TYPES, assetToFile, styles as f,
} from './fields';
import VerificationBox from './VerificationBox';

const TIME_LIST = TIME_OPTIONS.map((t) => ({ id: t, name: t }));
const timeValue = (v) => TIME_OPTIONS.find((t) => sameTime(t, v)) || v;

/* ---------- 1. Basics ---------- */
export function BasicsStep({ form, patch, options, isEdit, isAdmin }) {
  return (
    <>
      <TextField label="Space name" required value={form.name} onChange={(v) => patch('name', v)} placeholder="e.g. Awfis Sector 62" />
      <PickerField
        label="Brand / operator"
        required
        value={form.brand}
        valueLabel={form.labels.brand}
        options={options.brands}
        onChange={(id, o) => patch('brand', id, { labels: { ...form.labels, brand: o?.name || '' } })}
        placeholder="Choose brand"
        emptyText="No coworking brands found. Add the brand in the admin panel first."
      />
      <ChoiceChips label="Space tag" required hint="Badge on the website card" options={options.spaceTags} value={form.spaceTag} onChange={(v) => patch('spaceTag', v)} />
      <Row>
        <Col><TextField label="Total seats" value={form.seats} onChange={(v) => patch('seats', v.replace(/[^\d]/g, ''))} keyboardType="number-pad" placeholder="e.g. 120" /></Col>
        <Col><TextField label="Starting price" prefix="₹" value={form.startingPrice} onChange={(v) => patch('startingPrice', v.replace(/[^\d]/g, ''))} keyboardType="number-pad" placeholder="per seat / month" /></Col>
      </Row>
      <Row>
        <Col><TextField label="Rating" hint="out of 5" value={form.rating} onChange={(v) => patch('rating', v.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" placeholder="e.g. 4.5" maxLength={4} /></Col>
        <Col><TextField label="Number of reviews" value={form.ratingCount} onChange={(v) => patch('ratingCount', v.replace(/[^\d]/g, ''))} keyboardType="number-pad" placeholder="e.g. 548" /></Col>
      </Row>
      <ChoiceChips
        label="Reviews from"
        hint='Shown as "548 Google reviews"'
        options={[{ value: '', label: 'Not set' }, { value: 'Google', label: 'Google' }, { value: 'SpaceWallah', label: 'SpaceWallah' }]}
        value={form.ratingSource || ''}
        onChange={(v) => patch('ratingSource', v)}
      />
      <Row>
        <Col><TextField label="Centre size" suffix="sq ft" value={form.areaSqft} onChange={(v) => patch('areaSqft', v.replace(/[^\d]/g, ''))} keyboardType="number-pad" placeholder="e.g. 30000" /></Col>
        <Col />
      </Row>

      <Label text="Good for" />
      <ToggleRow icon="people-outline" label="Small teams" hint="Teams of 2–10" value={form.smallTeam} onChange={(v) => patch('smallTeam', v)} />
      <ToggleRow icon="business-outline" label="Enterprise" hint="Large teams and offices" value={form.enterprise} onChange={(v) => patch('enterprise', v)} />

      {isEdit && form.id ? <VerificationBox listingId={form.id} value={form.verification} /> : null}

      <Group title="On the website">
        <ToggleRow icon="eye-outline" label="Show on website" hint="Turn off to hide the space without deleting it" value={form.isActive} onChange={(v) => patch('isActive', v)} />
        {isAdmin ? (
          <ChoiceChips
            label="Status"
            hint="Only Approved spaces are live"
            options={options.statuses.map((s) => ({ value: s.key, label: s.label.replace(' (live on website)', '') }))}
            value={form.status}
            onChange={(v) => patch('status', v)}
          />
        ) : (
          <View style={st.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
            <Text style={st.infoText}>
              {isEdit ? `Status: ${statusLabel(form.status)}. Only admins can change it.` : 'New spaces are saved as Pending until an admin approves them.'}
            </Text>
          </View>
        )}
        {isEdit ? (
          <TextField
            label="Web address"
            hint="spacewallah.com/coworking/…"
            value={form.slug}
            onChange={(v) => patch('slug', v.toLowerCase().replace(/\s+/g, '-'))}
            autoCapitalize="none"
            placeholder="space-name-area"
          />
        ) : null}
      </Group>
    </>
  );
}
const statusLabel = (k) => ({ approved: 'Approved', pending: 'Pending', inprogress: 'In progress', rejected: 'Rejected' }[k] || 'Pending');

/* ---------- 2. Location ---------- */
export function LocationStep({ form, setForm, options }) {
  const L = form.location;
  const setLoc = (changes, labels = {}) => setForm((p) => ({
    ...p,
    location: { ...p.location, ...changes },
    labels: { ...p.labels, ...labels },
  }));

  const areaQ = useQuery({
    queryKey: ['space-locations', L.country, L.state],
    queryFn: () => mobileApi.getSpaceLocations({ country: L.country, state: L.state }),
    enabled: Boolean(L.country),
    staleTime: 10 * 60e3,
  });
  const microQ = useQuery({
    queryKey: ['space-micro', L.city],
    queryFn: () => mobileApi.getSpaceLocations({ city: L.city }),
    enabled: Boolean(L.city),
    staleTime: 10 * 60e3,
  });
  const N = form.nearby;
  const setNear = (key, changes) => setForm((p) => ({ ...p, nearby: { ...p.nearby, [key]: { ...p.nearby[key], ...changes } } }));

  return (
    <>
      <Row>
        <Col>
          <PickerField
            label="Country" required value={L.country} valueLabel={form.labels.country} options={options.countries}
            onChange={(id, o) => setLoc({ country: id, state: '', city: '', microLocation: '' }, { country: o?.name || '', state: '', city: '', microLocation: '' })}
          />
        </Col>
        <Col>
          <PickerField
            label="State" value={L.state} valueLabel={form.labels.state} options={areaQ.data?.states || []}
            loading={areaQ.isFetching} disabled={!L.country} allowClear placeholder="Any"
            onChange={(id, o) => setLoc({ state: id, city: '', microLocation: '' }, { state: o?.name || '', city: '', microLocation: '' })}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <PickerField
            label="City" required value={L.city} valueLabel={form.labels.city} options={areaQ.data?.cities || []}
            loading={areaQ.isFetching} disabled={!L.country} placeholder={L.country ? 'Choose city' : 'Choose country first'}
            onChange={(id, o) => setLoc({ city: id, microLocation: '' }, { city: o?.name || '', microLocation: '' })}
          />
        </Col>
        <Col>
          <PickerField
            label="Area" value={L.microLocation} valueLabel={form.labels.microLocation} options={microQ.data?.microLocations || []}
            loading={microQ.isFetching} disabled={!L.city} allowClear placeholder={L.city ? 'Choose area' : 'City first'}
            emptyText="No areas for this city yet. Add them in the admin panel."
            onChange={(id, o) => setLoc({ microLocation: id }, { microLocation: o?.name || '' })}
          />
        </Col>
      </Row>
      <TextField label="Full address" value={L.address} onChange={(v) => setLoc({ address: v })} placeholder="Plot / building, street, sector" multiline lines={2} />
      <Row>
        <Col><TextField label="Locality name" hint="used in the web address" value={L.name} onChange={(v) => setLoc({ name: v })} placeholder="e.g. Sector 62" /></Col>
      </Row>
      <Row>
        <Col><TextField label="Building name" value={L.buildingName} onChange={(v) => setLoc({ buildingName: v })} placeholder="e.g. Tower A" /></Col>
        <Col><TextField label="Floor" value={L.floor} onChange={(v) => setLoc({ floor: v })} placeholder="e.g. 3rd floor" /></Col>
      </Row>
      <Row>
        <Col><TextField label="PIN code" value={L.postalCode} onChange={(v) => setLoc({ postalCode: v.replace(/[^\d]/g, '') })} keyboardType="number-pad" maxLength={6} placeholder="201301" /></Col>
        <Col />
      </Row>

      <Group title="Map location" hint="Copy from Google Maps: long-press the place, tap the numbers">
        <Row>
          <Col><TextField label="Latitude" value={L.latitude} onChange={(v) => setLoc({ latitude: v.replace(/[^\d.-]/g, '') })} keyboardType="numbers-and-punctuation" placeholder="28.6139" /></Col>
          <Col><TextField label="Longitude" value={L.longitude} onChange={(v) => setLoc({ longitude: v.replace(/[^\d.-]/g, '') })} keyboardType="numbers-and-punctuation" placeholder="77.2090" /></Col>
        </Row>
      </Group>

      <Group title="Nearby transport" hint="Turn on what's close by and add the name and distance">
        {NEARBY.map((n) => (
          <View key={n.key}>
            <ToggleRow icon={n.icon} label={n.label} value={N[n.key]?.on} onChange={(v) => setNear(n.key, { on: v })} />
            {N[n.key]?.on ? (
              <View style={st.indent}>
                <Row>
                  <Col><TextField label="Name" value={N[n.key].name} onChange={(v) => setNear(n.key, { name: v })} placeholder={n.namePh} /></Col>
                  <Col><TextField label="Distance" value={N[n.key].distance} onChange={(v) => setNear(n.key, { distance: v })} placeholder="e.g. 500 m" /></Col>
                </Row>
              </View>
            ) : null}
          </View>
        ))}
      </Group>
    </>
  );
}

/* ---------- 3. Plans ---------- */
export function PlansStep({ form, setForm, options }) {
  const setPlan = (i, changes) => setForm((p) => ({ ...p, plans: p.plans.map((pl, j) => (j === i ? { ...pl, ...changes } : pl)) }));
  const add = () => setForm((p) => ({ ...p, plans: [...p.plans, { type: '', price: '', per: 'month', show: true, image: null }] }));
  const remove = (i) => Alert.alert('Remove plan', 'Remove this plan from the space?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => setForm((p) => ({ ...p, plans: p.plans.filter((_, j) => j !== i) })) },
  ]);
  const durations = (options.durations || ['month', 'day', 'hour']).map((d) => ({ value: d, label: DURATION_LABELS[d] || d }));

  return (
    <>
      {form.plans.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="pricetags-outline" size={30} color={colors.faint} />
          <Text style={st.emptyTitle}>No plans yet</Text>
          <Text style={st.emptySub}>Add each option the space sells: hot desk, dedicated desk, private cabin, day pass…</Text>
        </View>
      ) : null}
      {form.plans.map((pl, i) => (
        <Group
          key={i}
          title={`Plan ${i + 1}`}
          right={(
            <Pressable onPress={() => remove(i)} hitSlop={8} style={st.iconBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          )}
        >
          <PickerField label="What is it?" required value={pl.type} options={options.planTypes} onChange={(id) => setPlan(i, { type: id })} placeholder="e.g. Hot desk" />
          <TextField label="Price" prefix="₹" value={pl.price} onChange={(v) => setPlan(i, { price: v.replace(/[^\d]/g, '') })} keyboardType="number-pad" placeholder="e.g. 6500" />
          <ChoiceChips label="Per" options={durations} value={pl.per} onChange={(v) => setPlan(i, { per: v })} />
          <ToggleRow label="Show on website" value={pl.show} onChange={(v) => setPlan(i, { show: v })} />
          <SingleImageField label="Plan photo" hint="optional" value={pl.image} onChange={(img) => setPlan(i, { image: img })} />
        </Group>
      ))}
      <Pressable style={st.addBtn} onPress={add}>
        <Ionicons name="add-circle-outline" size={20} color={colors.brandInk} />
        <Text style={st.addText}>Add a plan</Text>
      </Pressable>
    </>
  );
}

/* ---------- 4. Hours ---------- */
const PRESETS = [
  { label: 'Mon–Fri', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
  { label: 'Mon–Sat', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
  { label: 'All 7 days', days: WEEKDAYS.map((d) => d.key) },
];

export function HoursStep({ form, setForm }) {
  const setDay = (day, changes) => setForm((p) => ({ ...p, hours: { ...p.hours, [day]: { ...p.hours[day], ...changes } } }));
  const applyPreset = (days, allDay = false) => setForm((p) => {
    const hours = {};
    WEEKDAYS.forEach(({ key }) => {
      const cur = p.hours[key] || {};
      hours[key] = { ...cur, open: days.includes(key), allDay, from: cur.from || '9:00 AM', to: cur.to || '8:00 PM' };
    });
    return { ...p, hours };
  });
  const copyMonday = () => setForm((p) => {
    const m = p.hours.monday;
    const hours = { ...p.hours };
    WEEKDAYS.forEach(({ key }) => { if (hours[key]?.open) hours[key] = { ...hours[key], from: m.from, to: m.to, allDay: m.allDay }; });
    return { ...p, hours };
  });

  return (
    <>
      <Label text="Quick fill" />
      <View style={[f.chips, { marginBottom: 16 }]}>
        {PRESETS.map((pr) => (
          <Pressable key={pr.label} style={f.chip} onPress={() => applyPreset(pr.days)}>
            <Text style={f.chipText}>{pr.label}</Text>
          </Pressable>
        ))}
        <Pressable style={f.chip} onPress={() => applyPreset(WEEKDAYS.map((d) => d.key), true)}>
          <Text style={f.chipText}>Open 24×7</Text>
        </Pressable>
        <Pressable style={f.chip} onPress={copyMonday}>
          <Ionicons name="copy-outline" size={14} color={colors.ink} />
          <Text style={f.chipText}>Monday's time to all</Text>
        </Pressable>
      </View>

      {WEEKDAYS.map(({ key, label }) => {
        const h = form.hours[key] || {};
        return (
          <View key={key} style={[st.day, !h.open && st.dayClosed]}>
            <View style={st.dayHead}>
              <Text style={st.dayName}>{label}</Text>
              <Pressable style={[st.dayPill, h.open && st.dayPillOn]} onPress={() => setDay(key, { open: !h.open })}>
                <Text style={[st.dayPillText, h.open && { color: colors.brandInk }]}>{h.open ? 'Open' : 'Closed'}</Text>
              </Pressable>
            </View>
            {h.open ? (
              <>
                <Pressable style={st.allDay} onPress={() => setDay(key, { allDay: !h.allDay })}>
                  <Ionicons name={h.allDay ? 'checkbox' : 'square-outline'} size={20} color={h.allDay ? colors.brand : colors.muted} />
                  <Text style={st.allDayText}>Open 24 hours</Text>
                </Pressable>
                {!h.allDay ? (
                  <Row>
                    <Col><PickerField label="From" compact value={timeValue(h.from)} options={TIME_LIST} onChange={(v) => setDay(key, { from: v })} /></Col>
                    <Col><PickerField label="To" compact value={timeValue(h.to)} options={TIME_LIST} onChange={(v) => setDay(key, { to: v })} /></Col>
                  </Row>
                ) : null}
              </>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

/* ---------- 5. Amenities ---------- */
const AMENITY_GROUPS = [
  { key: 'facilities', label: 'Facilities' },
  { key: 'recreational', label: 'Recreational' },
  { key: 'others', label: 'Others' },
];

export function AmenitiesStep({ form, setForm, options }) {
  const [q, setQ] = useState('');
  const selected = new Set(form.amenities);
  const toggle = (id) => setForm((p) => ({
    ...p,
    amenities: p.amenities.includes(id) ? p.amenities.filter((x) => x !== id) : [...p.amenities, id],
  }));
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? options.amenities.filter((a) => a.name.toLowerCase().includes(t)) : options.amenities;
  }, [options.amenities, q]);

  return (
    <>
      <View style={st.countRow}>
        <Text style={st.countText}>{selected.size} selected</Text>
        {selected.size ? (
          <Pressable onPress={() => setForm((p) => ({ ...p, amenities: [] }))} hitSlop={8}>
            <Text style={st.clear}>Clear all</Text>
          </Pressable>
        ) : null}
      </View>
      {options.amenities.length > 12 ? (
        <View style={[f.search, { marginHorizontal: 0, marginTop: 0 }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput style={f.searchInput} value={q} onChangeText={setQ} placeholder="Search amenities" placeholderTextColor={colors.faint} />
        </View>
      ) : null}
      {AMENITY_GROUPS.map((g) => {
        const rows = list.filter((a) => (a.category || 'others') === g.key);
        if (!rows.length) return null;
        return (
          <View key={g.key} style={{ marginBottom: 16 }}>
            <Text style={st.subhead}>{g.label}</Text>
            <View style={f.chips}>
              {rows.map((a) => {
                const on = selected.has(a.id);
                return (
                  <Pressable key={a.id} style={[f.chip, on && f.chipOn]} onPress={() => toggle(a.id)}>
                    <Ionicons name={on ? 'checkmark-circle' : 'add-circle-outline'} size={15} color={on ? colors.brandInk : colors.muted} />
                    <Text style={[f.chipText, on && f.chipTextOn]}>{a.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
      {!list.length ? <Text style={st.emptySub}>No amenities match.</Text> : null}
    </>
  );
}

/* ---------- 6. Photos ---------- */
let tempSeq = 0;

export function PhotosStep({ form, setForm }) {
  const [captionFor, setCaptionFor] = useState(null);
  const photos = form.photos;
  const uploadingCount = photos.filter((p) => p.uploading).length;

  const upload = async (assets) => {
    const temps = assets.map((a) => ({ tempId: `t${++tempSeq}`, url: a.uri, uploading: true, title: '' }));
    setForm((p) => ({ ...p, photos: [...p.photos, ...temps] }));
    // One at a time keeps each upload small on mobile data.
    for (let i = 0; i < assets.length; i++) {
      const t = temps[i];
      try {
        const [up] = await mobileApi.uploadSpaceImages([assetToFile(assets[i], i)]);
        setForm((p) => ({ ...p, photos: p.photos.map((ph) => (ph.tempId === t.tempId ? { ...up, title: '' } : ph)) }));
      } catch (err) {
        setForm((p) => ({ ...p, photos: p.photos.filter((ph) => ph.tempId !== t.tempId) }));
        Alert.alert('Upload failed', err.message || 'A photo could not be uploaded.');
      }
    }
  };

  const fromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Photos access needed', 'Allow photo library access to add photos.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: IMAGE_MEDIA_TYPES, allowsMultipleSelection: true, selectionLimit: 20, quality: 0.85 });
    if (!res.canceled && res.assets?.length) upload(res.assets);
  };
  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Camera access needed', 'Allow camera access to take photos.'); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: IMAGE_MEDIA_TYPES, quality: 0.85 });
    if (!res.canceled && res.assets?.length) upload(res.assets);
  };

  const move = (i, d) => setForm((p) => {
    const next = [...p.photos];
    const j = i + d;
    if (j < 0 || j >= next.length) return p;
    [next[i], next[j]] = [next[j], next[i]];
    return { ...p, photos: next };
  });
  const makeCover = (i) => setForm((p) => {
    const next = [...p.photos];
    const [it] = next.splice(i, 1);
    return { ...p, photos: [it, ...next] };
  });
  const remove = (i) => Alert.alert('Remove photo', 'Remove this photo from the space?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => setForm((p) => ({ ...p, photos: p.photos.filter((_, j) => j !== i) })) },
  ]);
  const setTitle = (i, title) => setForm((p) => ({ ...p, photos: p.photos.map((ph, j) => (j === i ? { ...ph, title } : ph)) }));

  return (
    <>
      <View style={st.photoActions}>
        <Pressable style={st.photoBtn} onPress={fromLibrary}>
          <Ionicons name="images-outline" size={20} color={colors.brandInk} />
          <Text style={st.addText}>Add from gallery</Text>
        </Pressable>
        <Pressable style={st.photoBtn} onPress={fromCamera}>
          <Ionicons name="camera-outline" size={20} color={colors.brandInk} />
          <Text style={st.addText}>Take photo</Text>
        </Pressable>
      </View>
      {uploadingCount ? (
        <View style={st.infoBox}>
          <ActivityIndicator size="small" color={colors.brand} />
          <Text style={st.infoText}>Uploading {uploadingCount} photo{uploadingCount > 1 ? 's' : ''}… keep this screen open.</Text>
        </View>
      ) : null}
      {!photos.length ? (
        <View style={st.empty}>
          <Ionicons name="images-outline" size={30} color={colors.faint} />
          <Text style={st.emptyTitle}>No photos yet</Text>
          <Text style={st.emptySub}>Add clear photos of the reception, desks, cabins and meeting rooms.</Text>
        </View>
      ) : (
        <Text style={[st.emptySub, { textAlign: 'left', marginBottom: 10 }]}>{photos.length} photo{photos.length > 1 ? 's' : ''} · use the arrows to change the order</Text>
      )}
      {photos.map((ph, i) => (
        <View key={ph.id || ph.tempId} style={st.photo}>
          <View>
            <Image source={{ uri: ph.url }} style={st.photoImg} />
            {i === 0 ? <Text style={st.cover}>Cover</Text> : null}
            {ph.uploading ? <View style={st.photoBusy}><ActivityIndicator color="#fff" /></View> : null}
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <View style={st.photoTools}>
              <Pressable style={[st.iconBtn, i === 0 && st.off]} disabled={i === 0} onPress={() => move(i, -1)}><Ionicons name="arrow-up" size={17} color={colors.ink} /></Pressable>
              <Pressable style={[st.iconBtn, i === photos.length - 1 && st.off]} disabled={i === photos.length - 1} onPress={() => move(i, 1)}><Ionicons name="arrow-down" size={17} color={colors.ink} /></Pressable>
              {i > 0 ? <Pressable style={st.iconBtn} onPress={() => makeCover(i)}><Ionicons name="star-outline" size={17} color={colors.ink} /></Pressable> : null}
              <Pressable style={[st.iconBtn, { borderColor: '#F3C4C4' }]} onPress={() => remove(i)}><Ionicons name="trash-outline" size={17} color={colors.danger} /></Pressable>
            </View>
            {captionFor === i ? (
              <TextInput
                style={st.caption}
                value={ph.title}
                onChangeText={(v) => setTitle(i, v)}
                placeholder="e.g. Reception, private cabin"
                placeholderTextColor={colors.faint}
                autoFocus
                onBlur={() => setCaptionFor(null)}
              />
            ) : (
              <Pressable onPress={() => setCaptionFor(i)} disabled={ph.uploading}>
                <Text style={[st.captionText, !ph.title && { color: colors.faint }]} numberOfLines={1}>{ph.title || 'Add a caption'}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </>
  );
}

/* ---------- 7. Contacts ---------- */
export function ContactsStep({ form, setForm, patch }) {
  const SC = form.spaceContact;
  const setSC = (changes) => setForm((p) => ({ ...p, spaceContact: { ...p.spaceContact, ...changes } }));
  const setC = (i, changes) => setForm((p) => ({ ...p, contacts: p.contacts.map((c, j) => (j === i ? { ...c, ...changes } : c)) }));
  const addC = () => setForm((p) => ({ ...p, contacts: [...p.contacts, { designation: '', name: '', phone: '' }] }));
  const removeC = (i) => setForm((p) => ({ ...p, contacts: p.contacts.filter((_, j) => j !== i) }));
  const setSocial = (k, v) => setForm((p) => ({ ...p, social: { ...p.social, [k]: v } }));

  return (
    <>
      <Group title="Main contact" hint="The person a client should call">
        <TextField label="Name" value={SC.name} onChange={(v) => setSC({ name: v })} placeholder="e.g. Riya Sharma" />
        <Row>
          <Col><TextField label="Phone" value={SC.phone} onChange={(v) => setSC({ phone: v })} keyboardType="phone-pad" placeholder="98xxxxxxxx" /></Col>
          <Col><TextField label="Email" value={SC.email} onChange={(v) => setSC({ email: v })} keyboardType="email-address" placeholder="name@space.com" /></Col>
        </Row>
        <ToggleRow label="Show this contact on the website" value={SC.showOnWebsite} onChange={(v) => setSC({ showOnWebsite: v })} />
      </Group>

      <Group
        title="Other contacts"
        hint="Centre manager, community manager… (internal)"
      >
        {form.contacts.map((c, i) => (
          <View key={i} style={st.contact}>
            <View style={st.contactHead}>
              <Text style={st.subhead}>Contact {i + 1}</Text>
              <Pressable onPress={() => removeC(i)} hitSlop={8}><Ionicons name="close-circle" size={20} color={colors.faint} /></Pressable>
            </View>
            <TextField label="Role" value={c.designation} onChange={(v) => setC(i, { designation: v })} placeholder="e.g. Centre manager" />
            <Row>
              <Col><TextField label="Name" value={c.name} onChange={(v) => setC(i, { name: v })} /></Col>
              <Col><TextField label="Phone" value={c.phone} onChange={(v) => setC(i, { phone: v })} keyboardType="phone-pad" /></Col>
            </Row>
          </View>
        ))}
        <Pressable style={st.addBtn} onPress={addC}>
          <Ionicons name="person-add-outline" size={18} color={colors.brandInk} />
          <Text style={st.addText}>Add contact</Text>
        </Pressable>
      </Group>

      <Group title="Space email & website">
        <TextField label="Email" value={form.email} onChange={(v) => patch('email', v)} keyboardType="email-address" placeholder="hello@space.com" />
        <TextField label="Website" value={form.website} onChange={(v) => patch('website', v)} keyboardType="url" placeholder="https://…" />
      </Group>

      <Group title="Social media" hint="Paste the full page links">
        <TextField label="Instagram" value={form.social.instagram} onChange={(v) => setSocial('instagram', v)} keyboardType="url" placeholder="https://instagram.com/…" />
        <TextField label="Facebook" value={form.social.facebook} onChange={(v) => setSocial('facebook', v)} keyboardType="url" placeholder="https://facebook.com/…" />
        <TextField label="X (Twitter)" value={form.social.twitter} onChange={(v) => setSocial('twitter', v)} keyboardType="url" placeholder="https://x.com/…" />
      </Group>
    </>
  );
}

/* ---------- 8. About ---------- */
export function AboutStep({ form, patch }) {
  return (
    <>
      <TextField
        label="Description"
        hint="Leave an empty line between paragraphs"
        value={form.descriptionText}
        onChange={(v) => patch('descriptionText', v)}
        placeholder="What makes this space good: location, interiors, facilities, who it suits…"
        multiline
        lines={10}
      />
      <TextField
        label="New description"
        hint="Used on the newer website pages"
        value={form.newDescriptionText}
        onChange={(v) => patch('newDescriptionText', v)}
        placeholder="Optional"
        multiline
        lines={6}
      />
    </>
  );
}

/* ---------- 9. SEO ---------- */
const SEO_BLOCKS = [
  { key: 'seo', title: 'Coworking page', hint: 'Google title and description for this space' },
  { key: 'newSeo', title: 'New website page', hint: 'Same, for the newer pages' },
  { key: 'virtualSeo', title: 'Virtual office page', hint: 'Only if the space sells virtual office' },
];

export function SeoStep({ form, setForm }) {
  const [open, setOpen] = useState('seo');
  const [social, setSocial] = useState({});
  const setS = (block, changes) => setForm((p) => ({ ...p, [block]: { ...p[block], ...changes } }));

  return (
    <>
      <View style={st.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
        <Text style={st.infoText}>Optional. Leave blank and the website uses the space name and description.</Text>
      </View>
      {SEO_BLOCKS.filter((b) => form.vertical !== 'managed-office' || b.key !== 'virtualSeo').map((b) => {
        const s = form[b.key];
        const isOpen = open === b.key;
        const filled = Boolean(s.title || s.description);
        return (
          <View key={b.key} style={f.group}>
            <Pressable style={f.groupHead} onPress={() => setOpen(isOpen ? null : b.key)}>
              <View style={{ flex: 1 }}>
                <Text style={f.groupTitle}>{form.vertical === 'managed-office' && b.key === 'seo' ? 'Office page' : b.title}</Text>
                <Text style={f.groupHint}>{filled ? s.title || 'Description added' : b.hint}</Text>
              </View>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
            </Pressable>
            {isOpen ? (
              <>
                <TextField label="Page title" hint={`${(s.title || '').length}/60`} value={s.title} onChange={(v) => setS(b.key, { title: v })} placeholder="e.g. Coworking Space in Sector 62, Noida" />
                <TextField label="Page description" hint={`${(s.description || '').length}/160`} value={s.description} onChange={(v) => setS(b.key, { description: v })} multiline lines={3} />
                <TextField label="Keywords" hint="comma separated" value={s.keywords} onChange={(v) => setS(b.key, { keywords: v })} placeholder="coworking noida, office space sector 62" />
                <ToggleRow label="Show this page on Google" hint="Turn off to hide it from search" value={s.index} onChange={(v) => setS(b.key, { index: v })} />
                <Pressable style={st.moreToggle} onPress={() => setSocial((m) => ({ ...m, [b.key]: !m[b.key] }))}>
                  <Ionicons name={social[b.key] ? 'chevron-up' : 'chevron-down'} size={16} color={colors.brandInk} />
                  <Text style={st.clear}>When shared on WhatsApp, Facebook or X</Text>
                </Pressable>
                {social[b.key] ? (
                  <>
                    <Text style={st.subhead}>Facebook / WhatsApp</Text>
                    <TextField label="Title" value={s.ogTitle} onChange={(v) => setS(b.key, { ogTitle: v })} />
                    <TextField label="Description" value={s.ogDescription} onChange={(v) => setS(b.key, { ogDescription: v })} multiline lines={2} />
                    <SingleImageField label="Image" value={s.ogImage} onChange={(img) => setS(b.key, { ogImage: img })} />
                    <Text style={st.subhead}>X (Twitter)</Text>
                    <TextField label="Title" value={s.twitterTitle} onChange={(v) => setS(b.key, { twitterTitle: v })} />
                    <TextField label="Description" value={s.twitterDescription} onChange={(v) => setS(b.key, { twitterDescription: v })} multiline lines={2} />
                    <SingleImageField label="Image" value={s.twitterImage} onChange={(img) => setS(b.key, { twitterImage: img })} />
                  </>
                ) : null}
              </>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

const st = StyleSheet.create({
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12,
    backgroundColor: colors.surface2, marginBottom: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.muted, lineHeight: 18 },
  indent: { paddingLeft: 12, marginTop: -2, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: colors.brandSoft },
  empty: {
    alignItems: 'center', gap: 6, padding: 22, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13,
    borderRadius: 12, borderWidth: 1, borderColor: colors.brand, backgroundColor: colors.brandSoft, borderStyle: 'dashed',
  },
  addText: { fontSize: 14.5, fontWeight: '800', color: colors.brandInk },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  off: { opacity: 0.35 },
  day: {
    backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 12, marginBottom: 10, gap: 10,
  },
  dayClosed: { backgroundColor: colors.surface2 },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { fontSize: 15.5, fontWeight: '800', color: colors.ink },
  dayPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  dayPillOn: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  dayPillText: { fontSize: 13, fontWeight: '800', color: colors.muted },
  allDay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  allDayText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  countText: { fontSize: 13.5, fontWeight: '700', color: colors.muted },
  clear: { fontSize: 13.5, fontWeight: '800', color: colors.brandInk },
  subhead: { fontSize: 12, fontWeight: '800', color: colors.faint, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  photoActions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13,
    borderRadius: 12, borderWidth: 1, borderColor: colors.brand, backgroundColor: colors.brandSoft,
  },
  photo: {
    flexDirection: 'row', gap: 12, padding: 10, borderRadius: 14, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10, alignItems: 'center',
  },
  photoImg: { width: 110, height: 76, borderRadius: 10, backgroundColor: colors.border },
  cover: {
    position: 'absolute', left: 6, top: 6, backgroundColor: colors.brand, color: '#fff', fontSize: 10.5,
    fontWeight: '800', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },
  photoBusy: { ...StyleSheet.absoluteFillObject, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  photoTools: { flexDirection: 'row', gap: 6 },
  caption: {
    borderWidth: 1, borderColor: colors.brand, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, color: colors.ink, backgroundColor: colors.surface,
  },
  captionText: { fontSize: 13.5, color: colors.ink, paddingVertical: 4 },
  contact: { paddingBottom: 6, marginBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  contactHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moreToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, marginBottom: 6 },
});
