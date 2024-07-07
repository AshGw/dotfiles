const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const GLib = imports.gi.GLib;
const Meta = imports.gi.Meta;

const ByteArray = imports.byteArray;

const ws_manager = global.workspace_manager;

const WindowState = {
    DEFAULT: 'default',
    HIDE_TITLEBAR: 'hide-titlebar',
    UNDECORATED: 'undecorated',
    CLIENT_DECORATED: 'client-decorated'
}

var Decoration = class {

    constructor(settings) {
        this._settings = settings;
        this._changeWorkspaceID = null;
        this._changeMonitorsID = null;
        this._focusWindowID = null;
        this._sizeChangeID = null;
        this._onlyMainMonitorID = null;
        this._ignoreListID = null;
        this._ignoreListTypeID = null;

        this._workspaces = [];

        this._enable();
    }

    _enable() {
        this._changeWorkspaceID = ws_manager.connect('notify::n-workspaces', () => this._nWorkspacesChanged());
        this._windowEnteredID = global.display.connect(
            'window-entered-monitor',
            (screen, monitorIndex, win) => this._toggleTitlebar(win)
        );

        // CSS style for Wayland decorations
        this._userStylesPath = GLib.get_user_config_dir() + '/gtk-3.0/gtk.css';
        Mainloop.idle_add(() => this._addUserStyles());

        Mainloop.idle_add(() => {
            global.get_window_actors()
                .map(win => win.meta_window)
                .forEach(win => this._onWindowAdded(win))
            this._nWorkspacesChanged();
        });

        this._changeMonitorsID = Meta.MonitorManager.get().connect('monitors-changed', () => {
            Utils.log_debug("Monitors changed, reloading");
            this._disable();
            this._enable();
        });

        this._focusWindowID = global.display.connect('notify::focus-window', () => {
            Utils.log_debug("Focus changed, toggling titlebar");
            this._toggleTitlebar();
        });

        this._sizeChangeID = global.window_manager.connect('size-change', () => {
            Utils.log_debug("Size changed, toggling titlebar");
            this._toggleTitlebar();
        })

        this._onlyMainMonitorID = this._settings.connect('changed::only-main-monitor', () => {
            this._disable();
            this._enable();
        });

        this._ignoreListID = this._settings.connect('changed::ignore-list', () => {
            this._disable();
            this._enable();
        });

        this._ignoreListTypeID = this._settings.connect('changed::ignore-list-type', () => {
            this._disable();
            this._enable();
        });

        this._isEnabled = true;
    }

    destroy() {
        this._disable();
    }

    _disable() {
        if (this._changeWorkspaceID != null) {
            ws_manager.disconnect(this._changeWorkspaceID);
            this._changeWorkspaceID = null;
        }

        if (this._windowEnteredID != null) {
            global.display.disconnect(this._windowEnteredID);
            this._windowEnteredID = null;
        }

        this._workspaces.forEach(ws => {
            ws.disconnect(ws._noTitleBarWindowAddedId);
            delete ws._noTitleBarWindowAddedId;
        })
        this._workspaces = []

        global.get_window_actors()
            .map(w => w.meta_window)
            .forEach(win => {
                let origState = this._getOriginalState(win);
                if (origState === WindowState.DEFAULT) {
                    this._setHideTitlebar(win, false);
                }

                if (win._noTitleBarOriginalState) {
                    delete win._noTitleBarOriginalState;
                }

                if (win._noTitleBarWindowID) {
                    delete win._noTitleBarWindowID;
                }
            });

        // Remove CSS Styles
        this._removeUserStyles();

        if (this._changeMonitorsID != null) {
            Meta.MonitorManager.get().disconnect(this._changeMonitorsID);
            this._changeMonitorsID = null;
        }

        if (this._focusWindowID != null) {
            global.display.disconnect(this._focusWindowID);
            this._focusWindowID = null;
        }

        if (this._sizeChangeID != null) {
            global.window_manager.disconnect(this._sizeChangeID);
            this._sizeChangeID = null;
        }

        if (this._onlyMainMonitorID != null) {
            this._settings.disconnect(this._onlyMainMonitorID);
            this._onlyMainMonitorID = null;
        }

        if (this._ignoreListID != null) {
            this._settings.disconnect(this._ignoreListID);
            this._ignoreListID = null;
        }

        if (this._ignoreListTypeID != null) {
            this._settings.disconnect(this._ignoreListTypeID);
            this._ignoreListTypeID = null;
        }
    }

    _nWorkspacesChanged() {
        for (let i = 0; i < ws_manager.n_workspaces; i++) {
            let ws = ws_manager.get_workspace_by_index(i);
            if (!this._workspaces.includes(ws)) {
                Utils.log_debug(`Workspace with index '${ws.workspace_index}' added`);
                this._workspaces.push(ws);
                // we need to add a Mainloop.idle_add, or else in _onWindowAdded the
                // window's maximized state is not correct yet.
                ws._noTitleBarWindowAddedId = ws.connect('window-added', (ws, win) => {
                    Mainloop.idle_add(() => this._onWindowAdded(win));
                });
            }
        }
    }

    _shouldHideTitlebar(win) {
        let hide = [3, 2].includes(win.get_maximized());
        if (hide && this._settings.get_boolean('only-main-monitor')) {
            hide = win.get_monitor() === Main.layoutManager.primaryIndex;
        }

        return hide;
    }

    _setHideTitlebar(win, hide) {
        if (Utils.isWindowIgnored(this._settings, win)) {
            Utils.log_debug(`Window '${win.get_title()}' ignored due to black/whitelist`);
            return;
        }

        if (win._noTitlebarHideState) {
            if ((hide && win._noTitlebarHideState === WindowState.HIDE_TITLEBAR)
                || (!hide && win._noTitlebarHideState !== WindowState.HIDE_TITLEBAR)) {
                Utils.log_debug(`Window '${win.get_title()}' already has correct hide state: ${win._noTitlebarHideState}`);
                return;
            }
        }

        let originalState = this._getOriginalState(win);

        if (originalState === WindowState.DEFAULT) {
            this._toggleDecorations(win, hide);
        } else {
            Utils.log_debug(`Skipping window '${win.get_title()}' because its window state was not default`);
        }
    }

    _getOriginalState(win) {
        if (win._noTitleBarOriginalState) {
            return win._noTitleBarOriginalState;
        }

        if (!win.decorated) {
            Utils.log_debug(`Window '${win.get_title()}' is undecorated`);
            return win._noTitleBarOriginalState = WindowState.UNDECORATED;
        }

        if (win.is_client_decorated()) {
            Utils.log_debug(`Window '${win.get_title()}' is client decorated`);
            return win._noTitleBarOriginalState = WindowState.CLIENT_DECORATED;
        }

        let winId = this._guessWindowXID(win);

        let xprops = GLib.spawn_command_line_sync(`xprop -id ${winId}`);
        if (!xprops[0]) {
            Utils.log_debug(`Unable to determine windows '${win.get_title()}' original state`);
            return win._noTitleBarOriginalState = WindowState.UNKNOWN;
        }

        return win._noTitleBarOriginalState = WindowState.DEFAULT;
    }

    _toggleDecorations(win, hide) {
        let windId = this._guessWindowXID(win);
        let prop = '_MOTIF_WM_HINTS';
        let value = '0x2, 0x0, %s, 0x0, 0x0'.format(hide ? '0x2' : '0x1');

        GLib.spawn_command_line_sync(`xprop -id ${windId} -f ${prop} 32c -set ${prop} "${value}"`);
        if (!hide && !win.titlebar_is_onscreen()) {
            Utils.log_debug(`Shoving titlebar onscreen for window '${win.get_title()}'`);
            win.shove_titlebar_onscreen();
        }
    }

    _toggleTitlebar(win) {
        win = (win !== undefined) ? win : global.display.focus_window;

        if (!win) {
            Utils.log_debug("Tried to toggle titlebar, but couldn't find focus window");
            return;
        }

        if (!win.decorated) {
            Utils.log_debug(`Window '${win.get_title()}' is not decorated, skipping it`);
            return;
        }

        if (win.get_window_type() !== Meta.WindowType.NORMAL) {
            Utils.log_debug(`Window '${win.get_title()}' is not a normal window, skipping it`);
            return;
        }

        let hide = this._shouldHideTitlebar(win);

        Utils.log_debug(`_toggleTitlebar: Window '${win.get_title()}' is maximized=${hide}`);
        this._setHideTitlebar(win, hide);
    }

    _onWindowAdded(win, retry) {
        if (win.window_type !== Meta.WindowType.NORMAL) {
            return;
        }

        if (win._noTitleBarOriginalState !== undefined) {
            return;
        }

        /**
         * Newly-created windows are added to the workspace before
         * the compositor knows about them: get_compositor_private() is null.
         * Additionally things like .get_maximized() aren't properly done yet.
         * (see workspace.js _doAddWindow)
         */
        if (!win.get_compositor_private()) {
            retry = (retry !== undefined) ? retry : 0;
            if (retry > 3) {
                return;
            }

            Mainloop.idle_add(() => this._onWindowAdded(win, retry + 1));
            return false;
        }

        retry = 2;

        Mainloop.idle_add(() => {
            if (!this._isEnabled) {
                return;
            }

            let id = this._guessWindowXID(win);
            if (!id) {
                return;
            }

            this._toggleTitlebar(win);
        });
    }

    /**
     * Guesses the X ID of a window.
     *
     * It is often in the window's title, being `"0x%x %10s".format(XID, window.title)`.
     * (See `mutter/src/core/window-props.c`).
     *
     * If we couldn't find it there, we use `win`'s actor, `win.get_compositor_private()`.
     * The actor's `x-window` property is the X ID of the window *actor*'s frame
     * (as opposed to the window itself).
     *
     * However, the child window of the window actor is the window itself, so by
     * using `xwininfo -children -id [actor's XID]` we can attempt to deduce the
     * window's X ID.
     *
     * It is not always foolproof, but works good enough for now.
     *
     * @param {Meta.Window} win - the window to guess the XID of. You wil get better
     * success if the window's actor (`win.get_compositor_private()`) exists.
     */
    _guessWindowXID(win) {
        // We cache the result so we don't need to redetect.
        if (win._noTitleBarWindowID) {
            Utils.log_debug(`Window info (cached): title='${win.get_title()}' xid=${win._noTitleBarWindowID}'`);
            return win._noTitleBarWindowID;
        }

        /**
         * If window title has non-utf8 characters, get_description() complains
         * "Failed to convert UTF-8 string to JS string: Invalid byte sequence in conversion input",
         * event though get_title() works.
         */
        try {
            let m = win.get_description().match(/0x[0-9a-f]+/);
            if (m && m[0]) {
                Utils.log_debug(`Window info: title='${win.get_title()}', type='${win.get_window_type()}', ` +
                    `xid=${m[0]}'`);
                return win._noTitleBarWindowID = m[0];
            }
        } catch (err) {
        }

        // use xwininfo, take first child.
        let act = win.get_compositor_private();
        let xwindow = act && act['x-window'];
        if (xwindow) {
            let xwininfo = GLib.spawn_command_line_sync('xwininfo -children -id 0x%x'.format(xwindow));
            if (xwininfo[0]) {
                let str = ByteArray.toString(xwininfo[1]);

                /**
                 * The X ID of the window is the one preceding the target window's title.
                 * This is to handle cases where the window has no frame and so
                 * act['x-window'] is actually the X ID we want, not the child.
                 */
                let regexp = new RegExp('(0x[0-9a-f]+) +"%s"'.format(win.title));
                let m = str.match(regexp);
                if (m && m[1]) {
                    Utils.log_debug(`Window info: title='${win.get_title()}', type='${win.get_window_type()}', ` +
                        `xid=${m[1]}'`);
                    return win._noTitleBarWindowID = m[1];
                }

                // Otherwise, just grab the child and hope for the best
                m = str.split(/child(?:ren)?:/)[1].match(/0x[0-9a-f]+/);
                if (m && m[0]) {
                    Utils.log_debug(`Window info: title='${win.get_title()}', type='${win.get_window_type()}', ` +
                        `xid=${m[0]}'`);
                    return win._noTitleBarWindowID = m[0];
                }
            }
        }

        // Try enumerating all available windows and match the title. Note that this
        // may be necessary if the title contains special characters and `x-window`
        // is not available.
        let result = GLib.spawn_command_line_sync('xprop -root _NET_CLIENT_LIST');
        if (result[0]) {
            let str = ByteArray.toString(result[1]);

            // Get the list of window IDs.
            if (str.match(/0x[0-9a-f]+/g) == null)
                return null;
            let windowList = str.match(/0x[0-9a-f]+/g);

            // For each window ID, check if the title matches the desired title.
            for (var i = 0; i < windowList.length; ++i) {
                let cmd = 'xprop -id "' + windowList[i] + '" _NET_WM_NAME _NO_TITLE_BAR_ORIGINAL_STATE';
                let result = GLib.spawn_command_line_sync(cmd);

                if (result[0]) {
                    let output = ByteArray.toString(result[1]);
                    let isManaged = output.indexOf("_NO_TITLE_BAR_ORIGINAL_STATE(CARDINAL)") > -1;
                    if (isManaged) {
                        continue;
                    }

                    let title = output.match(/_NET_WM_NAME(\(\w+\))? = "(([^\\"]|\\"|\\\\)*)"/);

                    // Is this our guy?
                    if (title && title[2] == win.title) {
                        Utils.log_debug(`Window info: title='${win.get_title()}', type='${win.get_window_type()}', ` +
                            `xid=${windowList[i]}'`);
                        return windowList[i];
                    }
                }
            }
        }

        // debugging for when people find bugs..
        Utils.log_debug(`Unable to determine xid for window title='${win.get_title()}', type='${win.get_window_type()}'`);
        return null;
    }

    /* CSS styles, for Wayland decorations
     */

    _updateUserStyles() {
        let styleContent = '';

        if (GLib.file_test(this._userStylesPath, GLib.FileTest.EXISTS)) {
            let fileContent = GLib.file_get_contents(this._userStylesPath);

            if (fileContent[0] == true) {
                styleContent = ByteArray.toString(fileContent[1]);
                styleContent = styleContent.replace(/@import.*no-title-bar@jonaspoehler\.de.*css['"]\);\n/g, '');
            }
        }

        return styleContent;
    }

    _addUserStyles() {
        let styleContent = this._updateUserStyles();
        let styleFilePath = Me.path + '/stylesheet.css';
        let styleImport = "@import url('" + styleFilePath + "');\n";

        styleFilePath = Me.path + '/stylesheet-tiled.css';
        styleImport += "@import url('" + styleFilePath + "');\n";

        GLib.file_set_contents(this._userStylesPath, styleImport + styleContent);
    }

    _removeUserStyles() {
        let styleContent = this._updateUserStyles();
        GLib.file_set_contents(this._userStylesPath, styleContent);
    }
}