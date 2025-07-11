import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import styles from '../styles/globals.css';

const SoilMap = dynamic(() => import('../components/SoilMap'), { ssr: false });

export default function Home() {
  return (
    <div>
      <Sidebar />
      <SoilMap />
    </div>
  );
}
