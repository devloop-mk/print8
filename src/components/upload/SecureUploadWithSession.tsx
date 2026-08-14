'use client';

import { SecureUpload } from '@/components/upload/SecureUpload';
import { TurnstileWidget } from '@/components/security/TurnstileWidget';
import { useUploadSessionGate } from '@/hooks/useUploadSessionGate';

interface SecureUploadWithSessionProps {
  onUpload: (fileId: string, originalName: string) => void;
  disabled?: boolean;
}

export function SecureUploadWithSession({
  onUpload,
  disabled,
}: SecureUploadWithSessionProps) {
  const {
    token,
    loading,
    error,
    pendingTurnstile,
    setTurnstileToken,
    refreshSession,
  } = useUploadSessionGate();

  return (
    <div>
      {pendingTurnstile ? (
        <TurnstileWidget
          onToken={setTurnstileToken}
          className="mb-3"
        />
      ) : null}
      <SecureUpload
        token={token}
        loading={loading}
        sessionError={error}
        onRefreshSession={() => refreshSession()}
        onUpload={onUpload}
        disabled={disabled}
      />
    </div>
  );
}
