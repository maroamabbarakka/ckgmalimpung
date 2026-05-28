import ConnectionStatus from './ConnectionStatus';

export default function SyncStatusBanner({ className = '' }) {
  return <ConnectionStatus className={className} />;
}
