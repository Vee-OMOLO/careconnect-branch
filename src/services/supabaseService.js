import { supabase } from '../supabase';

// ---------------------------------------------------------------
// Family linking
// ---------------------------------------------------------------

// Deterministic key so parent and caregiver land on the same family
// without exchanging a code. Normalised hard: trimmed, lowercased,
// inner whitespace collapsed. A stray space used to create a second,
// invisible family.
export const buildLinkKey = (parentEmail, childName) =>
  `${String(parentEmail || '').trim().toLowerCase()}_${String(childName || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')}`;

export async function createFamily({ parentEmail, childName, parentId }) {
  const link_key = buildLinkKey(parentEmail, childName);

  const { data, error } = await supabase
    .from('families')
    .upsert(
      { link_key, parent_email: parentEmail.trim().toLowerCase(), child_name: childName.trim(), created_by: parentId },
      { onConflict: 'link_key' }
    )
    .select()
    .single();

  if (error) throw error;
  await joinFamily({ link_key, userId: parentId, role: 'parent' });
  return data;
}

export async function joinFamily({ link_key, userId, role }) {
  const { error } = await supabase
    .from('family_members')
    .upsert({ link_key, user_id: userId, role }, { onConflict: 'link_key,user_id' });
  if (error) throw error;
  return link_key;
}

export async function findFamily({ parentEmail, childName }) {
  const link_key = buildLinkKey(parentEmail, childName);
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('link_key', link_key)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------
// Activities
// ---------------------------------------------------------------

// FIX (notes): `notes` was never part of the insert payload, so the
// optional note the caregiver typed was thrown away at the network
// boundary. It is now an explicit column — empty strings become null
// so the UI can test `activity.notes` without getting a falsy "".
export async function logActivity({ link_key, userId, type, detail, notes, photoUrl, occurredAt }) {
  const payload = {
    link_key,
    logged_by: userId,
    activity_type: type,
    detail: detail || null,
    notes: notes?.trim() ? notes.trim() : null,
    photo_url: photoUrl || null,
    occurred_at: occurredAt || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('activity_logs')
    .insert(payload)
    .select('id, link_key, logged_by, activity_type, detail, notes, photo_url, occurred_at, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function getActivities({ link_key, since, limit = 100 }) {
  let query = supabase
    .from('activity_logs')
    // Explicit column list — `select('*')` hid the fact that `notes`
    // did not exist yet, which is part of why this bug survived.
    .select('id, link_key, logged_by, activity_type, detail, notes, photo_url, occurred_at, created_at')
    .eq('link_key', link_key)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (since) query = query.gte('occurred_at', since);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------
// SOS alerts
// ---------------------------------------------------------------

// FIX (emergency type): the selected type was only ever interpolated
// into a display string on the caregiver's device. Nothing typed
// reached the database, so the parent saw a bare "Emergency alert".
// `emergency_type` is now a first-class column.
export async function sendSOS({ link_key, userId, emergencyType, message, location }) {
  const payload = {
    link_key,
    raised_by: userId,
    emergency_type: emergencyType || 'other',
    message: message?.trim() ? message.trim() : null,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    accuracy: location?.accuracy ?? null,
    status: 'active',
  };

  const { data, error } = await supabase
    .from('sos_alerts')
    .insert(payload)
    .select('id, link_key, raised_by, emergency_type, message, latitude, longitude, accuracy, status, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveAlerts(link_key) {
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('id, link_key, raised_by, emergency_type, message, latitude, longitude, accuracy, status, created_at')
    .eq('link_key', link_key)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function resolveAlert(id) {
  const { error } = await supabase
    .from('sos_alerts')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------
// Emergency contacts (Safety Vault)
// ---------------------------------------------------------------

export async function getContacts(link_key) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('id, link_key, name, relationship, phone, email, is_primary, created_at')
    .eq('link_key', link_key)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function saveContact({ id, link_key, name, relationship, phone, email, isPrimary }) {
  const payload = {
    link_key,
    name: name.trim(),
    relationship: relationship?.trim() || null,
    phone: phone.trim(),
    email: email?.trim() || null,
    is_primary: !!isPrimary,
  };

  const query = id
    ? supabase.from('emergency_contacts').update(payload).eq('id', id)
    : supabase.from('emergency_contacts').insert(payload);

  const { data, error } = await query
    .select('id, link_key, name, relationship, phone, email, is_primary, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContact(id) {
  const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
  if (error) throw error;
}

export async function getMedicalInfo(link_key) {
  const { data, error } = await supabase
    .from('families')
    .select('blood_type, allergies, conditions, medications, notes')
    .eq('link_key', link_key)
    .maybeSingle();
  if (error) throw error;
  return data ?? {};
}

export async function saveMedicalInfo(link_key, info) {
  const { error } = await supabase
    .from('families')
    .update({
      blood_type: info.bloodType?.trim() || null,
      allergies: info.allergies?.trim() || null,
      conditions: info.conditions?.trim() || null,
      medications: info.medications?.trim() || null,
      notes: info.notes?.trim() || null,
    })
    .eq('link_key', link_key);
  if (error) throw error;
}

// ---------------------------------------------------------------
// Location
// ---------------------------------------------------------------

export async function upsertLocation({ link_key, userId, latitude, longitude, accuracy }) {
  const { error } = await supabase.from('caregiver_locations').upsert(
    {
      link_key,
      user_id: userId,
      latitude,
      longitude,
      accuracy: accuracy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'link_key,user_id' }
  );
  if (error) throw error;
}

export async function getLocations(link_key) {
  const { data, error } = await supabase
    .from('caregiver_locations')
    .select('user_id, latitude, longitude, accuracy, updated_at')
    .eq('link_key', link_key);
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------

// One channel per SUBSCRIBER, not per family.
//
// Supabase reuses an existing channel when you ask for one by a name it
// already holds. ParentHome and EmergencyDashboard both subscribe, so a
// shared name meant the second one tried to attach listeners to a
// channel that was already subscribed — which Supabase rejects with
// "cannot add postgres_changes callbacks". React StrictMode mounts
// everything twice in development, so it surfaced immediately.
//
// A counter rather than crypto.randomUUID(): randomUUID is undefined on
// insecure origins, so it would break on http://192.168.x.x when
// testing from a phone on the same Wi-Fi.
let channelSeq = 0;

export function subscribeToFamily(link_key, { onActivity, onAlert, onLocation } = {}) {
  channelSeq += 1;
  const channel = supabase.channel(`family:${link_key}:${channelSeq}`);

  if (onActivity) {
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: `link_key=eq.${link_key}` },
      (payload) => onActivity(payload.new)
    );
  }

  if (onAlert) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sos_alerts', filter: `link_key=eq.${link_key}` },
      (payload) => onAlert(payload.new, payload.eventType)
    );
  }

  if (onLocation) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'caregiver_locations', filter: `link_key=eq.${link_key}` },
      (payload) => onLocation(payload.new)
    );
  }

  channel.subscribe();
  return () => supabase.removeChannel(channel);
}

// ---------------------------------------------------------------
// Care team
// Read is open to the family; writes are parent-only, enforced by RLS
// in 003_care_team_and_details.sql. The UI hides the controls too, but
// the policy is what actually stops it.
// ---------------------------------------------------------------

const CARE_TEAM_COLUMNS =
  'id, link_key, name, member_role, organization, phone, email, notes, created_at';

export async function getCareTeam(link_key) {
  const { data, error } = await supabase
    .from('care_team')
    .select(CARE_TEAM_COLUMNS)
    .eq('link_key', link_key)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function saveCareTeamMember({ id, link_key, name, memberRole, organization, phone, email, notes }) {
  const payload = {
    link_key,
    name: name.trim(),
    member_role: memberRole || 'other',
    organization: organization?.trim() || null,
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    notes: notes?.trim() || null,
  };

  const query = id
    ? supabase.from('care_team').update(payload).eq('id', id)
    : supabase.from('care_team').insert(payload);

  const { data, error } = await query.select(CARE_TEAM_COLUMNS).single();
  if (error) throw error;
  return data;
}

export async function deleteCareTeamMember(id) {
  const { error } = await supabase.from('care_team').delete().eq('id', id);
  if (error) throw error;
}
