// A browser submits a form when Enter is pressed inside any single-line field, even
// if the user never touched the submit button. That is the right behaviour in a
// search box or a sign-in form, but on the publish, booking, and profile forms it
// can send or save something by accident.
//
// These forms attach this handler so Enter does nothing unless the focused element is
// already a control that acts on Enter (a button or a link).
export function blockImplicitSubmit(event) {
  if (event.key !== 'Enter') return;
  // Leave explicit shortcuts such as Ctrl+Enter alone.
  if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;

  const { target } = event;
  const tag = target?.tagName;
  // A textarea needs the newline, a link needs Enter to follow it, and a focused
  // button already activates on Enter, so none of those should be blocked.
  if (tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' || target?.isContentEditable) return;

  event.preventDefault();
}
