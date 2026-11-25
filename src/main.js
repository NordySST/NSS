// Inicialização: palco, tela cheia no primeiro toque, menu.
(function () {
  function boot() {
    UI.fitStage();
    window.addEventListener('resize', UI.fitStage);
    window.addEventListener('orientationchange', () => setTimeout(UI.fitStage, 200));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', UI.fitStage);
    document.addEventListener('fullscreenchange', () => setTimeout(UI.fitStage, 100));
    UI.initLongPress();
    // o primeiro toque pede tela cheia (o navegador pode recusar)
    document.addEventListener('pointerdown', function first() { UI.goFullscreen(); document.removeEventListener('pointerdown', first); }, { once: true });
    if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.__noSW) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    Screens.menu();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
