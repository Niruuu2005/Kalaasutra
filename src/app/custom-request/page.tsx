import { CustomRequestForm } from '@/components/CustomRequestForm';
import { SiteSettingsService } from '@/lib/services/site-settings.service';

export const dynamic = 'force-dynamic';

export default async function CustomRequestPage() {
  let whatsappPhone = '918421949875';

  try {
    const settings = await SiteSettingsService.getSettings(['whatsapp_number']);
    const phoneVal = settings.whatsapp_number;
    if (typeof phoneVal === 'string') {
      whatsappPhone = phoneVal;
    } else if (phoneVal && typeof phoneVal === 'object') {
      whatsappPhone = phoneVal.phone || '918421949875';
    }
  } catch (error) {
    console.error("Failed to load settings in CustomRequestPage:", error);
  }

  return (
    <div className="flex-grow w-full bg-zinc-950 text-zinc-350 py-16 sm:py-24 font-sans select-none relative">
      <div className="absolute top-10 right-10 w-96 h-96 bg-brand-gold/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      <CustomRequestForm whatsappPhone={whatsappPhone} />
    </div>
  );
}
