type StatBoxProps = {
  label: string;
  value: string | number;
};

function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="stat-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export { StatBox };
