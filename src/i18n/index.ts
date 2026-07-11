import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ru from './locales/ru.json'
import uk from './locales/uk.json'
import es from './locales/es.json'
import pl from './locales/pl.json'

const storedLang = localStorage.getItem('fm_lang_ui') ?? 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    uk: { translation: uk },
    es: { translation: es },
    pl: { translation: pl },
  },
  lng: storedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
