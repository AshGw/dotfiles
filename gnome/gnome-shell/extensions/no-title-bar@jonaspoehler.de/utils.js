const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Prefs = Me.imports.prefs;

const appSys = Shell.AppSystem.get_default();

const MAXIMIZED = Meta.MaximizeFlags.BOTH;
const VERTICAL = Meta.MaximizeFlags.VERTICAL;

// global.screen removed in GNOME 3.30
var ws_manager = global.screen ? global.screen : global.workspace_manager;
var display = global.screen ? global.screen : global.display;

let settings = null;
let debug_mode = undefined;
let _debug_mode_listener_id;

function enable() {
    settings = Convenience.getSettings();
    _debug_mode_listener_id = settings.connect(
        'changed::debug-mode',
        function() {
            debug_mode = settings.get_boolean('debug-mode');
            log("Debug mode set to " + debug_mode);
        }
    );
    return settings;
}

function disable() {
    settings.disconnect(_debug_mode_listener_id);
    _debug_mode_listener_id = null;
    settings.run_dispose();
    settings = null;
}

function log_debug(message) {
    if (debug_mode === undefined) {
        debug_mode = settings.get_boolean('debug-mode');
    }
    if (debug_mode) {
        log(message);
    }
}

function log(message) {
    global.log("[no-title-bar] " + message);
}

// Get the window to display the title bar for (buttons etc) or to drag from the top panel
function getWindow(forceSnapped) {
    if (typeof forceSnapped === 'undefined') {
        forceSnapped = false;
    }

    let primaryMonitor = display.get_primary_monitor()
    let onlyPrimaryMonitor = settings.get_boolean('only-main-monitor');
    let includeSnapped = settings.get_boolean('buttons-for-snapped') || forceSnapped;
    let allWindows = settings.get_boolean('buttons-for-all-win');

    // get all window in stacking order.
    let windows = global.display.sort_windows_by_stacking(
        ws_manager.get_active_workspace().list_windows().filter(function (w) {
            return w.get_window_type() !== Meta.WindowType.DESKTOP &&
                (!onlyPrimaryMonitor || w.get_monitor() === primaryMonitor);
        })
    );

    let i = windows.length;
    while (i--) {
        let window = windows[i];
        if (window.minimized || window.is_hidden()) {
            continue;
        }

        let max_state = window.get_maximized();
        if (max_state === MAXIMIZED) {
            return window;
        }

        if (max_state === VERTICAL && includeSnapped) {
            return window;
        }

        if (allWindows) {
            return window;
        }
    }

    return null;
}

function onSizeChange(callback) {
    let callbackIDs = [];
    let wm = global.window_manager;

    // Obvious size change callback.
    callbackIDs.push(wm.connect('size-change', callback));

    // Needed for window drag to top panel (this doesn't trigger maximize).
    callbackIDs.push(wm.connect('hide-tile-preview', callback));

    // NB: 'destroy' needs a delay for .list_windows() report correctly
    callbackIDs.push(wm.connect('destroy', function () {
        Mainloop.idle_add(callback);
    }));

    return callbackIDs;
}

function getAppList() {
    let apps = Gio.AppInfo.get_all().filter(function(appInfo) {
        try {
            let id = appInfo.get_name(); // catch invalid file encodings
        } catch(e) {
            return false;
        }
        return appInfo.should_show();
    });

    return apps;
}

const IgnoreList = {
    DISABLED: 0,
    WHITELIST: 1,
    BLACKLIST: 2,
}

function getAppInfoOf(window) {
    return getAppList()
        .find(function (appInfo) {
            const app = appSys.lookup_app(appInfo.get_id());
            return app.get_windows().includes(window);
        });
}

function isWindowIgnored(settings, win) {
    const listType = settings.get_enum('ignore-list-type');
    if (listType === IgnoreList.DISABLED) return false;

    let ignoreList = settings.get_string('ignore-list');
    ignoreList = Prefs.splitEntries(ignoreList);

    const appInfo = getAppInfoOf(win);
    if (!appInfo) return false;

    const isAppInList = ignoreList.includes(appInfo.get_name());

    if (listType === IgnoreList.BLACKLIST) {
        return isAppInList;
    } else /* IgnoreList.WHITELIST */ {
        return !isAppInList;
    }
}
