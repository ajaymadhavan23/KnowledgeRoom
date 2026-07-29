export default function TagFilter({ value, onChange, placeholder = "Filter by tag" }) {
  return (
    <input
      className="compact-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}
