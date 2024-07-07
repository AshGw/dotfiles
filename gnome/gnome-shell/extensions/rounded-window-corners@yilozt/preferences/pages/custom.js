// imports.gi
import GObject      from 'gi://GObject'
import Gtk      from 'gi://Gtk'

// local modules
import { list_children, show_err_msg, TIPS_EMPTY } from '../../utils/prefs.js'
import { constants } from '../../utils/constants.js'
import { settings } from '../../utils/settings.js'
import { connections } from '../../utils/connections.js'
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'
import { AppRow } from '../widgets/app_row.js'
import { RoundedCornersItem } from '../widgets/rounded_corners_item.js'
import { uri } from '../../utils/io.js'

// --------------------------------------------------------------- [end imports]

export const Custom = GObject.registerClass (
  {
    Template: uri (import.meta.url, 'custom.ui'),
    GTypeName: 'RoundedWindowCornersPrefsCustomPage',
    InternalChildren: ['custom_group', 'add_row_btn'],
  },
  class extends Gtk.Box {
    _init () {
      super._init ()
      this._settings_cfg = settings ().custom_rounded_corner_settings

      for (const k in this._settings_cfg) {
        this.add_row (k, this._settings_cfg[k])
      }

      connections.get ().connect (this._add_row_btn, 'clicked', () => {
        const title = ''

        if (this._settings_cfg[title]) {
          this.show_exists_error_toast (title)
          return
        }

        const cfg = settings ().global_rounded_corner_settings
        this.add_row (title, cfg)

        this._settings_cfg[title] = cfg
      })
    }

    add_row (title, cfg) {
      let rounded_corners_item = new RoundedCornersItem ()

      const enabled_switch = new Gtk.Switch ({
        valign: Gtk.Align.CENTER,
        active: true,
        visible: true,
      })
      rounded_corners_item.cfg = cfg
      enabled_switch.active = cfg.enabled

      const handler = {
        on_delete: (row, title) => {
          if (rounded_corners_item != null) {
            const paddings_row = rounded_corners_item._paddings_row
            connections.get ().disconnect_all (paddings_row)
            rounded_corners_item.unwatch ()
            connections.get ().disconnect_all (enabled_switch)
            this._custom_group.remove (row)

            delete this._settings_cfg[title]
            settings ().custom_rounded_corner_settings = this._settings_cfg
          }
          rounded_corners_item = null
        },
        on_title_changed: (old_title, new_title) => {
          if (this._settings_cfg[new_title] !== undefined) {
            this.show_exists_error_toast (new_title)
            return false
          }

          const cfg = this._settings_cfg[old_title]
          delete this._settings_cfg[old_title]
          this._settings_cfg[new_title] = cfg

          settings ().custom_rounded_corner_settings = this._settings_cfg

          return true
        },
        on_open: (row) => {
          if (!rounded_corners_item) {
            return
          }
          const app_row = row
          rounded_corners_item.watch ((cfg) => {
            cfg.enabled = enabled_switch.active
            this._on_cfg_changed (app_row.title, cfg)
          })
          connections.get ().connect (enabled_switch, 'state-set', () => {
            if (!rounded_corners_item) {
              return
            }
            const cfg = rounded_corners_item.cfg
            cfg.enabled = enabled_switch.active
            this._on_cfg_changed (app_row.title, cfg)
            return false
          })
          connections
            .get ()
            .connect (app_row._expanded_list_box, 'row-activated', (me, row) => {
              if (!rounded_corners_item) {
                return
              }
              if (row == rounded_corners_item._paddings_row) {
                rounded_corners_item.update_revealer ()
              }
            })
        },
        on_close: () => {
          if (!rounded_corners_item) {
            return
          }
          connections.get ().disconnect_all (rounded_corners_item._paddings_row)
          rounded_corners_item.unwatch ()
          connections.get ().disconnect_all (enabled_switch)
        },
      }

      const expanded_row = new AppRow (handler)
      expanded_row.title = title
      expanded_row.activatable = false

      if (title == '') {
        expanded_row.description = TIPS_EMPTY ()
      }

      this._custom_group.append (expanded_row)

      const enabled_row = this.create_enabled_row (enabled_switch)

      add_row (expanded_row, enabled_row)

      list_children (rounded_corners_item)
        .filter ((child) => child.name != constants.DON_T_CONFIG)
        .forEach ((child) => {
          rounded_corners_item?.remove (child)
          add_row (expanded_row, child)
          enabled_switch.bind_property (
            'active',
            child,
            'sensitive',
            GObject.BindingFlags.SYNC_CREATE
          )
        })

      return expanded_row
    }

    show_exists_error_toast (item) {
      const title = `${item}: ` + _ ('Can\'t add to list, because it has exists')
      show_err_msg (title)
    }

    _on_cfg_changed (k, v) {
      this._settings_cfg[k] = v
      settings ().custom_rounded_corner_settings = this._settings_cfg
    }

    create_enabled_row (active_widget) {
      const row = new Gtk.ListBoxRow ()
      const title = new Gtk.Label ({
        label: _ ('Enable'),
        halign: Gtk.Align.START,
      })
      const description = new Gtk.Label ({
        label: _ ('Enable custom settings for this window'),
        halign: Gtk.Align.START,
        css_classes: ['caption'],
      })
      const hbox = new Gtk.Box ({
        valign: Gtk.Align.CENTER,
      })
      const vbox = new Gtk.Box ({
        orientation: Gtk.Orientation.VERTICAL,
        hexpand: true,
      })

      vbox.append (title)
      vbox.append (description)
      hbox.append (vbox)
      hbox.append (active_widget)
      row.set_child (hbox)

      return row
    }
  }
)

function add_row (parent, child) {
  parent.add_row (child)
}
