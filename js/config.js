const getGameConfig = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Base dimensions
  const baseWidth = 1000;
  const baseHeight = 600;

  // Calculate responsive dimensions
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;

  // Calculate scale while maintaining aspect ratio
  const scaleX = maxWidth / baseWidth;
  const scaleY = maxHeight / baseHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculate final dimensions
  const width = Math.floor(baseWidth * scale);
  const height = Math.floor(baseHeight * scale);

  return {
    type: Phaser.AUTO,
    width: width,
    height: height,
    parent: 'game',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: GameScene
  };
}; 