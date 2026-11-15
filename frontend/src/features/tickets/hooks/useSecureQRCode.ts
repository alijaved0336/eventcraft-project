import { useState, useEffect } from 'react';
import { tokenStore } from '@/lib/auth/tokenStore';

/**
 * Hook to safely fetch and blob-URLify a secure QR code for ticket check-ins.
 * Leverages the in-memory tokenStore for authentication.
 */
export const useSecureQRCode = (issuanceId?: string | null) => {
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;
    const token = tokenStore.get();

    const fetchQRCode = async () => {
      if (!issuanceId || !token) {
        setQrBlobUrl(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/api/tickets/${issuanceId}/qr`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load QR code');
        }

        const blob = await response.blob();

        if (mounted) {
          objectUrl = URL.createObjectURL(blob);
          setQrBlobUrl(objectUrl);
        }
      } catch (err: unknown) {
        if (mounted) {
          const errorObject = err instanceof Error ? err : new Error(String(err));
          setError(errorObject);
          setQrBlobUrl(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchQRCode();

    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [issuanceId]);

  return { qrBlobUrl, isLoading, error };
};
