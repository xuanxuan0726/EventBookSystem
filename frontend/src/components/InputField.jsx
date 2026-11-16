import { useId } from 'react';

/** Labelled input / textarea with an inline error message. */
export default function InputField({ label, error, hint, textarea = false, ...props }) {
  const id = useId();
  const Tag = textarea ? 'textarea' : 'input';

  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {hint && <span className="hint"> {hint}</span>}
      </label>
      <Tag id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      {error && (
        <p className="field-error" id={`${id}-err`}>
          {error}
        </p>
      )}
    </div>
  );
}
