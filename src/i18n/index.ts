import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ru from './locales/ru.json'
import ua from './locales/ua.json'
import es from './locales/es.json'
import pl from './locales/pl.json'

const storedLang = localStorage.getItem('fm_lang_ui') ?? 'en'
const supported = ['en', 'ru', 'ua', 'es', 'pl']
const activeLang = supported.includes(storedLang) ? storedLang : 'en'

export const i18nReady = i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    ua: { translation: ua },
    es: { translation: es },
    pl: { translation: pl },
  },
  lng: activeLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
