export default function Stepper({ steps, current }) {
  return (
    <nav className="stepper" aria-label="Bestellfortschritt">
      <div className="stepper-steps">
        {steps.map((label, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'todo';
          return (
            <div key={label} className={`step ${state}`} aria-current={state === 'active' ? 'step' : undefined}>
              <div className="step-dot" aria-hidden="true">{state === 'done' ? '✓' : i + 1}</div>
              <div className="step-label">{label}</div>
            </div>
          );
        })}
      </div>
      <div className="stepper-track" aria-hidden="true">
        <div
          className="stepper-fill"
          style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </nav>
  );
}
