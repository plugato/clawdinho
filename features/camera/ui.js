// câmera ao vivo (MJPEG) dentro do balão
export default async ui => {
  const url = await ui.invoke('camera:url');
  ui.button('📷', 'Mostrar/esconder câmera', () => {
    if (ui.pic() === url) return ui.hidePic();
    ui.clear(); ui.showPic(url);
  });
};
