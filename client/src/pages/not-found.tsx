export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 mystical-bg pt-32">
      <div className="text-center">
        <h1 className="text-6xl font-cinzel text-golden-amber mb-4"><span className="text-blood-red">⚠</span> 404 <span className="text-blood-red">⚠</span></h1>
        <p className="text-xl text-ritualistic-beige mb-8 font-garamond">O véu não pode ser erguido aqui...</p>
        <a 
          href="/" 
          className="veil-button px-6 py-3 text-golden-amber font-cinzel tracking-wide rounded hover:bg-golden-amber/10 transition-all duration-300"
        >
          Retornar ao Templo
        </a>
      </div>
    </div>
  );
}
