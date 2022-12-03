import { MODULE_ID } from './constants.js';
export function log(force, ...args) {
    //@ts-ignore
    const shouldLog = force || getGame().modules.get('_dev-mode')?.api?.getPackageDebugValue(MODULE_ID);
    if (shouldLog) {
        console.log(MODULE_ID, '|', ...args);
    }
}
export function getGame() {
    if (!(game instanceof Game)) {
        throw new Error('game is not initialized yet!');
    }
    return game;
}
//# sourceMappingURL=helpers.js.map