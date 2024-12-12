import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ChatComponent } from './chat/chat.component';
import { GroupEditorComponent } from './group-editor/group-editor.component';
import { authGuard } from './auth.guard';

const routeConfig: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'chat',
        component: ChatComponent,
        canActivate: [authGuard]
    },
    {
        path: 'group-editor',
        component: GroupEditorComponent,
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: 'login',
        pathMatch: 'full'
    }
]

export default routeConfig;