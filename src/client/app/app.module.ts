import { NgModule } from '@angular/core';
import { PlatformLocation, APP_BASE_HREF } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { router } from './app.router';

import { AppComponent } from './app.component';
import { Configuration } from './core/configuration';
import { FullscreenService } from './core/fullscreen.service';
import { PlayingService } from './core/playing.service';
import { SocketService } from './core/socket.service';
import { GameComponent } from './game/game.component';
import { GameListComponent } from './game/game-list.component';
import { GameCardComponent } from './game/components/game-cover/game-cover.component';
import { ScreenComponent } from './game/components/screen/screen.component';
import { PlayingModeInputComponent } from './game/components/playingmode-input/playingmode-input.component';
import { RoomOptionInputComponent } from './game/components/roomoption-input/roomoption-input.component';
import { UsernameInputComponent } from './game/components/username-input/username-input.component';
import { ConnectionStatusComponent } from './game/components/connection-status/connection-status.component';
import { PasscodeComponentInput } from './game/components/passcode-input/passcode-input.component';
import { GameTitleComponent } from './game/components/game-title/game-title.component';
import { GameService } from './game/game.service';
import { RoomService } from './room/room.service';

import { ClickOutsideDirective } from './shared/click-outside.directive';
import { LoadingComponent } from './shared/loading.component';
import { OverlayButtonComponent } from './shared/overlay-button.component';
import { TranslatePipe } from './translate/translate.pipe';
import { TranslateService } from './translate/translate.service';
import { TRANSLATION_PROVIDERS } from './translate/translations';
import { ControllerComponent } from './settings/controller/controller.component';
import { JoystickComponent } from './settings/controller/joystick.component';
import { KeyboardComponent } from './settings/controller/keyboard.component';
import { OverlayPlayerComponent } from './game/components/overlay-player/overlay-player.component';
import { GamepadService } from './core/gamepad.service';
import { SettingsComponent } from './settings/settings.component';
import { LanguageComponent } from './settings/language/language.component';


function getBaseHref(platformLocation: PlatformLocation): string {
    return platformLocation.getBaseHrefFromDOM();
}

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        router
    ],
    declarations: [
        AppComponent,
        GameComponent,
        GameCardComponent,
        GameListComponent,
        ConnectionStatusComponent,
        ControllerComponent,
        JoystickComponent,
        KeyboardComponent,
        GameTitleComponent,
        LanguageComponent,
        PasscodeComponentInput,
        PlayingModeInputComponent,
        RoomOptionInputComponent,
        UsernameInputComponent,
        OverlayPlayerComponent,
        LoadingComponent,
        ClickOutsideDirective,
        OverlayButtonComponent,
        ScreenComponent,
        SettingsComponent,
        TranslatePipe,
    ],
    providers: [
        {
            provide: APP_BASE_HREF,
            useFactory: getBaseHref,
            deps: [PlatformLocation]
        },
        Configuration,
        FullscreenService,
        PlayingService,
        SocketService,
        GamepadService,
        GameService,
        RoomService,
        TranslatePipe,
        TranslateService,
        TRANSLATION_PROVIDERS
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }