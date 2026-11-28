import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../constants/theme';
import { mobileApi } from '../../lib/api';
import { TIME_OPTIONS, sameTime } from '../../lib/spaceForm';
import {
  TextField, ToggleRow, ChoiceChips, PickerField, Group, Row, Col, Label, styles as f,
} from './fields';
import VerificationBox from './VerificationBox';

/**
 * PG / coliving form (website `/coliving`). Choices use the values already stored on PGs, so new and
 * edited PGs match the rest of the website.
 */
const PG_COLOR = '#C2410C';
const TIME_LIST = TIME_OPTIONS.map((t) => ({ id: t, name: t }));
const timeValue = (v) => TIME_OPTIONS.find((t) => sameTime(t, v)) || v;

/** Tap to add / remove values; values saved earlier but not in the list still show (and can be removed). */
function MultiChips({ label, hint, options, value, onChange }) {
  const selected = new Set(value);
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const toggle = (v) => onChange(selected.has(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <View style={f.field}>
      {label ? <Label text={label} hint={hint || `${selected.size} selected`} /> : null}
      <View style={f.chips}>
        {all.map((v) => {
          const on = selected.has(v);
          return (
            <Pressable key={v} style={[f.chip, on && f.chipOn]} onPress={() => toggle(v)}>
              <Ionicons name={on ? 'checkmark-circle' : 'add-circle-outline'} size={15} color={on ? colors.brandInk : colors.muted} />
              <Text style={[f.chipText, on && f.chipTextOn]}>{v}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}


/* ---------- 1. Basics ---------- */
export function PgBasicsStep({ form, patch, options, isEdit, canEnable }) {
  const auto = form.googleAuto || {};
  return (
    <>
      <TextField label="PG name" required value={form.name} onChange={(v) => patch('name', v)} placeholder="e.g. Second Homes PG" />
      <ChoiceChips label="PG for" required options={options.genders} value={form.gender} onChange={(v) => patch('gender', v)} />
      <ChoiceChips label="Preferred guests" options={options.guests} value={form.guests} onChange={(v) => patch('guests', v)} />
      <ChoiceChips label="Listed by" options={options.postedBy} value={form.postedBy} onChange={(v) => patch('postedBy', v)} />
      <Row>
        <Col><TextField label="Contact number" value={form.contactNumber} onChange={(v) => patch('contactNumber', v.replace(/[^\d+]/g, ''))} keyboardType="phone-pad" placeholder="Owner / manager phone" maxLength={15} /></Col>
        <Col><TextField label="Rating" hint="out of 5" value={form.rating} onChange={(v) => patch('rating', v.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" placeholder="e.g. 4.2" maxLength={4} /></Col>
      </Row>
      <TextField label="Contact email" value={form.contactEmail} onChange={(v) => patch('contactEmail', v.trim())} keyboardType="email-address" placeholder="Optional" />

      {isEdit && form.id ? <VerificationBox listingId={form.id} value={form.verification} color={PG_COLOR} /> : null}

      <Group title="On the website">
        {canEnable ? (
          <ToggleRow icon="eye-outline" label="Show on website" hint="Turn off to hide the PG without deleting it" value={form.isActive} onChange={(v) => patch('isActive', v)} />
        ) : null}
        {!isEdit ? (
          <View style={st.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
            <Text style={st.infoText}>New PGs are saved as In progress. Approve them from the listing page after saving.</Text>
          </View>
        ) : null}
        <ChoiceChips
          label="Google indexing"
          hint={auto.ok === false && auto.note ? `Automatic check: ${auto.note}` : 'Automatic keeps PGs with their own description and photos in Google'}
          options={options.googleIndex.map((o) => ({
            value: o.key,
            label: o.key === 'auto' ? `Automatic${auto.ok === true ? ' (in Google)' : auto.ok === false ? ' (not in Google)' : ''}` : o.label,
          }))}
          value={form.googleIndex}
          onChange={(v) => patch('googleIndex', v)}
        />
        {isEdit ? (
          <TextField
            label="Web address"
            hint="spacewallah.com/coliving/…"
            value={form.slug}
            onChange={(v) => patch('slug', v.toLowerCase().replace(/\s+/g, '-'))}
            autoCapitalize="none"
            placeholder="pg-name-in-area-city"
          />
        ) : null}
      </Group>
    </>
  );
}

/* ---------- 2. Location ---------- */
export function PgLocationStep({ form, setForm, options }) {
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
      <TextField label="Full address" value={L.address} onChange={(v) => setLoc({ address: v })} placeholder="House / plot, street, sector" multiline lines={2} />
      <TextField label="Plot / house no." value={L.street} onChange={(v) => setLoc({ street: v })} placeholder="e.g. Plot 137" />
      <Group title="Map location" hint="Copy from Google Maps: long-press the place, tap the numbers">
        <Row>
          <Col><TextField label="Latitude" value={L.latitude} onChange={(v) => setLoc({ latitude: v.replace(/[^\d.-]/g, '') })} keyboardType="numbers-and-punctuation" placeholder="28.6139" /></Col>
          <Col><TextField label="Longitude" value={L.longitude} onChange={(v) => setLoc({ longitude: v.replace(/[^\d.-]/g, '') })} keyboardType="numbers-and-punctuation" placeholder="77.2090" /></Col>
        </Row>
      </Group>
    </>
  );
}

/* ---------- 3. Rooms ---------- */
export function PgRoomsStep({ form, setForm, options }) {
  const setRoom = (i, changes) => setForm((p) => ({ ...p, rooms: p.rooms.map((r, j) => (j === i ? { ...r, ...changes } : r)) }));
  const removeRoom = (i) => setForm((p) => ({ ...p, rooms: p.rooms.filter((_, j) => j !== i) }));
  const addRoom = () => setForm((p) => ({
    ...p,
    rooms: [...p.rooms, { type: options.roomTypes.find((t) => !p.rooms.some((r) => r.type === t)) || options.roomTypes[0], rent: '', deposit: '' }],
  }));
  const set = (key, changes) => setForm((p) => ({ ...p, [key]: { ...p[key], ...changes } }));
  const digits = (v) => v.replace(/[^\d]/g, '');

  return (
    <>
      {form.rooms.map((r, i) => (
        <Group
          key={i}
          title={`Room type ${i + 1}`}
          right={form.rooms.length > 1 ? (
            <Pressable onPress={() => removeRoom(i)} hitSlop={8}>
              <Ionicons name="trash-outline" size={19} color={colors.danger} />
            </Pressable>
          ) : null}
        >
          <ChoiceChips options={options.roomTypes} value={r.type} onChange={(v) => setRoom(i, { type: v })} />
          <Row>
            <Col><TextField label="Rent / month" prefix="₹" value={r.rent} onChange={(v) => setRoom(i, { rent: digits(v) })} keyboardType="number-pad" placeholder="per bed" /></Col>
            <Col><TextField label="Deposit" prefix="₹" value={r.deposit} onChange={(v) => setRoom(i, { deposit: digits(v) })} keyboardType="number-pad" placeholder="e.g. one month" /></Col>
          </Row>
        </Group>
      ))}
      <Pressable style={[st.addBtn, { borderColor: PG_COLOR }]} onPress={addRoom}>
        <Ionicons name="add-circle-outline" size={18} color={PG_COLOR} />
        <Text style={[st.addText, { color: PG_COLOR }]}>Add room type</Text>
      </Pressable>

      <TextField label="Available from" hint="YYYY-MM-DD" value={form.availableFrom} onChange={(v) => setForm((p) => ({ ...p, availableFrom: v.replace(/[^\d-]/g, '') }))} keyboardType="numbers-and-punctuation" placeholder="2026-12-01" maxLength={10} />

      <Group title="Notice & charges">
        <ToggleRow icon="calendar-outline" label="Notice period" value={form.notice.on} onChange={(v) => set('notice', { on: v })} />
        {form.notice.on ? (
          <View style={st.indent}>
            <ChoiceChips options={['15', '30', '45', '60'].map((d) => ({ value: d, label: `${d} days` }))} value={String(form.notice.days)} onChange={(v) => set('notice', { days: v })} />
          </View>
        ) : null}
        <ToggleRow icon="cash-outline" label="Maintenance charges" value={form.maintenance.on} onChange={(v) => set('maintenance', { on: v })} />
        {form.maintenance.on ? (
          <View style={st.indent}>
            <TextField label="Amount" prefix="₹" value={form.maintenance.amount} onChange={(v) => set('maintenance', { amount: v })} placeholder="e.g. 500 / month" />
          </View>
        ) : null}
      </Group>
    </>
  );
}

/* ---------- 4. Services ---------- */
export function PgServicesStep({ form, setForm, options }) {
  const set = (key, changes) => setForm((p) => ({ ...p, [key]: { ...p[key], ...changes } }));
  const flag = (key, v) => setForm((p) => ({ ...p, [key]: v }));
  const specific = form.contactSchedule === 'Specific time';
  return (
    <>
      <Group title="Food">
        <ToggleRow icon="restaurant-outline" label="Food included" value={form.food.on} onChange={(v) => set('food', { on: v })} />
        {form.food.on ? (
          <View style={st.indent}>
            <MultiChips label="Meals" options={options.meals} value={form.food.meals} onChange={(v) => set('food', { meals: v })} />
          </View>
        ) : null}
      </Group>
      <Group title="Services">
        <ToggleRow icon="shirt-outline" label="Laundry" value={form.laundry.on} onChange={(v) => set('laundry', { on: v })} />
        {form.laundry.on ? (
          <View style={st.indent}>
            <ChoiceChips options={options.laundryDays} value={form.laundry.days} onChange={(v) => set('laundry', { days: v })} />
          </View>
        ) : null}
        <ToggleRow icon="sparkles-outline" label="Room cleaning" value={form.cleaning} onChange={(v) => flag('cleaning', v)} />
        <ToggleRow icon="water-outline" label="Drinking water" value={form.water} onChange={(v) => flag('water', v)} />
        <ToggleRow icon="car-outline" label="Parking" value={form.parking.on} onChange={(v) => set('parking', { on: v })} />
        {form.parking.on ? (
          <View style={st.indent}>
            <ChoiceChips options={options.vehicles} value={form.parking.vehicle} onChange={(v) => set('parking', { vehicle: v })} />
          </View>
        ) : null}
        <ToggleRow icon="lock-closed-outline" label="Gate closing time" value={form.gate.on} onChange={(v) => set('gate', { on: v })} />
        {form.gate.on ? (
          <View style={st.indent}>
            <PickerField label="Gate closes at" value={timeValue(form.gate.time)} valueLabel={form.gate.time} options={TIME_LIST} onChange={(id) => set('gate', { time: id })} placeholder="Choose time" />
          </View>
        ) : null}
      </Group>
      <Group title="When can tenants call?">
        <ChoiceChips options={options.schedules} value={form.contactSchedule} onChange={(v) => setForm((p) => ({ ...p, contactSchedule: v }))} />
        {specific ? (
          <Row>
            <Col><PickerField label="From" value={timeValue(form.startTime)} valueLabel={form.startTime} options={TIME_LIST} onChange={(id) => setForm((p) => ({ ...p, startTime: id }))} placeholder="Start" /></Col>
            <Col><PickerField label="To" value={timeValue(form.endTime)} valueLabel={form.endTime} options={TIME_LIST} onChange={(id) => setForm((p) => ({ ...p, endTime: id }))} placeholder="End" /></Col>
          </Row>
        ) : null}
      </Group>
    </>
  );
}

/* ---------- 5. Amenities & rules ---------- */
export function PgAmenitiesStep({ form, setForm, options }) {
  const setList = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));
  return (
    <>
      <MultiChips label="In the building" options={options.commonAmenities} value={form.commonAmenities} onChange={setList('commonAmenities')} />
      <MultiChips label="In the rooms" options={options.roomAmenities} value={form.roomAmenities} onChange={setList('roomAmenities')} />
      <MultiChips label="House rules" options={options.rules} value={form.rules} onChange={setList('rules')} />
    </>
  );
}

/* ---------- 7. About ---------- */
export function PgAboutStep({ form, patch }) {
  return (
    <>
      <View style={st.infoBox}>
        <Ionicons name="bulb-outline" size={18} color={colors.muted} />
        <Text style={st.infoText}>
          Write what is specific to this PG (nearby offices or colleges, the building, food, rooms). PGs with their own
          description and at least 3 own photos stay in Google.
        </Text>
      </View>
      <TextField
        label="Description"
        hint="Leave an empty line between paragraphs"
        value={form.newDescriptionText}
        onChange={(v) => patch('newDescriptionText', v)}
        placeholder="What makes this PG good: location, rooms, food, who it suits…"
        multiline
        lines={12}
      />
    </>
  );
}

const st = StyleSheet.create({
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.muted, lineHeight: 18 },
  indent: { paddingLeft: 12, marginTop: -2, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: '#FDBA74' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginBottom: 16,
  },
  addText: { fontWeight: '800', fontSize: 14 },
});
