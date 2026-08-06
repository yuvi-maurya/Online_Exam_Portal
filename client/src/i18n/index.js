import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { englishTranslation } from './locales/en.js'

export const DEFAULT_LANGUAGE = 'en'
export const SUPPORTED_LANGUAGES = [DEFAULT_LANGUAGE]

i18n.use(initReactI18next).init({
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  lng: DEFAULT_LANGUAGE,
  resources: {
    en: { translation: englishTranslation },
  },
  returnEmptyString: false,
  showSupportNotice: false,
})

export default i18n
