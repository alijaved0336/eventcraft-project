import { useCallback, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';

import { toast } from 'sonner';
import {
  MY_EXPORT_STATUS_QUERY,
  REQUEST_DATA_EXPORT_MUTATION,
  REQUEST_ACCOUNT_DELETION_MUTATION,
  CANCEL_ACCOUNT_DELETION_MUTATION,
} from '../graphql/operations';
import type { ExportStatus } from '../types';

import { CombinedGraphQLErrors } from '@apollo/client';

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (CombinedGraphQLErrors.is(err)) {
    return err.errors[0]?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

export const useDangerZone = () => {
  const [exportRequested, setExportRequested] = useState(false);

  const isTerminal = (status?: string) => status === 'ready' || status === 'expired';

  const {
    data: exportData,
    loading: exportLoading,
    refetch: refetchExport,
    startPolling,
    stopPolling,
  } = useQuery<{ myExportStatus: ExportStatus }>(MY_EXPORT_STATUS_QUERY);

  useEffect(() => {
    if (exportRequested && !isTerminal(exportData?.myExportStatus?.status)) {
      startPolling(5000);
    } else {
      stopPolling();
    }
  }, [exportRequested, exportData?.myExportStatus?.status, startPolling, stopPolling]);

  const [requestExportMutation] = useMutation(REQUEST_DATA_EXPORT_MUTATION);
  const [requestDeletionMutation] = useMutation(REQUEST_ACCOUNT_DELETION_MUTATION);
  const [cancelDeletionMutation] = useMutation(CANCEL_ACCOUNT_DELETION_MUTATION);

  const requestExport = useCallback(async () => {
    try {
      await requestExportMutation();
      setExportRequested(true);
      toast.success('Export requested. This might take a few moments.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to request export'));
    }
  }, [requestExportMutation]);

  const requestDeletion = useCallback(async () => {
    try {
      await requestDeletionMutation();
      toast.success('Account deletion scheduled (30-day grace period)');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to request account deletion'));
    }
  }, [requestDeletionMutation]);

  const cancelDeletion = useCallback(async () => {
    try {
      await cancelDeletionMutation();
      toast.success('Account deletion cancelled');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to cancel account deletion'));
    }
  }, [cancelDeletionMutation]);

  return {
    exportStatus: exportData?.myExportStatus,
    exportLoading,
    requestExport,
    requestDeletion,
    cancelDeletion,
    refetchExport,
  };
};
