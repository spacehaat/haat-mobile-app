import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../constants/theme';
import { VERTICALS } from '../../constants/inventory';
import { mobileApi } from '../../lib/api';
import { DURATION_LABELS } from '../../lib/spaceForm';
import {
  TextField, ToggleRow, ChoiceChips, PickerField, SingleImageField, Group, Row, Col, Label,
} from './fields';

const V = VERTICALS['managed-office'];
const digits = (v) => String(v).replace(/[^\d]/g, '');

/* ---------- Managed office: basics ---------- */
export function MoBasicsStep({ form, patch, options, isEdit, canEnable }) {
  return (
    <>
      <TextField label="Office name" required value={form.name} onChange={(v) => patch('name', v)} placeholder="e.g. Smartworks One Horizon Center" />
      <PickerField
        label="Brand / operator"
        hint="optional"
        value={form.brand}
        valueLabel={form.labels.brand}
        options={options.brands}
        allowClear
        onChange={(id, o) => patch('brand', id, { labels: { ...form.labels, brand: o?.name || '' } })}
        placeholder="Choose brand"
      />
      <ChoiceChips
        label="Centre type"
        options={(options.centreTypes || []).map((c) => ({ value: c.key, label: c.label }))}
        value={form.centreType}
        onChange={(v) => patch('centreType', v)}
      />
      <Row>
        <Col><TextField label="Total seats" value={form.seats} onChange={(v) => patch('seats', digits(v))} keyboardType="number-pad" placeholder="e.g. 400" /></Col>
        <Col />
      </Row>
      <ToggleRow icon="rocket-outline" label="New launch" hint="Shows a “New launch” badge on the website" value={form.isNewLaunch} onChange={(v) => patch('isNewLaunch', v)} />

      <Group title="On the website">
        {canEnable ? (
          <ToggleRow icon="eye-outline" label="Show on website" hint="Turn off to hide the office without deleting it" value={form.isActive} onChange={(v) => patch('isActive', v)} />
        ) : null}
        <View style={st.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
          <Text style={st.infoText}>
            {canEnable
              ? 'Approve or reject the office from its listing page.'
              : isEdit ? 'Only staff allowed to enable properties can change the status.' : 'New offices are saved as Pending until someone allowed to enable properties approves them.'}
          </Text>
        </View>
        {isEdit ? (
          <TextField
            label="Web address"
            hint="spacewallah.com/managed-office/…"
            value={form.slug}
            onChange={(v) => patch('slug', v.toLowerCase().replace(/\s+/g, '-'))}
            autoCapitalize="none"
          />
        ) : null}
      </Group>
    </>
  );
}

/* ---------- Managed office: location ---------- */
export function MoLocationStep({ form, setForm, options }) {
  const L = form.location;
  const setLoc = (changes, labels = {}) => setForm((p) => ({
    ...p, location: { ...p.location, ...changes }, labels: { ...p.labels, ...labels },
  }));
  const setMetro = (changes) => setForm((p) => ({ ...p, metro: { ...p.metro, ...changes } }));
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
            emptyText="No areas for this city yet. Type the area name below instead."
            onChange={(id, o) => setLoc({ microLocation: id, areaText: L.areaText || o?.name || '' }, { microLocation: o?.name || '' })}
          />
        </Col>
      </Row>
      <TextField label="Area name shown on website" hint="used in the web address" value={L.areaText} onChange={(v) => setLoc({ areaText: v })} placeholder="e.g. Golf Course Road" />
      <TextField label="Building name" value={L.buildingName} onChange={(v) => setLoc({ buildingName: v })} placeholder="e.g. One Horizon Center" />
      <TextField label="Full address" value={L.address} onChange={(v) => setLoc({ address: v })} placeholder="Plot, sector, road" multiline lines={2} />
      <Row>
        <Col><TextField label="Floor" value={L.floor} onChange={(v) => setLoc({ floor: v })} placeholder="e.g. 5th–8th" /></Col>
        <Col><TextField label="PIN code" value={L.postalCode} onChange={(v) => setLoc({ postalCode: digits(v) })} keyboardType="number-pad" maxLength={6} /></Col>
      </Row>
      <Row>
        <Col><TextField label="Landmark" value={L.landmark} onChange={(v) => setLoc({ landmark: v })} placeholder="e.g. Near DLF Cyber Hub" /></Col>
        <Col><TextField label="Distance" value={L.landmarkDistance} onChange={(v) => setLoc({ landmarkDistance: v })} placeholder="e.g. 1 km" /></Col>
      </Row>

      <Group title="Nearby metro">
        <ToggleRow icon="train-outline" label="Near a metro station" value={form.metro.on} onChange={(v) => setMetro({ on: v })} />
        {form.metro.on ? (
          <Row>
            <Col><TextField label="Station" value={form.metro.name} onChange={(v) => setMetro({ name: v })} placeholder="e.g. Sector 42-43" /></Col>
            <Col><TextField label="Distance" value={form.metro.distance} onChange={(v) => setMetro({ distance: v })} placeholder="e.g. 400 m" /></Col>
          </Row>
        ) : null}
      </Group>

      <Group title="Map location" hint="Copy from Google Maps: long-press the place, tap the numbers">
        <Row>
          <Col><TextField label="Latitude" value={L.latitude} onChange={(v) => setLoc({ latitude: v.replace(/[^\d.-]/g, '') })} keyboardType="numbers-and-punctuation" placeholder="28.4595" /></Col>
          <Col><TextField label="Longitude" value={L.longitude} onChange={(v) => setLoc({ longitude: v.replace(/[^\d.-]/g, '') })} keyboardType="numbers-and-punctuation" placeholder="77.0266" /></Col>
        </Row>
      </Group>
    </>
  );
}

/* ---------- Managed office: seat plans ---------- */
export function MoPlansStep({ form, setForm, options }) {
  const setPlan = (i, changes) => setForm((p) => ({ ...p, plans: p.plans.map((pl, j) => (j === i ? { ...pl, ...changes } : pl)) }));
  const add = () => setForm((p) => ({
    ...p,
    plans: [...p.plans, { seatType: '', type: options.defaultPlanType || '', price: '', per: 'month', show: true, image: null }],
  }));
  const remove = (i) => Alert.alert('Remove plan', 'Remove this seat plan?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => setForm((p) => ({ ...p, plans: p.plans.filter((_, j) => j !== i) })) },
  ]);
  const durations = (options.durations || ['month']).map((d) => ({ value: d, label: DURATION_LABELS[d] || d }));
  const seatTypes = options.seatTypes || [];

  return (
    <>
      <View style={st.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={V.color} />
        <Text style={st.infoText}>Add one plan per fit-out type. Leave the price empty to show “Price on request”.</Text>
      </View>
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
          <Label text="Seat type" required />
          <View style={st.seatTypes}>
            {seatTypes.map((t) => {
              const on = pl.seatType === t.key;
              return (
                <Pressable key={t.key} style={[st.seatType, on && { borderColor: V.color, backgroundColor: V.soft }]} onPress={() => setPlan(i, { seatType: t.key })}>
                  <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={18} color={on ? V.color : colors.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={[st.seatTypeTitle, on && { color: V.color }]}>{t.label}</Text>
                    <Text style={st.seatTypeHint}>{SEAT_HINTS[t.key]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <TextField label="Price per seat" hint="empty = on request" prefix="₹" value={pl.price} onChange={(v) => setPlan(i, { price: digits(v) })} keyboardType="number-pad" placeholder="e.g. 12000" />
          <ChoiceChips label="Per" options={durations} value={pl.per} onChange={(v) => setPlan(i, { per: v })} />
          <PickerField label="Plan category" hint="usually Office Space" value={pl.type} options={options.planTypes} onChange={(id) => setPlan(i, { type: id })} />
          <ToggleRow label="Show on website" value={pl.show} onChange={(v) => setPlan(i, { show: v })} />
          <SingleImageField label="Plan photo" hint="optional" value={pl.image} onChange={(img) => setPlan(i, { image: img })} />
        </Group>
      ))}
      <Pressable style={st.addBtn} onPress={add}>
        <Ionicons name="add-circle-outline" size={20} color={V.color} />
        <Text style={st.addText}>Add a seat plan</Text>
      </Pressable>
    </>
  );
}
const SEAT_HINTS = {
  ready_to_move_in: 'Furnished, plug and play',
  warm_shell: 'Basic fit-out done, client adds furniture',
  bare_shell: 'Empty floor, client does the fit-out',
};

/* ---------- Managed office: building & lease ---------- */
export function BuildingStep({ form, setForm }) {
  const setB = (changes) => setForm((p) => ({ ...p, building: { ...p.building, ...changes } }));
  const setLease = (changes) => setForm((p) => ({ ...p, lease: { ...p.lease, ...changes } }));
  const setRating = (changes) => setForm((p) => ({ ...p, rating: { ...p.rating, ...changes } }));
  const setFloor = (i, changes) => setForm((p) => ({
    ...p, building: { ...p.building, floors: p.building.floors.map((f, j) => (j === i ? { ...f, ...changes } : f)) },
  }));
  const addFloor = () => setForm((p) => ({ ...p, building: { ...p.building, floors: [...p.building.floors, { floor: '', area: '', seats: '', plan: null }] } }));
  const removeFloor = (i) => setForm((p) => ({ ...p, building: { ...p.building, floors: p.building.floors.filter((_, j) => j !== i) } }));

  return (
    <>
      <Group title="Lease terms" hint="What a client must commit to">
        <Row>
          <Col><TextField label="Minimum seats" value={form.lease.minSeats} onChange={(v) => setLease({ minSeats: digits(v) })} keyboardType="number-pad" placeholder="e.g. 25" /></Col>
          <Col><TextField label="Lock-in" suffix="months" value={form.lease.minMonths} onChange={(v) => setLease({ minMonths: digits(v) })} keyboardType="number-pad" placeholder="e.g. 12" /></Col>
        </Row>
      </Group>

      <Group title="Building">
        <Row>
          <Col><TextField label="Total floors" value={form.building.totalFloors} onChange={(v) => setB({ totalFloors: digits(v) })} keyboardType="number-pad" /></Col>
          <Col><TextField label="Seats in building" value={form.building.totalSeats} onChange={(v) => setB({ totalSeats: digits(v) })} keyboardType="number-pad" /></Col>
        </Row>
        <TextField label="Super area" suffix="sq ft" value={form.building.superArea} onChange={(v) => setB({ superArea: digits(v) })} keyboardType="number-pad" placeholder="e.g. 50000" />
      </Group>

      <Group title="Floors on offer" hint="Each floor a client can take">
        {form.building.floors.map((f, i) => (
          <View key={i} style={st.floor}>
            <View style={st.floorHead}>
              <Text style={st.floorTitle}>Floor {f.floor || i + 1}</Text>
              <Pressable onPress={() => removeFloor(i)} hitSlop={8}><Ionicons name="close-circle" size={20} color={colors.faint} /></Pressable>
            </View>
            <Row>
              <Col><TextField label="Floor no." value={f.floor} onChange={(v) => setFloor(i, { floor: digits(v) })} keyboardType="number-pad" /></Col>
              <Col><TextField label="Area" suffix="sq ft" value={f.area} onChange={(v) => setFloor(i, { area: digits(v) })} keyboardType="number-pad" /></Col>
              <Col><TextField label="Seats" value={f.seats} onChange={(v) => setFloor(i, { seats: digits(v) })} keyboardType="number-pad" /></Col>
            </Row>
            <SingleImageField label="Floor plan" hint="optional" value={f.plan} onChange={(img) => setFloor(i, { plan: img })} />
          </View>
        ))}
        <Pressable style={st.addBtn} onPress={addFloor}>
          <Ionicons name="add-circle-outline" size={20} color={V.color} />
          <Text style={st.addText}>Add a floor</Text>
        </Pressable>
      </Group>

      <Group title="Rating" hint="optional, e.g. from Google">
        <Row>
          <Col><TextField label="Average" hint="out of 5" value={form.rating.average} onChange={(v) => setRating({ average: v.replace(/[^\d.]/g, '') })} keyboardType="decimal-pad" maxLength={4} /></Col>
          <Col><TextField label="No. of reviews" value={form.rating.total} onChange={(v) => setRating({ total: digits(v) })} keyboardType="number-pad" /></Col>
        </Row>
        <TextField label="Source" value={form.rating.source} onChange={(v) => setRating({ source: v })} placeholder="e.g. GOOGLE" autoCapitalize="characters" />
      </Group>
    </>
  );
}

const st = StyleSheet.create({
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12,
    backgroundColor: V.soft, marginBottom: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 18 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  seatTypes: { gap: 8, marginBottom: 14 },
  seatType: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  seatTypeTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  seatTypeHint: { fontSize: 12, color: colors.muted, marginTop: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13,
    borderRadius: 12, borderWidth: 1, borderColor: V.color, backgroundColor: V.soft, borderStyle: 'dashed',
  },
  addText: { fontSize: 14.5, fontWeight: '800', color: V.color },
  floor: { paddingBottom: 8, marginBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  floorHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  floorTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
});
