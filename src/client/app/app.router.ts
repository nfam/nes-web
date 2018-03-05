import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GameListComponent } from './game/game-list.component';
import { GameComponent } from './game/game.component';
import { ControllerComponent } from './settings/controller/controller.component';
import { SettingsComponent } from './settings/settings.component';
import { LanguageComponent } from './settings/language/language.component';

let routes: Routes = [
    { path: '', component: GameListComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'settings/controller', component: ControllerComponent },
    { path: 'settings/language', component: LanguageComponent },
    { path: ':name', component: GameComponent }
];

export const router: ModuleWithProviders = RouterModule.forRoot(routes, { useHash: false });