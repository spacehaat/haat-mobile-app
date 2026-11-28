import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { VERTICALS } from '../../constants/inventory';
import {
  TextField, ToggleRow, ChoiceChips, PickerField, Group, Row, Col,
} from './fields';

const V = VERTICALS['private-office'];
const digits = (v) => String(v).replace(/[^\d]/g, '');
const decimal = (v) => String(v).replace(/[^\d.]/g, '');
const inrText = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/* ---------- Private office: the office and its rent ---------- */
export function PoBasicsStep({ form, patch, options, isEdit, canEnable }) {
  const area = Number(form.areaSqft) || 0;
  const perSqft = Number(form.rentPerSqft) || 0;
  const suggested = area && perSqft ? area * perSqft : 0;

  return (
    <>
      <TextField label="Office title" required value={form.name} onChange={(v) => patch('name', v)} placeholder="e.g. 2,500 sq ft furnished office in JMD Megapolis" />
      <ChoiceChips
        label="Furnishing"
        required
        options={(options.officeTypes || []).map((t) => ({ value: t.key, label: t.label }))}
        value={form.officeType}
        onChange={(v) => patch('officeType', v)}
      />
      <Row>
        <Col><TextField label="Area" suffix="sq ft" value={form.areaSqft} onChange={(v) => patch('areaSqft', digits(v))} keyboardType="number-pad" placeholder="e.g. 2500" /></Col>
        <Col><TextField label="Rent per sq ft" prefix="₹" value={form.rentPerSqft} onChange={(v) => patch('rentPerSqft', decimal(v))} keyboardType="decimal-pad" placeholder="e.g. 65" /></Col>
      </Row>
      <TextField
        label="Monthly rent"
        hint={suggested ? `area × rate = ${inrText(suggested)}` : 'leave empty to work it out from area × rate'}
        prefix="₹"
        value={form.monthlyRent}
        onChange={(v) => patch('monthlyRent', digits(v))}
        keyboardType="number-pad"
        placeholder={suggested ? String(Math.round(suggested)) : 'e.g. 160000'}
      />
      <Row>
        <Col><TextField label="Office floor" value={form.officeFloor} onChange={(v) => patch('officeFloor', v)} placeholder="e.g. 6" /></Col>
        <Col><TextField label="Security deposit" value={form.securityDeposit} onChange={(v) => patch('securityDeposit', v)} placeholder="e.g. 3 months" /></Col>
      </Row>

      <Group title="Maintenance">
        <ToggleRow icon="construct-outline" label="Maintenance charged extra" value={form.maintenance.on} onChange={(v) => patch('maintenance', { ...form.maintenance, on: v })} />
        {form.maintenance.on ? (
          <TextField label="Maintenance amount" prefix="₹" value={form.maintenance.amount} onChange={(v) => patch('maintenance', { ...form.maintenance, amount: decimal(v) })} keyboardType="decimal-pad" placeholder="per month, or per sq ft" />
        ) : null}
      </Group>

      <Group title="Access">
        <ToggleRow icon="moon-outline" label="Open 24 hours" value={form.open24} onChange={(v) => patch('open24', v)} />
        <ToggleRow icon="calendar-outline" label="Open on Sunday" value={form.sundayOpen} onChange={(v) => patch('sundayOpen', v)} />
      </Group>

      <PickerField
        label="Builder / owner"
        hint="optional"
        value={form.brand}
        valueLabel={form.labels.brand}
        options={options.brands}
        allowClear
        onChange={(id, o) => patch('brand', id, { labels: { ...form.labels, brand: o?.name || '' } })}
        placeholder="Choose builder"
      />

      <Group title="Status">
        {canEnable ? (
          <ToggleRow icon="eye-outline" label="Active" hint="Turn off to hide the office without deleting it" value={form.isActive} onChange={(v) => patch('isActive', v)} />
        ) : null}
        <View style={st.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
          <Text style={st.infoText}>
            {canEnable
              ? 'Approve or reject the office from its listing page.'
              : isEdit ? 'Only staff allowed to enable properties can change the status.' : 'New offices are saved as Pending until someone allowed to enable properties approves them.'}
          </Text>
        </View>
      </Group>
    </>
  );
}

/* ---------- Private office: what is inside ---------- */
export function PoFacilitiesStep({ form, setForm, patch, options }) {
  const setRow = (i, changes) => setForm((p) => ({ ...p, facilities: p.facilities.map((f, j) => (j === i ? { ...f, ...changes } : f)) }));
  const add = (name = '') => setForm((p) => ({ ...p, facilities: [...p.facilities, { name, value: '' }] }));
  const remove = (i) => setForm((p) => ({ ...p, facilities: p.facilities.filter((_, j) => j !== i) }));
  const have = new Set(form.facilities.map((f) => f.name.trim().toLowerCase()));
  const quick = (options.facilityNames || []).filter((n) => !have.has(n.toLowerCase()));

  return (
    <>
      <Group title="Inside the office" hint="e.g. Workstations 40, Cabins 3, Conference room 1">
        {form.facilities.map((f, i) => (
          <View key={i} style={st.facility}>
            <View style={{ flex: 1.4 }}>
              <TextField label="What" value={f.name} onChange={(v) => setRow(i, { name: v })} placeholder="e.g. Workstations" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="How many" value={f.value} onChange={(v) => setRow(i, { value: v })} placeholder="e.g. 40" />
            </View>
            <Pressable onPress={() => remove(i)} hitSlop={8} style={st.remove}>
              <Ionicons name="close-circle" size={22} color={colors.faint} />
            </Pressable>
          </View>
        ))}
        {quick.length ? (
          <View style={st.quick}>
            {quick.map((n) => (
              <Pressable key={n} style={st.quickChip} onPress={() => add(n)}>
                <Ionicons name="add" size={14} color={V.color} />
                <Text style={st.quickText}>{n}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Pressable style={st.addBtn} onPress={() => add()}>
          <Ionicons name="add-circle-outline" size={20} color={V.color} />
          <Text style={st.addText}>Add another</Text>
        </Pressable>
      </Group>

      <TextField
        label="How to reach"
        value={form.howToReach}
        onChange={(v) => patch('howToReach', v)}
        placeholder="e.g. 5 minutes from Huda City Centre metro, on Sohna Road"
        multiline
        lines={3}
      />
    </>
  );
}

const st = StyleSheet.create({
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12,
    backgroundColor: V.soft, marginBottom: 6,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 18 },
  facility: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  remove: { paddingTop: 34 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1, borderColor: V.border, backgroundColor: V.soft,
  },
  quickText: { fontSize: 13, fontWeight: '700', color: V.color },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13,
    borderRadius: 12, borderWidth: 1, borderColor: V.color, backgroundColor: V.soft, borderStyle: 'dashed',
  },
  addText: { fontSize: 14.5, fontWeight: '800', color: V.color },
});
