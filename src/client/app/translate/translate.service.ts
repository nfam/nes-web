import { Injectable, Inject } from '@angular/core';
import { TRANSLATIONS } from './translations';
import { Configuration } from '../core/configuration';

@Injectable()
export class TranslateService {

	constructor(
		@Inject(TRANSLATIONS) private translations: any,
		private configuration: Configuration) {
	}

	private translate(key: string): string {
		let translation = key;
		let lang = this.configuration.lang;
    
        if (this.translations[lang] && this.translations[lang][key]) {
			return this.translations[lang][key];
		}

		return translation;
	}

	public instant(key: string) {
		return this.translate(key); 
	}
}