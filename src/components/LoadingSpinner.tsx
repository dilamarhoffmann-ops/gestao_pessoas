export default function LoadingSpinner() {
  return (
    <div className="jimu-loader-overlay" style={{ position: 'fixed', borderRadius: 0 }}>
      <div className="loader">
        <div className="jimu-primary-loading" />
      </div>
      <span className="jimu-loader-label">Carregando...</span>
    </div>
  );
}
