import Header from '@/components/Header';
import Hero from '@/components/Hero';
import SmoothScroll from '@/components/SmoothScroll';

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main>
        <Hero />
        <section className="next" id="classes">
          <h2>This week</h2>
          <p>The timetable comes next. The class in the carriage when you scrolled will be the one already open.</p>
        </section>
      </main>
    </>
  );
}
