type AbilityScoreStepperProps = {
  disabled?: boolean;
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  value: number;
};

function AbilityScoreStepper({
  disabled = false,
  label,
  max = 20,
  min = 3,
  onChange,
  value,
}: AbilityScoreStepperProps) {
  const decreaseDisabled = disabled || value <= min;
  const increaseDisabled = disabled || value >= max;

  function decrease() {
    onChange(Math.max(min, value - 1));
  }

  function increase() {
    onChange(Math.min(max, value + 1));
  }

  return (
    <div className="ability-stepper">
      <span className="characters-control-label">{label}</span>
      <div className="ability-stepper-controls">
        <button
          type="button"
          className="ability-stepper-button"
          disabled={decreaseDisabled}
          onClick={decrease}
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <span className="ability-stepper-value">{value}</span>
        <button
          type="button"
          className="ability-stepper-button"
          disabled={increaseDisabled}
          onClick={increase}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export { AbilityScoreStepper };
