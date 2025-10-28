import HeroManager from '@/components/admin/HeroManager';
import { dbConnect } from '@/lib/mongodb';
import { getHeroSettingsForAdmin } from '@/lib/hero-admin';
import { DEFAULT_HERO } from '@/lib/hero-defaults';

export const metadata = {
  title: 'Slider inicio | Panel administrativo',
};

export default async function AdminHeroPage() {
  try {
    await dbConnect();
    const hero = await getHeroSettingsForAdmin();
    return <HeroManager initialHero={hero} />;
  } catch (err) {
    return <HeroManager initialHero={{ ...DEFAULT_HERO }} />;
  }
}
