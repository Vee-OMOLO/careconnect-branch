import { motion, AnimatePresence } from 'framer-motion';
import { CHANGELOG } from '../config/appVersion';

export default function WhatsNewSheet({ open, onClose }) {
  const latest = CHANGELOG[0];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/40"
          />
          <motion.div
            role="dialog"
            aria-label="What's new"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="pb-safe fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />
            <h2 className="text-lg font-semibold text-slate-900">
              What's new in {latest.version}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {latest.changes.map((change) => (
                <li key={change} className="flex gap-2.5 text-sm text-slate-700">
                  <span className="text-teal-600" aria-hidden="true">•</span>
                  {change}
                </li>
              ))}
            </ul>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-teal-600 py-3 font-medium text-white"
            >
              Got it
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
