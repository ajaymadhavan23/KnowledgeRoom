export default function Avatar({ user, size = "md" }) {
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (user?.avatarUrl) {
    return <img className={`avatar ${size}`} src={user.avatarUrl} alt={user.name} />;
  }

  return <div className={`avatar ${size}`}>{initials || "KR"}</div>;
}
