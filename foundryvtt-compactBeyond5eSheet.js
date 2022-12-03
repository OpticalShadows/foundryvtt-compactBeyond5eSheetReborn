// Import TypeScript modules
import { registerSettings } from './module/settings.js';
import { getGame, log } from './module/helpers.js';
import { preloadTemplates } from './module/preloadTemplates.js';
import { MODULE_ID, MySettings } from './module/constants.js';
Handlebars.registerHelper('cb5es-path', (relativePath) => {
    return `modules/${MODULE_ID}/${relativePath}`;
});
Handlebars.registerHelper('cb5es-safeVal', (value, fallback) => {
    return new Handlebars.SafeString(value || fallback);
});
Handlebars.registerHelper('cb5es-add', (value, toAdd) => {
    return new Handlebars.SafeString(String(value + toAdd));
});
Handlebars.registerHelper('cb5es-isEmpty', (input) => {
    if (!input) {
        return true;
    }
    if (input instanceof Array) {
        return input.length < 1;
    }
    if (input instanceof Set) {
        return input.size < 1;
    }
    return isEmpty(input);
});
export class CompactBeyond5eSheet extends dnd5e.applications.actor.ActorSheet5eCharacter {
    constructor() {
        super(...arguments);
        this._debouncedSearchFilter = foundry.utils.debounce(this._handleSearchFilter, 200);
    }
    get template() {
        if (!getGame().user?.isGM && this.actor.limited && !getGame().settings.get(MODULE_ID, MySettings.expandedLimited)) {
            return `modules/${MODULE_ID}/templates/character-sheet-ltd.hbs`;
        }
        return `modules/${MODULE_ID}/templates/character-sheet.hbs`;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: ['dnd5e', 'sheet', 'actor', 'character', 'cb5es'],
            scrollY: [...options.scrollY, '.sheet-sidebar'],
            height: 680,
            filters: [
                {
                    inputSelector: '.spellbook input.filter',
                    contentSelector: '.spellbook .inventory-list',
                },
                {
                    inputSelector: '.inventory input.filter',
                    contentSelector: '.inventory .inventory-list',
                },
                {
                    inputSelector: '.features input.filter',
                    contentSelector: '.features .inventory-list',
                },
            ],
        });
        return options;
    }
    activateListeners(html){
        log(true, 'activating Listeners');
        super.activateListeners(html);

        let actor = this.actor;

        html.find(".exhaustion-levels li").click(async(event) =>{
            event.preventDefault();
            let target = event.currentTarget;
            target.classList.add('selected');
            let value = Number(target.dataset.elev);
            await actor.update({ "system.attributes.exhaustion": value });
            log(true, 'Exhaustion:' + value)
        });
    }

    _handleSearchFilter(event, query, rgx, html) {
        let anyMatch = !query;
        const itemRows = html.querySelectorAll('.item-list > .item');
        log(false, 'onSearchFilter firing', {
            query,
            rgx,
            html,
            itemRows,
        });
        for (let li of itemRows) {
            if (!query) {
                li.classList.remove('hidden');
                continue;
            }
            // const id = li.dataset.packageId;
            const title = li.querySelector('.item-name')?.textContent;
            if (!title)
                continue;
            //@ts-expect-error
            const match = rgx.test(SearchFilter.cleanQuery(title));
            li.classList.toggle('hidden', !match);
            if (match)
                anyMatch = true;
        }
    }
    /** @override */
    _onSearchFilter(...args) {
        //@ts-expect-error
        this._debouncedSearchFilter(...args);
    }
    async _renderInner(...args) {
        const html = await super._renderInner(...args);
        const actionsListApi = getGame().modules.get('character-actions-list-5e')?.api;
        try {
            const actionsTab = html.find('.actions');
            const actionsTabHtml = (await actionsListApi?.renderActionsList(this.actor));
            actionsTab.html(actionsTabHtml);
        }
        catch (e) {
            log(true, e);
        }
        return html;
    }
    async getData() {
        const sheetData = await super.getData();
        sheetData.enrichedBiography = await TextEditor.enrichHTML(this.object.system.details.biography.value, {async: true});
        sheetData.enrichedAppearance = await TextEditor.enrichHTML(this.object.system.details.appearance.value, {async: true});
        sheetData.enrichedFlaws = await TextEditor.enrichHTML(this.object.system.details.flaw.value, {async: true});
        return sheetData;
    }
    
}
/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
    log(true, `Initializing ${MODULE_ID}`);
    // Register custom module settings
    //registerSettings();
    // Preload Handlebars templates
    await preloadTemplates();
});
// Register compactBeyond5eSheet Sheet
Actors.registerSheet('dnd5e', CompactBeyond5eSheet, {
    label: 'Compact D&D Beyond-like',
    makeDefault: false,
    types: ['character'],
});
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MODULE_ID);
});
//# sourceMappingURL=foundryvtt-compactBeyond5eSheet.js.map