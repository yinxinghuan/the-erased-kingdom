import { theErasedKingdom, theErasedKingdomEn } from './theErasedKingdom'
import type { Locale, StoryCartridge } from '../types'

export const DEFAULT_CARTRIDGE_ID = 'the-erased-kingdom'
export const CARTRIDGES: Record<string, StoryCartridge> = { 'the-erased-kingdom': theErasedKingdom }
export const CARTRIDGES_EN: Record<string, StoryCartridge> = { 'the-erased-kingdom': theErasedKingdomEn }
export function listCartridges(locale: Locale): StoryCartridge[] { return [locale === 'en' ? theErasedKingdomEn : theErasedKingdom] }
export function resolveCartridge(_id: string | null | undefined, locale: Locale = 'zh'): StoryCartridge { return locale === 'en' ? theErasedKingdomEn : theErasedKingdom }
