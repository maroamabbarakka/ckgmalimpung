function PosBottomActionBar({
  backLabel,
  primaryLabel,
  loadingLabel = 'Menyimpan...',
  loading = false,
  onBack,
  secondaryAction = null,
}) {
  return (
    <div
      className={`workflow-action-bar pos-bottom-action-bar form-action-row ${secondaryAction ? 'has-secondary' : ''}`}
    >
      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="secondary-action w-full"
      >
        {backLabel}
      </button>
      {secondaryAction}
      <button
        type="submit"
        disabled={loading}
        className="primary-action w-full"
      >
        {loading ? loadingLabel : primaryLabel}
      </button>
    </div>
  );
}

export default PosBottomActionBar;
