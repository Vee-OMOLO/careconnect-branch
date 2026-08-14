import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CareTeam from '../components/CareTeam';
import { useAuth } from '../contexts/AuthContext';
import {
  getContacts,
  saveContact,
  deleteContact,
  getMedicalInfo,
  saveMedicalInfo,
} from '../services/supabaseService';

/* ────────────────────────────────────────────────────────────────
   The Safety Vault is two different screens wearing one name.

   For the parent it is a record to maintain: contacts, blood type,
   allergies, medications.

   For the caregiver it is a reference to reach for at the worst
   moment — when something is wrong and the parent is not answering.
   So their view leads with phone numbers, makes everything tappable,
   and shows no edit controls at all. RLS in 004_vault_access.sql
   enforces that; hiding buttons alone is not security.

   FIX (cursor jumping while typing): every form component below is
   declared at module scope. A component created inside another
   component's render body is a new component type on each keystroke,
   so React unmounts the subtree, rebuilds the input, and the page
   jumps to the top.
   ──────────────────────────────────────────────────────────────── */

const EMPTY_CONTACT = {
  id: null,
  name: '',
  relationship: '',
  phone: '',
  email: '',
  isPrimary: false,
};

export default function SafetyVault() {
  const { linkKey, role } = useAuth();
  const canEdit = role === 'parent';

  const [contacts, setContacts] = useState([]);
  const [draft, setDraft] = useState(EMPTY_CONTACT);
  const [medical, setMedical] = useState({
    bloodType: '',
    allergies: '',
    conditions: '',
    medications: '',
  });
  const [status, setStatus] = useState({ kind: 'idle', message: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!linkKey) return;
    let active = true;

    Promise.all([getContacts(linkKey), getMedicalInfo(linkKey)])
      .then(([contactRows, info]) => {
        if (!active) return;
        setContacts(contactRows);
        setMedical({
          bloodType: info.blood_type ?? '',
          allergies: info.allergies ?? '',
          conditions: info.conditions ?? '',
          medications: info.medications ?? '',
        });
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [linkKey]);

  const updateDraft = useCallback((field, value) => {
    setDraft((prev) => (prev[field] === value ? prev : { ...prev, [field]: value }));
  }, []);

  const updateMedical = useCallback((field, value) => {
    setMedical((prev) => (prev[field] === value ? prev : { ...prev, [field]: value }));
  }, []);

  const handleSaveContact = useCallback(async () => {
    if (!draft.name.trim() || !draft.phone.trim()) {
      setStatus({ kind: 'error', message: 'A contact needs at least a name and a phone number.' });
      return;
    }

    setStatus({ kind: 'saving', message: '' });
    try {
      const saved = await saveContact({ ...draft, link_key: linkKey });
      setContacts((prev) => {
        const exists = prev.some((c) => c.id === saved.id);
        return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved];
      });
      setDraft(EMPTY_CONTACT);
      setStatus({ kind: 'saved', message: 'Contact saved.' });
    } catch (err) {
      setStatus({ kind: 'error', message: err.message || 'Could not save that contact.' });
    }
  }, [draft, linkKey]);

  const handleDelete = useCallback(async (id) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteContact(id);
    } catch {
      setContacts(await getContacts(linkKey));
      setStatus({ kind: 'error', message: 'Could not remove that contact. It has been restored.' });
    }
  }, [linkKey]);

  const handleEdit = useCallback((contact) => {
    setDraft({
      id: contact.id,
      name: contact.name ?? '',
      relationship: contact.relationship ?? '',
      phone: contact.phone ?? '',
      email: contact.email ?? '',
      isPrimary: !!contact.is_primary,
    });
  }, []);

  const handleSaveMedical = useCallback(async () => {
    setStatus({ kind: 'saving', message: '' });
    try {
      await saveMedicalInfo(linkKey, medical);
      setStatus({ kind: 'saved', message: 'Medical details saved.' });
    } catch (err) {
      setStatus({ kind: 'error', message: err.message || 'Could not save the medical details.' });
    }
  }, [linkKey, medical]);

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => Number(b.is_primary) - Number(a.is_primary)),
    [contacts]
  );

  const hasMedical = Object.values(medical).some((v) => v?.trim());

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <PageHeader
        title="Safety vault"
        subtitle={canEdit ? 'Kept for whoever is with your child' : "Everything you need if you can't reach the parent"}
        showBack={false}
      />

      <div className="space-y-8 px-5 py-6">
        {!canEdit && (
          <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-900">
            Tap any number to call. In a life-threatening emergency call
            emergency services first, then raise an SOS from the home screen.
          </p>
        )}

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Emergency contacts
          </h2>

          {loading ? (
            <p className="mt-3 text-sm text-slate-400">Loading…</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sortedContacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  canEdit={canEdit}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}

              {sortedContacts.length === 0 && (
                <li className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  {canEdit
                    ? 'No contacts yet. Add the people who should be called first.'
                    : 'The parent has not added any contacts yet. Ask them to add a few.'}
                </li>
              )}
            </ul>
          )}

          {canEdit && (
            <ContactForm
              draft={draft}
              onChange={updateDraft}
              onSave={handleSaveContact}
              onCancel={() => setDraft(EMPTY_CONTACT)}
              saving={status.kind === 'saving'}
            />
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Medical information
          </h2>

          {canEdit ? (
            <MedicalForm
              values={medical}
              onChange={updateMedical}
              onSave={handleSaveMedical}
              saving={status.kind === 'saving'}
            />
          ) : hasMedical ? (
            <dl className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              <MedicalRow label="Blood type"  value={medical.bloodType} />
              <MedicalRow label="Allergies"   value={medical.allergies} highlight />
              <MedicalRow label="Conditions"  value={medical.conditions} />
              <MedicalRow label="Medications" value={medical.medications} />
            </dl>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              The parent has not filled this in yet.
            </p>
          )}
        </section>

        {/* Care team sits here too. It is who you call when the parent
            is unreachable, which is the whole point of this screen. */}
        {linkKey && <CareTeam />}

        {status.message && status.kind !== 'saving' && (
          <p
            role="status"
            className={`rounded-xl px-4 py-3 text-sm ${
              status.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {status.message}
          </p>
        )}

        {!canEdit && (
          <Link
            to="/caregiver"
            className="block rounded-xl bg-red-600 py-4 text-center font-semibold text-white"
          >
            Raise an emergency alert
          </Link>
        )}
      </div>
    </div>
  );
}

/* ───────── Module-scope components — declared once, never recreated ───────── */

function ContactRow({ contact, canEdit, onEdit, onDelete }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">
            {contact.name}
            {contact.is_primary && (
              <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
                Call first
              </span>
            )}
          </p>
          <p className="truncate text-sm text-slate-500">
            {[contact.relationship, contact.phone].filter(Boolean).join(' · ')}
          </p>
        </div>

        <a
          href={`tel:${contact.phone}`}
          className="shrink-0 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white"
        >
          Call
        </a>
      </div>

      {canEdit && (
        <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3">
          <button onClick={() => onEdit(contact)} className="text-sm text-slate-500 underline">
            Edit
          </button>
          <button onClick={() => onDelete(contact.id)} className="text-sm text-red-600 underline">
            Remove
          </button>
        </div>
      )}
    </li>
  );
}

function MedicalRow({ label, value, highlight }) {
  if (!value?.trim()) return null;
  return (
    <div className="px-4 py-3.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-0.5 text-sm ${highlight ? 'font-medium text-red-700' : 'text-slate-800'}`}>
        {value}
      </dd>
    </div>
  );
}

function ContactForm({ draft, onChange, onSave, onCancel, saving }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-700">
        {draft.id ? 'Edit contact' : 'Add a contact'}
      </p>

      <TextField label="Name" name="name" value={draft.name} onChange={onChange} autoComplete="name" required />
      <TextField label="Relationship" name="relationship" value={draft.relationship} onChange={onChange} placeholder="Grandmother, neighbour, doctor" />
      <TextField label="Phone" name="phone" value={draft.phone} onChange={onChange} type="tel" autoComplete="tel" required />
      <TextField label="Email" name="email" value={draft.email} onChange={onChange} type="email" autoComplete="email" />

      <label className="flex items-center gap-2.5 py-1">
        <input
          type="checkbox"
          checked={draft.isPrimary}
          onChange={(e) => onChange('isPrimary', e.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        />
        <span className="text-sm text-slate-700">Call this person first</span>
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-teal-600 py-3 font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : draft.id ? 'Save changes' : 'Add contact'}
        </button>
        {draft.id && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function MedicalForm({ values, onChange, onSave, saving }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <TextField label="Blood type" name="bloodType" value={values.bloodType} onChange={onChange} placeholder="O+" />
      <TextField label="Allergies" name="allergies" value={values.allergies} onChange={onChange} placeholder="Peanuts, penicillin" />
      <TextField label="Conditions" name="conditions" value={values.conditions} onChange={onChange} placeholder="Asthma" />
      <TextField label="Medications" name="medications" value={values.medications} onChange={onChange} placeholder="Inhaler, twice daily" />

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-teal-600 py-3 font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save medical details'}
      </button>
    </form>
  );
}

function TextField({ label, name, value, onChange, type = 'text', ...rest }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(name, e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        {...rest}
      />
    </label>
  );
}
