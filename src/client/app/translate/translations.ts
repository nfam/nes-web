import { InjectionToken } from '@angular/core';
import { LANG_EN_NAME, LANG_EN_TRANS } from './lang-en';
import { LANG_VI_NAME, LANG_VI_TRANS } from './lang-vi';

// translation token
export const TRANSLATIONS = new InjectionToken('translations');

// all traslations
const dictionary = {
	[LANG_EN_NAME]: LANG_EN_TRANS,
	[LANG_VI_NAME]: LANG_VI_TRANS,
};

// providers
export const TRANSLATION_PROVIDERS = [
	{ provide: TRANSLATIONS, useValue: dictionary }
];