import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';

const SoilMap = dynamic(() => import('../components/SoilMap'), { ssr: false });

export default function Home() {
  return (
    <div>
      <Sidebar />
      <SoilMap />
    </div>
  );
}
