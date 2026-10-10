import { useI18n } from '../i18n/i18n';
import { SheetScreen } from '../ui/navigation/sheet-screen';

export default function Scan() {
  const { t } = useI18n();
  return <SheetScreen title={t('home.scan')} />;
}
