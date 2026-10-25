import Classes from '@/components/Classes';
import FindUs from '@/components/FindUs';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Packs from '@/components/Packs';
import SmoothScroll from '@/components/SmoothScroll';
import Teachers from '@/components/Teachers';

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main>
        <Hero />
        <Classes />
        <Teachers />
        <Packs />
        <FindUs />
      </main>
      <Footer />
    </>
  );
}
