export default ui => {
  ui.form.onsubmit = e => {
    e.preventDefault();
    const q = ui.input.value.trim();
    if (!q) return;
    ui.think(); ui.send('chat:ask', q, ui.pic()); ui.input.value = '';
  };
};
