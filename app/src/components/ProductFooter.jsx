import { Link } from 'react-router-dom';
import './ProductFooter.css';

export default function ProductFooter() {
 return <footer className="product-footer">
  <p>Usamos cookies necessários para autenticar sua conta e manter sua sessão.</p>
  <nav aria-label="Ajuda e privacidade"><Link to="/ajuda">Ajuda</Link><Link to="/privacidade">Privacidade e cookies</Link></nav>
 </footer>;
}
