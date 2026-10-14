// Estado vazio de um bloco da Home: no lugar de um gráfico grande todo em
// zero, um ícone + frase curta (+ valor e ação, se fizer sentido).
export default function EmptyMetricState({ icon: Icon, title, value, message, action }) {
  return (
    <div className="home-empty">
      {Icon && <Icon size={22} weight="regular" className="home-empty-icon" aria-hidden="true" />}
      <div>
        {title && <p className="home-empty-title">{title}</p>}
        {value != null && <p className="home-empty-value">{value}</p>}
        <p className="home-empty-msg">{message}</p>
        {action}
      </div>
    </div>
  );
}
