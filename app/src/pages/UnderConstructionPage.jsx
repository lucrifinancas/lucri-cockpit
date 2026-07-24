import "../styles/page.css";
import "./UnderConstructionPage.css";

export default function UnderConstructionPage({ title }) {
  return (
    <div className="page">
      <h1 className="page-title">{title}</h1>
      <div className="under-construction">
        <span className="under-construction-icon">🚧</span>
        <p>
          Em construção | O time está focado na <strong>Home</strong> nesta
          etapa (Beta 1.0). Volta em breve.
        </p>
      </div>
    </div>
  );
}