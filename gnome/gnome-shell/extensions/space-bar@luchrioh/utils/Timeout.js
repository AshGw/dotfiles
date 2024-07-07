const Me = imports.misc.extensionUtils.getCurrentExtension();
const Mainloop = imports.mainloop;
const { GLib } = imports.gi;
var Timeout = class Timeout {
    constructor() {
        this._timeoutId = null;
    }
    destroy() {
        this._clearTimeout();
    }
    tick() {
        return new Promise((resolve) => {
            this._clearTimeout();
            this._timeoutId = Mainloop.timeout_add(0, () => {
                this._timeoutId = null;
                resolve();
            });
        });
    }
    _clearTimeout() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }
    }
}
