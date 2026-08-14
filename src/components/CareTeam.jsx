import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getCareTeam,
  saveCareTeamMember,
  deleteCareTeamMember,
} from '../services/supabaseService';
import { CARE_TEAM_ROLES, getCareTeamRole } from '../constants/activityData';

/* The people around the child — pediatrician, tutor, family doctor.
   Separate from the Safety Vault's emergency contacts, which is
   specifically who to call in a crisis. Someone can be in both.

   The parent adds and edits. The caregiver reads and can tap to call.
   Every form component here is declared at module scope for the same
   reason as in SafetyVault: a component created during render is a new
   component type on every keystroke, which remounts the input and drops
   focus. */

const EMPTY = {
  id: null,
  name: '',
  memberRole: 'pediatrician',
  organization: '',
  phone: '',
  email: '',
  notes: '',
};

export default function CareTeam() {
  const { linkKey, role } = useAuth();
  const canEdit = role === 'parent';

  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState({ kind: 'idle', message: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!linkKey) return;
    let active = true;

    getCareTeam(linkKey)
      .then((rows) => active && setMembers(rows))
      .catch(() => {})
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [linkKey]);

  const updateDraft = useCallback((field, value) => {
    setDraft((prev) => (prev[field] === value ? prev : { ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft.name.trim()) {
      setStatus({ kind: 'error', message: 'Give this person a name.' });
      return;
    }

    setStatus({ kind: 'saving', message: '' });
    try {
      const saved = await saveCareTeamMember({ ...draft, link_key: linkKey });
      setMembers((prev) => {
        const exists = prev.some((m) => m.id === saved.id);
        return exists ? prev.map((m) => (m.id === saved.id ? saved : m)) : [...prev, saved];
      });
      setDraft(EMPTY);
      setShowForm(false);
      setStatus({ kind: 'saved', message: 'Saved to the care team.' });
    } catch (err) {
      setStatus({ kind: 'error', message: err.message || 'Could not save that person.' });
    }
  }, [draft, linkKey]);

  const handleDelete = useCallback(async (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteCareTeamMember(id);
    } catch {
      const fresh = await getCareTeam(linkKey);
      setMembers(fresh);
      setStatus({ kind: 'error', message: 'Could not remove that person.' });
    }
  }, [linkKey]);

  const handleEdit = useCallback((member) => {
    setDraft({
      id: member.id,
      name: member.name ?? '',
      memberRole: member.member_role ?? 'other',
      organization: member.organization ?? '',
      phone: member.phone ?? '',
      email: member.email ?? '',
      notes: member.notes ?? '',
    });
    setShowForm(true);
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Care team
        </h2>
        {canEdit && (
          <button
            onClick={() => {
              setDraft(EMPTY);
              setShowForm((v) => !v);
            }}
            className="text-sm font-medium text-teal-700 underline"
          >
            {showForm ? 'Cancel' : 'Add person'}
          </button>
        )}
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {canEdit
          ? "Doctors, tutors and anyone else involved in your child's care."
          : "The people involved in this child's care. Tap to call."}
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-slate-400">Loading…</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              canEdit={canEdit}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {members.length === 0 && (
            <li className="rounded-2xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">
              {canEdit
                ? 'No one added yet. Start with your pediatrician.'
                : 'The parent has not added anyone yet.'}
            </li>
          )}
        </ul>
      )}

      {canEdit && showForm && (
        <MemberForm
          draft={draft}
          onChange={updateDraft}
          onSave={handleSave}
          saving={status.kind === 'saving'}
        />
      )}

      {status.message && status.kind !== 'saving' && (
        <p
          role="status"
          className={`mt-3 rounded-xl px-4 py-3 text-sm ${
            status.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {status.message}
        </p>
      )}
    </section>
  );
}

function MemberRow({ member, canEdit, onEdit, onDelete }) {
  const memberRole = getCareTeamRole(member.member_role);

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{memberRole.emoji}</span>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{member.name}</p>
          <p className="text-sm text-slate-500">
            {[memberRole.label, member.organization].filter(Boolean).join(' · ')}
          </p>
          {member.notes && <p className="mt-1 text-sm text-slate-600">{member.notes}</p>}
        </div>

        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="shrink-0 rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800"
          >
            Call
          </a>
        )}
      </div>

      {canEdit && (
        <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3">
          <button onClick={() => onEdit(member)} className="text-sm text-slate-500 underline">
            Edit
          </button>
          <button onClick={() => onDelete(member.id)} className="text-sm text-red-600 underline">
            Remove
          </button>
        </div>
      )}
    </li>
  );
}

function MemberForm({ draft, onChange, onSave, saving }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <p className="text-sm font-medium text-slate-700">
        {draft.id ? 'Edit person' : 'Add to care team'}
      </p>

      <Field label="Name" name="name" value={draft.name} onChange={onChange} required />

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Role</span>
        <select
          value={draft.memberRole}
          onChange={(e) => onChange('memberRole', e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
        >
          {CARE_TEAM_ROLES.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </label>

      <Field
        label="Practice or organisation"
        name="organization"
        value={draft.organization}
        onChange={onChange}
        placeholder="Nairobi Children's Clinic"
      />
      <Field label="Phone" name="phone" value={draft.phone} onChange={onChange} type="tel" />
      <Field label="Email" name="email" value={draft.email} onChange={onChange} type="email" />
      <Field
        label="Notes"
        name="notes"
        value={draft.notes}
        onChange={onChange}
        placeholder="Tuesdays and Thursdays only"
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-teal-600 py-3 font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : draft.id ? 'Save changes' : 'Add to care team'}
      </button>
    </form>
  );
}

function Field({ label, name, value, onChange, type = 'text', ...rest }) {
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
