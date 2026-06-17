import React, { useRef, useEffect } from 'react';

export const CyberConfetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const colors = ['#00f0ff', '#ff003c', '#00ff66', '#ffee00'];

    for (let i = 0; i < 200; i++) {
        // Emit from center slightly dispersed
      particles.push({
        x: canvas.width / 2 + (Math.random() * 100 - 50),
        y: canvas.height / 2 + (Math.random() * 100 - 50),
        r: Math.random() * 4 + 1,
        dx: (Math.random() - 0.5) * 20,
        dy: (Math.random() - 0.5) * 20 - 5, // initial upward thrust
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: Math.random() * 0.01 + 0.005,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, index) => {
        p.x += p.dx;
        p.y += p.dy;
        p.life -= p.decay;
        
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();

        // Simple gravity and air resistance
        p.dy += 0.3; // gravity
        p.dx *= 0.98; // air resistance

        if (p.life <= 0) {
           particles.splice(index, 1);
        }
      });

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[60] pointer-events-none" />;
};
