import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faChartBar, faBoxOpen, faFlask, faWrench } from '@fortawesome/free-solid-svg-icons';

const NavItem = [
    {to: 'Pendientes', name: 'Pendientes', icon: faCheckCircle},
    {to: 'ValorizacionStock', name: 'Valorizacion de Stock', icon: faChartBar},
    {to: 'Estadisticas', name: 'Estadisticas', icon: faChartBar},
    {to: 'MateriasPrimas', name: 'Materias Primas', icon: faBoxOpen},
    {to: 'Formulas', name: 'Formulas', icon: faFlask},
    {to: 'DesarrolloFormulas', name: 'Desarrollo de Formulas', icon: faWrench},
];

export default function NavList() {
  return (
    <ul className='flex flex-col gap-2'>
      {NavItem.map((item, index) => (
        <li key={index}>
          <a href={`#${item.to}`}>
            <FontAwesomeIcon icon={item.icon} /> {item.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
