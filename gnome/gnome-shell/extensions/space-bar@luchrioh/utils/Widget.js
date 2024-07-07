const Me = imports.misc.extensionUtils.getCurrentExtension();
const { Subject } = Me.imports.utils.Subject;
function onDestroyed(widget) {
    const subject = new Subject(void 0);
    widget.connect('destroy', () => {
        subject.next();
        subject.complete();
    });
    return subject;
}
