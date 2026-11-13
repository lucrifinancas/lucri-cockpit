import { Link } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import logo from '../../assets/lucri-logo.png';
import './PublicPage.css';

export default function PublicPage({title,description,children}) {
 const {user}=useAuth();
 useLayoutEffect(() => { const top = () => window.scrollTo({top:0,left:0,behavior:"instant"}); top(); return top; }, []);
 return <main className="public-page">
  <header className="public-page-brand"><Link to="/" aria-label={user?'Voltar ao Cockpit':'Voltar para entrar'}><img src={logo} alt="" width={28} height={28}/><span>Lucri Cockpit</span></Link><Link to="/">{user?'Voltar ao Cockpit':'Voltar para entrar'}</Link></header>
  <article><h1>{title}</h1><p className="public-page-intro">{description}</p>{children}</article>
 </main>;
}
