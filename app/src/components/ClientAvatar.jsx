import "./ClientAvatar.css";

function initials(name) {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]).join("").toUpperCase();
}

export default function ClientAvatar({ client, size = 32 }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (client?.logoUrl) {
    return <img src={client.logoUrl} alt={client.name} className="client-avatar" style={style} />;
  }

  return (
    <span className="client-avatar client-avatar-fallback" style={style}>
      {client?.name ? initials(client.name) : "?"}
    </span>
  );
}
