const Main = imports.ui.main;

const _handles = [];

function setStyle() {
    Main.panel.remove_style_class_name('solid');
    Main.panel.add_style_class_name('panel-transparency');

    if (Main.mmPanel) {
        for (var i = 0, len = Main.mmPanel.length; i < len; i++) {
            Main.mmPanel[i].remove_style_class_name('solid');
            Main.mmPanel[i].add_style_class_name('panel-transparency');
        }
    }
}

function enable() {
    setStyle();
    _handles.push(global.window_manager.connect('switch-workspace', () => {
        setStyle();
    }));
}

function disable() {
    _handles.splice(0).forEach(h => global.window_manager.disconnect(h));
}
